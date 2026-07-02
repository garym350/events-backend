import { Router } from "express";
import {
  adminAuthConfigStatus,
  createAdminSessionToken,
  requireAdmin,
  verifyAdminPasscode,
} from "../lib/adminAuth.js";

const router = Router();

router.post("/login", (req, res) => {
  const passcode = typeof req.body?.passcode === "string" ? req.body.passcode : "";
  const status = adminAuthConfigStatus();

  if (!status.passcodeHashConfigured || !status.sessionSecretConfigured) {
    return res.status(500).json({
      error:
        "Admin login is not configured. Set ADMIN_PASSCODE_HASH and ADMIN_SESSION_SECRET on the backend.",
    });
  }

  if (!passcode.trim()) {
    return res.status(400).json({ error: "Please enter the admin passcode." });
  }

  if (!verifyAdminPasscode(passcode)) {
    return res.status(403).json({ error: "The admin passcode is incorrect." });
  }

  return res.json(createAdminSessionToken());
});

router.get("/session", requireAdmin, (_req, res) => {
  return res.json({ ok: true });
});

router.post("/logout", (_req, res) => {
  return res.json({ ok: true });
});

export default router;
