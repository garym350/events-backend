// tests/api.spec.ts
import request from "supertest";
import { describe, it, expect, afterAll, beforeAll } from "vitest";
import app from "../src/index.js";
import { db } from "../src/lib/firebaseAdmin.js";
import { createAdminSessionToken, hashAdminPasscode } from "../src/lib/adminAuth.js";

let createdEventId: string | null = null;
let createdSignupId: string | null = null;
let adminToken = "";

function futureIso(offsetMs: number) {
  return new Date(Date.now() + offsetMs).toISOString();
}

beforeAll(() => {
  process.env.ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "test-admin-session-secret";
  process.env.ADMIN_PASSCODE_HASH =
    process.env.ADMIN_PASSCODE_HASH || hashAdminPasscode("test-admin-passcode");
  adminToken = createAdminSessionToken().token;
});

describe("API", () => {
  //
  // --- Health ---
  //
  it("GET /health should return ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
  });

  //
  // --- Events ---
  //
  it("GET /events should return an array", async () => {
    const res = await request(app).get("/events");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /events without admin token should fail", async () => {
    const res = await request(app).post("/events").send({
      title: "Test Event",
      description: "A test event description",
      start: futureIso(3600 * 1000),
      end: futureIso(2 * 3600 * 1000),
      location: "Testville",
    });
    expect(res.status).toBe(401);
  });

  it("POST /events with wrong admin token should 401", async () => {
    const res = await request(app)
      .post("/events")
      .set("Authorization", "Bearer wrong-token")
      .send({
        title: "Bad Event",
        description: "desc desc desc",
        start: futureIso(3600 * 1000),
        end: futureIso(2 * 3600 * 1000),
        location: "Nowhere",
        priceType: "free",
      });
    expect(res.status).toBe(401);
  });

  it("POST /events with invalid end date should fail", async () => {
    const res = await request(app)
      .post("/events")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Invalid Event",
        description: "desc desc desc",
        start: new Date(Date.now() + 3600 * 1000).toISOString(),
        end: new Date().toISOString(), // end before start
        location: "BackwardsVille",
        priceType: "free",
      });
    expect(res.status).toBe(400);
  });

  it("POST /events with fixed price but no pricePence should fail", async () => {
    const res = await request(app)
      .post("/events")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Fixed Price Event",
        description: "desc desc desc",
        start: futureIso(3600 * 1000),
        end: futureIso(2 * 3600 * 1000),
        location: "Testville",
        priceType: "fixed",
      });
    expect(res.status).toBe(400);
  });

  it("POST /events with admin token should succeed", async () => {
    const res = await request(app)
      .post("/events")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Integration Test Event",
        description: "Integration test event description",
        start: futureIso(3600 * 1000),
        end: futureIso(2 * 3600 * 1000),
        location: "Testville",
        priceType: "free",
        capacity: 100,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("title", "Integration Test Event");
    expect(res.body).toHaveProperty("capacity", 100);

    createdEventId = res.body.id;
  });

  it("GET /events/:id should return created event", async () => {
    if (!createdEventId) throw new Error("No created event");
    const res = await request(app).get(`/events/${createdEventId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", createdEventId);
  });

  it("GET /events/:id should 404 for missing event", async () => {
    const res = await request(app).get("/events/nonexistent");
    expect(res.status).toBe(404);
  });

  //
  // --- Signups ---
  //
  it("POST /signups should fail if required fields missing", async () => {
    const res = await request(app).post("/signups").send({});
    expect(res.status).toBe(400);
  });

  it("POST /signups with invalid eventId should fail", async () => {
    const res = await request(app).post("/signups").send({
      eventId: "nonexistent",
      name: "Bad User",
      email: "bad@example.com",
    });
    expect(res.status).toBe(400);
  });

  it("POST /signups should succeed for valid event", async () => {
    if (!createdEventId) throw new Error("No created event");
    const res = await request(app).post("/signups").send({
      eventId: createdEventId,
      name: "Test User",
      email: "test@example.com",
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("eventId", createdEventId);
    expect(res.body).toHaveProperty("name", "Test User");
    expect(res.body).toHaveProperty("email", "test@example.com");
    createdSignupId = res.body.id;
  });

  //
  // --- ICS ---
  //
  it("GET /events/:id/ics should return an .ics file", async () => {
    if (!createdEventId) throw new Error("No created event");
    await new Promise((r) => setTimeout(r, 200));
    const res = await request(app).get(`/events/${createdEventId}/ics`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/calendar");
    expect(res.text).toContain("BEGIN:VEVENT");
    expect(res.text).toContain("END:VEVENT");
  });

  it("GET /events/:id/ics should 404 for missing event", async () => {
    const res = await request(app).get("/events/nonexistent/ics");
    expect(res.status).toBe(404);
  });
});

//
// --- Cleanup test data ---
//
afterAll(async () => {
  if (createdSignupId) {
    await db.collection("signups").doc(createdSignupId).delete();
    console.log("Deleted test signup:", createdSignupId);
  }
  if (createdEventId) {
    await db.collection("events").doc(createdEventId).delete();
    console.log("Deleted test event:", createdEventId);
  }
});
