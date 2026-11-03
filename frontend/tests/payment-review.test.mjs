import assert from "node:assert/strict";
import test from "node:test";
import { reviewPriority, reviewPriorityLabel } from "../lib/payment-review.ts";

const now = Date.parse("2026-11-03T12:00:00Z");
const sample = { submittedAtUtc: "2026-11-03T11:45:00Z",
  startsAtUtc: "2026-11-03T15:00:00Z", bookingStatus: "AWAITING_REVIEW" };

test("submitted payment stays under review without deadline", () => {
  assert.equal(reviewPriority(sample, now), "NORMAL");
  assert.equal(reviewPriority({ ...sample, submittedAtUtc: "2026-11-03T10:59:59Z" }, now), "OVERDUE");
  assert.equal(reviewPriority({ ...sample, startsAtUtc: "2026-11-03T12:30:00Z" }, now), "STARTS_SOON");
  assert.equal(reviewPriority({ ...sample, startsAtUtc: "2026-11-03T11:30:00Z" }, now), "STARTED");
  assert.equal(reviewPriority({ ...sample, bookingStatus: "CANCELLED" }, now), "RECONCILE");
  assert.match(reviewPriorityLabel("RECONCILE"), /reconcile/i);
});
