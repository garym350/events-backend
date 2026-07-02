import { createHash, createHmac, timingSafeEqual } from "crypto";
import type { NextFunction, Request, Response } from "express";

const TOKEN_TTL_MS = Number.parseInt(process.env.ADMIN_SESSION_TTL_MS ?? "", 10) || 60 * 60 * 1000;

function configuredHash() {
  return (process.env.ADMIN_PASSCODE_HASH ?? process.env.ADMIN_PASSCODE_SHA256 ?? "")
    .trim()
    .toLowerCase()
    .replace(/^sha256:/, "");
}

function sessionSecret() {
  return (process.env.ADMIN_SESSION_SECRET ?? "").trim();
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function base64urlJson(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function signPayload(payloadB64: string) {
  const secret = sessionSecret();
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured");
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

export function hashAdminPasscode(passcode: string) {
  return createHash("sha256").update(passcode, "utf8").digest("hex");
}

export function adminAuthConfigStatus() {
  return {
    passcodeHashConfigured: configuredHash().length > 0,
    sessionSecretConfigured: sessionSecret().length > 0,
    tokenTtlMs: TOKEN_TTL_MS,
  };
}

export function verifyAdminPasscode(passcode: string) {
  const storedHash = configuredHash();
  if (!storedHash || !sessionSecret()) return false;
  const incomingHash = hashAdminPasscode(passcode.trim()).toLowerCase();
  return safeEqual(incomingHash, storedHash);
}

export function createAdminSessionToken() {
  const now = Date.now();
  const expiresAtMs = now + TOKEN_TTL_MS;
  const payload = {
    sub: "events-admin",
    iat: now,
    exp: expiresAtMs,
    v: 1,
  };
  const payloadB64 = base64urlJson(payload);
  return {
    token: `${payloadB64}.${signPayload(payloadB64)}`,
    expiresAt: new Date(expiresAtMs).toISOString(),
  };
}

export function verifyAdminToken(token: string): { ok: true } | { ok: false; error: string } {
  const [payloadB64, signature, ...extra] = token.split(".");
  if (!payloadB64 || !signature || extra.length > 0) {
    return { ok: false, error: "Please log in as an admin to continue." };
  }

  let expectedSignature: string;
  try {
    expectedSignature = signPayload(payloadB64);
  } catch {
    return { ok: false, error: "Admin session support is not configured on the server." };
  }

  if (!safeEqual(signature, expectedSignature)) {
    return { ok: false, error: "Your admin session is invalid. Please log in again." };
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (payload?.sub !== "events-admin" || payload?.v !== 1 || typeof payload?.exp !== "number") {
      return { ok: false, error: "Your admin session is invalid. Please log in again." };
    }
    if (payload.exp <= Date.now()) {
      return { ok: false, error: "Your admin session has expired. Please log in again." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Your admin session is invalid. Please log in again." };
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const raw = req.headers.authorization;
  const header = typeof raw === "string" ? raw.trim() : "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";

  if (!token) {
    res.status(401).json({ error: "Please log in as an admin to continue." });
    return;
  }

  const result = verifyAdminToken(token);
  if (!result.ok) {
    res.status(401).json({ error: result.error });
    return;
  }

  next();
}
