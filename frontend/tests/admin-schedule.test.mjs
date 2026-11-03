import assert from "node:assert/strict";
import test from "node:test";
import { extendStaffSlots, selectionAmount } from "../lib/admin-schedule.ts";
import { adminAllowed } from "../lib/admin-policy.ts";

function slot(hour, status = "AVAILABLE") {
  const start = new Date(Date.UTC(2026, 10, 4, hour, 0)).toISOString();
  const end = new Date(Date.UTC(2026, 10, 4, hour + 1, 0)).toISOString();
  return { startsAtUtc: start, endsAtUtc: end,
    startsAt: String(hour).padStart(2, "0") + ":00",
    endsAt: String(hour + 1).padStart(2, "0") + ":00",
    status, totalPrice: 250 };
}
test("selects adjacent slots and calculates the displayed estimate", () => {
  const a = slot(9), b = slot(10), c = slot(11);
  assert.deepEqual(extendStaffSlots([a], b, false), [a, b]);
  assert.deepEqual(extendStaffSlots([b, c], a, false), [a, b, c]);
  assert.equal(selectionAmount([a, b, c]), 750);
});
test("forbids unavailable and occupied slots for all staff operations", () => {
  for (const status of ["OCCUPIED", "BLOCKED", "PENDING", "ELAPSED", "UNAVAILABLE"]) {
    assert.equal(extendStaffSlots([], slot(9, status), true), null);
    assert.equal(extendStaffSlots([], slot(9, status), false), null);
  }
});
test("live walk-in selection applies only to the first current slot", () => {
  const now = slot(9, "WALK_IN_NOW"), next = slot(10);
  assert.equal(extendStaffSlots([], now, false), null);
  assert.deepEqual(extendStaffSlots([], now, true), [now]);
  assert.deepEqual(extendStaffSlots([now], next, true), [now, next]);
  assert.deepEqual(extendStaffSlots([next], now, true), [now, next]);
  const other = slot(11, "WALK_IN_NOW");
  assert.deepEqual(extendStaffSlots([next], other, true), [other]); // restarts, never appends a second live slot
});
test("range cannot exceed eight slots or skip unavailable intervals", () => {
  const range = Array.from({ length: 8 }, (_, i) => slot(i));
  assert.equal(extendStaffSlots(range, slot(8), false), null);
  assert.deepEqual(extendStaffSlots([slot(9)], slot(13), false), [slot(13)]);
});
test("tapping an existing slot restarts selection, allowing quick correction", () => {
  assert.deepEqual(extendStaffSlots([slot(9), slot(10)], slot(9), false), [slot(9)]);
});

test("only staff-authenticated gateway allowlist includes the new schedule route", () => {
  assert.equal(adminAllowed("GET", ["operations", "availability"]), true);
  assert.equal(adminAllowed("POST", ["operations", "availability"]), false);
  assert.equal(adminAllowed("GET", ["operations", "unrestricted"]), false);
});
