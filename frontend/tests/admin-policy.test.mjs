import assert from "node:assert/strict";
import test from "node:test";
import { adminAllowed } from "../lib/admin-policy.ts";

const valid = {
  GET: [
    "courts", "courts/15", "venue", "venue/hours", "pricing/rules",
    "bookings", "payments/pending", "payments/bookings/PB-ABCDEF0123456789",
    "payments/4/proof", "operations/blocks", "staff",
  ],
  POST: [
    "courts", "pricing/rules", "staff", "operations/manual-bookings",
    "operations/blocks", "auth/change-password",
    "bookings/PB-ABCDEF0123456789/confirm",
    "bookings/PB-ABCDEF0123456789/cancel",
    "payments/bookings/PB-ABCDEF0123456789",
    "payments/4/approve", "payments/4/reject",
    "payments/4/record-refund", "operations/blocks/4/remove",
    "staff/4/reset-password",
  ],
  PUT: ["venue", "venue/hours", "courts/15", "pricing/rules/8"],
  PATCH: ["pricing/rules/8/deactivate", "staff/7/active"],
};
for (const [method, paths] of Object.entries(valid)) {
  test("Admin gateway allows only documented " + method + " routes", () => {
    for (const path of paths) {
      assert.equal(adminAllowed(method, path.split("/")), true,
        "Should allow " + method + " " + path);
    }
  });
}
test("Admin gateway denies arbitrary or hostile destinations", () => {
  const rejected = [
    ["GET", "https:/evil.invalid"], ["GET", "auth/csrf"], ["GET", "system/status"],
    ["GET", "payments/0/proof"], ["GET", "payments/4/proof/extra"],
    ["GET", "bookings/PB-abcdef0123456789"], ["POST", "staff/1/active"],
    ["POST", "bookings/PB-ABCDEF0123456789/delete"],
    ["PUT", "payments/1/approve"], ["DELETE", "staff/1"],
    ["GET", "users/admin"], ["POST", "sessions/../payments/4/approve"],
    ["GET", "payments/1/proof?foo=bar"], ["GET", "operations/blocks/1/remove"],
  ];
  for (const [method, path] of rejected) {
    assert.equal(adminAllowed(method, path.split("/")), false,
      "Should deny " + method + " " + path);
  }
});
test("No generic administrative proxy action is allowed", () => {
  for (const method of ["HEAD", "OPTIONS", "DELETE", "TRACE"])
    assert.equal(adminAllowed(method, ["courts"]), false);
});
