import { z } from "zod";

/** Reusable */
const isoDate = z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Please enter a valid event date and time.");
const nonEmpty = (label: string, min: number) =>
  z.string().trim().min(min, { message: `${label} must be at least ${min} characters.` });
const EVENT_DATE_RANGE_YEARS = 5;

function currentYearUtc(nowMs = Date.now()) {
  return new Date(nowMs).getUTCFullYear();
}

/** Event */
export const EventSchema = z.object({
  title: nonEmpty("Event title", 2),
  description: nonEmpty("Description", 10),
  location: nonEmpty("Location", 2),
  start: isoDate,
  end: isoDate,
  // We’ll normalize isPaid from priceType, but still allow it to come in:
  isPaid: z.boolean().optional().default(false),
  priceType: z.enum(["free", "fixed", "pay_what_you_feel"]).default("free"),
  pricePence: z.coerce.number().int().positive().optional().nullable(), // required if fixed
  capacity: z.coerce.number().int().positive().optional().nullable(),

  /** New: optional TMDb movie ID */
  movieId: z.string().trim().optional().nullable(),
})
.superRefine((data, ctx) => {
  // friendly backend date validation
  const startDate = new Date(data.start);
  const endDate = new Date(data.end);
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();

  if (Number.isFinite(startMs) && Number.isFinite(endMs)) {
    const nowMs = Date.now();
    const minYear = currentYearUtc(nowMs);
    const maxYear = minYear + EVENT_DATE_RANGE_YEARS;
    const startYear = startDate.getUTCFullYear();
    const endYear = endDate.getUTCFullYear();

    if (!(endMs > startMs)) {
      ctx.addIssue({
        path: ["end"],
        code: z.ZodIssueCode.custom,
        message: "The event end time must be after the start time.",
      });
    }

    if (startMs < nowMs) {
      ctx.addIssue({
        path: ["start"],
        code: z.ZodIssueCode.custom,
        message: "Events cannot be created in the past. Please choose a future start date.",
      });
    }

    if (startYear < minYear || startYear > maxYear) {
      ctx.addIssue({
        path: ["start"],
        code: z.ZodIssueCode.custom,
        message: `Event dates must be within the current year and the next ${EVENT_DATE_RANGE_YEARS} years.`,
      });
    }

    if (endYear < minYear || endYear > maxYear) {
      ctx.addIssue({
        path: ["end"],
        code: z.ZodIssueCode.custom,
        message: `Event dates must be within the current year and the next ${EVENT_DATE_RANGE_YEARS} years.`,
      });
    }
  }

  // price rules
  if (data.priceType === "fixed") {
    if (data.pricePence == null) {
      ctx.addIssue({
        path: ["pricePence"],
        code: z.ZodIssueCode.custom,
        message: "pricePence is required for fixed price events",
      });
    }
  } else {
    if (data.priceType === "free" && data.pricePence != null) {
      ctx.addIssue({
        path: ["pricePence"],
        code: z.ZodIssueCode.custom,
        message: "pricePence must be omitted for free events",
      });
    }
  }
})
.transform((data) => {
  // normalize isPaid from priceType
  const isPaid = data.priceType !== "free";
  return { ...data, isPaid };
});

export type EventInput = z.infer<typeof EventSchema>;

/** Signup */
export const SignupSchema = z.object({
  eventId: nonEmpty("Event ID", 1),
  name: nonEmpty("Name", 2),
  email: z.string().email(),
  amountPence: z.coerce.number().int().positive().optional(),
});

export type SignupInput = z.infer<typeof SignupSchema>;
