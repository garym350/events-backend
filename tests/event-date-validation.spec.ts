import { describe, expect, it } from "vitest";
import { EventSchema } from "../src/lib/schemas.js";

function validEvent(overrides: Record<string, unknown> = {}) {
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  return {
    title: "Future Film Night",
    description: "A valid future event description.",
    location: "Main Screen",
    start: start.toISOString(),
    end: end.toISOString(),
    priceType: "free",
    ...overrides,
  };
}

function issueMessages(result: ReturnType<typeof EventSchema.safeParse>) {
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe("EventSchema backend date validation", () => {
  it("accepts a valid future event inside the supported date range", () => {
    const result = EventSchema.safeParse(validEvent());
    expect(result.success).toBe(true);
  });

  it("rejects an event whose end time is not after its start time", () => {
    const start = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const result = EventSchema.safeParse(validEvent({ start, end: start }));

    expect(result.success).toBe(false);
    expect(issueMessages(result)).toContain("The event end time must be after the start time.");
  });

  it("rejects an event that starts in the past", () => {
    const start = new Date(Date.now() - 60 * 60 * 1000);
    const end = new Date(Date.now() + 60 * 60 * 1000);
    const result = EventSchema.safeParse(validEvent({ start: start.toISOString(), end: end.toISOString() }));

    expect(result.success).toBe(false);
    expect(issueMessages(result)).toContain("Events cannot be created in the past. Please choose a future start date.");
  });

  it("rejects event dates more than five years ahead", () => {
    const tooFar = new Date(Date.now());
    tooFar.setUTCFullYear(tooFar.getUTCFullYear() + 6);
    const tooFarEnd = new Date(tooFar.getTime() + 2 * 60 * 60 * 1000);
    const result = EventSchema.safeParse(validEvent({ start: tooFar.toISOString(), end: tooFarEnd.toISOString() }));

    expect(result.success).toBe(false);
    expect(issueMessages(result)).toContain("Event dates must be within the current year and the next 5 years.");
  });
});
