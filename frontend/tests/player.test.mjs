import assert from "node:assert/strict";
import test from "node:test";
import {
  safeBrandColor, brandStyle, canExtend, addDays, dateInZone,
  timeLabel, money, slotMeta,
} from "../lib/player.ts";

function slot(start, end, status = "AVAILABLE") {
  return {
    startsAt: start.slice(11, 16),
    endsAt: end.slice(11, 16),
    startsAtUtc: start,
    endsAtUtc: end,
    status,
    totalPrice: 250,
  };
}

test("adjacent slots on one court extend in either direction", () => {
  const a = slot("2026-11-04T09:00:00Z", "2026-11-04T10:00:00Z");
  const b = slot("2026-11-04T10:00:00Z", "2026-11-04T11:00:00Z");
  const c = slot("2026-11-04T08:00:00Z", "2026-11-04T09:00:00Z");
  assert.deepEqual(canExtend([a], b), [a, b]);
  assert.deepEqual(canExtend([a], c), [c, a]);
  assert.deepEqual(canExtend([a, b], b), [b]);
});

test("unavailable slots cannot be selected or appended", () => {
  const booked = slot("2026-11-04T10:00:00Z", "2026-11-04T11:00:00Z", "OCCUPIED");
  assert.equal(canExtend([], booked), null);
  assert.equal(canExtend([slot("2026-11-04T09:00:00Z", "2026-11-04T10:00:00Z")], booked), null);
});

test("selection is capped to eight consecutive complete slots", () => {
  const range = Array.from({ length: 8 }, (_, i) =>
    slot(
      new Date(Date.UTC(2026, 10, 4, i, 0)).toISOString(),
      new Date(Date.UTC(2026, 10, 4, i + 1, 0)).toISOString()
    ));
  const ninth = slot("2026-11-04T08:00:00.000Z", "2026-11-04T09:00:00.000Z");
  assert.equal(canExtend(range, ninth), null);
});

test("venue time zone—not browser time zone—determines today's date", () => {
  const instant = new Date("2026-11-03T19:00:00Z"); // Nov 4, Manila
  assert.equal(dateInZone("Asia/Manila", instant), "2026-11-04");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(timeLabel("13:30:00"), "1:30 PM");
});

test("venue-supplied colors are validated and have contrasting foreground", () => {
  assert.equal(safeBrandColor("red", "#176e4b"), "#176e4b");
  const light = brandStyle({ primaryColor: "#ffffd0", secondaryColor: "#ffffff" });
  const dark = brandStyle({ primaryColor: "#12422b", secondaryColor: "#f5f5f5" });
  assert.equal(light["--brand-ink"], "#102018");
  assert.equal(dark["--brand-ink"], "#ffffff");
  const tint = brandStyle({ primaryColor: "#000000", secondaryColor: "#000000" });
  assert.equal(tint["--brand-tint"], "#d6d6d6");
});

test("status labels are available independently of colors", () => {
  for (const name of ["AVAILABLE", "OCCUPIED", "PENDING", "ELAPSED", "BLOCKED", "UNAVAILABLE"])
    assert.ok(slotMeta[name].label.length > 3);
  assert.match(money(250, "PHP"), /250/);
});
