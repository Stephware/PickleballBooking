import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

// Install Playwright separately or provide its module path; it is not a runtime dependency.
const { chromium } = await import(process.env.E2E_PLAYWRIGHT_MODULE || "playwright");
const AxeBuilder = process.env.E2E_AXE_MODULE ? (await import(process.env.E2E_AXE_MODULE)).default : null;
const origin = process.env.E2E_ORIGIN || "http://localhost:3099";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname),
  "Use a local server backed by a disposable database.");
const output = process.env.E2E_OUTPUT || "/tmp/pickleball-browser";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.E2E_CHROME ? { executablePath: process.env.E2E_CHROME } : {}),
});
const context = await browser.newContext();
const page = await context.newPage();
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const evidence = [];
let proofBookingUrl;
const widths = [320, 375, 768, 1024];
async function checkLayout(label, width) {
  const dimensions = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth, viewport: innerWidth,
  }));
  assert.ok(dimensions.content <= dimensions.viewport + 1,
    `${label} overflows at ${width}: ${JSON.stringify(dimensions)}`);
  evidence.push(`${label}:${width}`);
  if (AxeBuilder && width === 375) {
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    assert.deepEqual(result.violations.map(violation => ({
      rule: violation.id, elements: violation.nodes.map(node => node.target),
    })), [], `${label} accessibility checks`);
  }
}
try {
  const venue = await (await context.request.get(origin + "/api/player/venue")).json();
  assert.equal(venue.venueSlug, process.env.E2E_VENUE_SLUG || "phase9-test-venue",
    "The browser harness requires the explicitly selected disposable venue.");
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    for (const [route, label] of [["/", "player"], ["/find-booking", "lookup"], ["/admin", "staff-login"]]) {
      await page.goto(origin + route);
      await page.waitForLoadState("networkidle");
      await checkLayout(label, width);
      await page.screenshot({ path: `${output}/${label}-${width}.png`, fullPage: true });
    }
  }
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(origin);
  await page.getByRole("button", { name: "Next day" }).click();
  await page.locator(".slot-cell.slot-available").first().click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill("Browser Test Guest");
  await page.getByRole("button", { name: /Hold court/ }).click();
  await page.locator("#booking-error").waitFor();
  assert.equal(await page.locator("#booking-error").evaluate(el => el === document.activeElement), true);
  await page.getByRole("link", { name: "Add a mobile number" }).click();
  assert.equal(await page.locator("#booking-phone").evaluate(el => el === document.activeElement), true);
  await checkLayout("booking-form", 375);
  await page.screenshot({ path: `${output}/booking-form-375.png`, fullPage: true });

  if (process.env.E2E_MUTATIONS === "true") {
    await page.locator("#booking-phone").fill("09000000000");
    const attempts = [];
    await page.route("**/api/player/bookings", async route => {
      attempts.push(route.request().postDataJSON());
      const response = await route.fetch();
      const payload = await response.json();
      assert.equal(payload.accessToken, undefined, "No bearer token may reach browser JavaScript");
      assert.equal(response.status(), 201);
      if (attempts.length === 1)
        await route.fulfill({ status: 503, json: { error: "Synthetic response loss. Retry the same request." } });
      else await route.fulfill({ response });
    });
    await page.getByRole("button", { name: /Hold court/ }).click();
    await page.getByText("Synthetic response loss. Retry the same request.").waitFor();
    await page.getByRole("button", { name: /Hold court/ }).click();
    await page.waitForURL(/\/booking\/PB-/);
    await page.getByRole("heading", { name: "Court temporarily held" }).waitFor();
    assert.equal(attempts.length, 2);
    assert.deepEqual(attempts[0], attempts[1], "Retry preserves the original idempotency intent");
    const guest = (await context.cookies()).filter(cookie => cookie.name.startsWith("pb_guest_"));
    assert.equal(guest.length, 1);
    assert.equal(guest[0].httpOnly, true);
    assert.equal(guest[0].secure, true);
    assert.equal(guest[0].sameSite, "Lax");
    assert.equal(await page.evaluate(() => document.cookie.includes("pb_guest_")), false);
    await page.reload();
    await page.getByRole("heading", { name: "Court temporarily held" }).waitFor();
    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "Cancel this hold", exact: true }).click();
    await page.getByRole("heading", { name: "Booking cancelled", exact: true }).waitFor();
    evidence.push("guest-hold:retry:private-cookie:reload:cancel");
    await page.unroute("**/api/player/bookings");
    if (process.env.E2E_STAFF_EMAIL && process.env.E2E_STAFF_PASSWORD) {
      await page.goto(origin);
      await page.getByRole("button", { name: "Next day" }).click();
      await page.locator(".slot-cell.slot-available").first().click();
      await page.getByRole("button", { name: "Continue" }).click();
      await page.getByRole("textbox", { name: "Full name" }).fill("Browser Payment Test Guest");
      await page.locator("#booking-phone").fill("09000000000");
      await page.getByRole("button", { name: /Hold court/ }).click();
      await page.waitForURL(/\/booking\/PB-/);
      proofBookingUrl = page.url();
      await page.getByRole("heading", { name: "Submit your receipt" }).waitFor();
      await page.getByLabel("Transaction reference").fill("BROWSER-TEST-" + Date.now());
      const receipt = { name: "synthetic-receipt.png", mimeType: "image/png",
        buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=", "base64") };
      await page.locator('input[type="file"]').setInputFiles(receipt);
      await page.getByRole("img", { name: "Preview of the receipt you selected" }).waitFor();
      await page.getByRole("button", { name: "Remove file", exact: true }).click();
      assert.equal(await page.locator('input[type="file"]').inputValue(), "");
      await page.locator('input[type="file"]').setInputFiles(receipt);
      await page.getByRole("button", { name: "Submit receipt for review" }).click();
      await page.getByRole("heading", { name: "Payment proof received" }).waitFor();
      evidence.push("receipt:preview:remove:reselect:upload:awaiting-review");
    }
  }

  const tomorrow = await page.evaluate(() => {
    const date = new Date(); date.setUTCDate(date.getUTCDate() + 1); return date.toISOString().slice(0, 10);
  });
  const day = await (await context.request.get(origin + "/api/player/availability?date=" + tomorrow)).json();
  assert.ok(day.courts?.length > 0, "Synthetic venue must have published courts");
  for (const count of [1, 3, 8, 12]) {
    await page.route("**/api/player/availability?*", route => route.fulfill({
      json: { ...day, courts: Array.from({ length: count }, (_, i) => ({
        ...day.courts[0], courtId: i + 1, courtName: `Layout Test Court ${i + 1}`,
      })) },
    }));
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(origin);
      await page.getByRole("region", { name: "Court and time schedule" }).waitFor();
      assert.equal(await page.locator(".court-heading").count(), count);
      await checkLayout(`schedule-${count}-courts`, width);
    }
    await page.unroute("**/api/player/availability?*");
  }
  for (const [name, payload, status] of [
    ["closed", { ...day, isClosed: true }, 200],
    ["empty", { ...day, courts: [] }, 200],
    ["network-error", { error: "Synthetic availability outage" }, 503],
  ]) {
    await page.route("**/api/player/availability?*", route => route.fulfill({ status, json: payload }));
    await page.goto(origin);
    await page.waitForLoadState("networkidle");
    assert.equal(await page.locator(".slot-cell").count(), 0);
    await checkLayout(name, 1024);
    await page.unroute("**/api/player/availability?*");
  }

  if (process.env.E2E_STAFF_EMAIL && process.env.E2E_STAFF_PASSWORD) {
    await page.goto(origin + "/admin");
    await page.getByRole("textbox", { name: "Email address" }).fill(process.env.E2E_STAFF_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill(process.env.E2E_STAFF_PASSWORD);
    await page.getByRole("button", { name: "Sign in to dashboard" }).click();
    await page.locator(".admin-user").waitFor();
    const cookies = (await context.cookies()).filter(cookie => cookie.name.startsWith("pb_admin_"));
    assert.equal(cookies.length, 3);
    for (const cookie of cookies) {
      assert.equal(cookie.httpOnly, true);
      assert.equal(cookie.sameSite, "Strict");
      assert.equal(cookie.path, "/api/admin");
      assert.equal(cookie.secure, true, "Run against the production frontend");
    }
    assert.equal(await page.evaluate(() => document.cookie.includes("pb_admin_")), false);
    if (proofBookingUrl) {
      const code = new URL(proofBookingUrl).pathname.split("/").at(-1);
      await page.getByRole("navigation", { name: "Staff navigation" })
        .getByRole("button", { name: "Payments", exact: true }).click();
      await page.locator(".admin-queue-item").filter({ hasText: code }).click();
      await page.getByRole("button", { name: "Approve verified payment" }).waitFor();
      const image = page.getByRole("img", { name: "Submitted payment proof; compare against actual transfer records" });
      await page.waitForFunction(() => {
        const img = document.querySelector(".admin-proof img"); return img?.complete && img.naturalWidth > 0;
      });
      const proofPath = await image.getAttribute("src");
      assert.equal((await context.request.get(origin + proofPath)).status(), 200);
      const anonymous = await browser.newContext();
      assert.equal((await anonymous.request.get(origin + proofPath)).status(), 401);
      await anonymous.close();
      page.once("dialog", dialog => dialog.accept());
      await page.getByRole("button", { name: "Approve verified payment" }).click();
      await page.getByText("Payment marked verified after review.").waitFor();
      await page.goto(proofBookingUrl);
      await page.getByRole("heading", { name: "Your court is confirmed!" }).waitFor();
      evidence.push("staff:private-proof:anonymous-denial:approve:guest-confirmed");
      await page.goto(origin + "/admin");
      await page.locator(".admin-user").waitFor();
    }
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      if (width <= 950) {
        assert.equal(await page.locator(".admin-sidebar").isVisible(), false);
        await page.getByRole("button", { name: "Open navigation" }).click();
        assert.equal(await page.locator(".admin-main").getAttribute("inert"), "");
        await page.keyboard.press("Shift+Tab");
        assert.equal(await page.getByRole("button", { name: "Sign out", exact: true })
          .evaluate(el => el === document.activeElement), true);
        await page.keyboard.press("Escape");
        assert.equal(await page.getByRole("button", { name: "Open navigation" })
          .evaluate(el => el === document.activeElement), true);
      }
      const mainNav = page.getByRole("navigation", { name: "Staff navigation" });
      assert.equal(await mainNav.getByRole("button", { name: "Team accounts" }).count(), 0);
      assert.equal(await mainNav.getByRole("button", { name: "Venue settings" }).count(), 0);
      for (const title of ["Today", "Schedule", "Payments", "Manage", "My Account"]) {
        if (width <= 950) await page.getByRole("button", { name: "Open navigation" }).click();
        await mainNav.getByRole("button", { name: title, exact: true }).click();
        await page.waitForLoadState("networkidle");
        await checkLayout(title, width);
        if (title === "Schedule") {
          const tabs = page.getByRole("navigation", { name: "Schedule actions" });
          await tabs.getByRole("button", { name: "Add Booking", exact: false }).click();
          await page.getByRole("heading", { name: "Add Booking" }).waitFor();
          await checkLayout("Add Booking", width);
          await tabs.getByRole("button", { name: "Block Court" }).click();
          await page.getByRole("heading", { name: "Block Court" }).waitFor();
          await checkLayout("Block Court", width);
          await tabs.getByRole("button", { name: "Reservations" }).click();
        }
        if (title === "Manage") {
          const tabs = page.getByRole("navigation", { name: "Manage venue operations" });
          for (const tab of ["Pricing", "Opening Hours", "Courts"]) {
            await tabs.getByRole("button", { name: tab, exact: true }).click();
            await page.waitForLoadState("networkidle");
            await checkLayout("Manage " + tab, width);
          }
        }
      }
      await page.screenshot({ path: `${output}/admin-account-${width}.png`, fullPage: true });
    }
    const badOrigin = await context.request.post(origin + "/api/admin/courts", {
      headers: { Origin: "https://untrusted.example" }, data: {},
    });
    assert.equal(badOrigin.status(), 403);
    if ((await page.viewportSize()).width <= 950)
      await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.getByRole("button", { name: "Sign in to dashboard" }).waitFor();
    assert.equal((await context.cookies()).filter(cookie => cookie.name.startsWith("pb_admin_")).length, 0);
  }
  assert.deepEqual(errors, [], "No browser runtime errors");
  console.log(JSON.stringify({ checked: evidence, screenshots: output, runtimeErrors: errors }, null, 2));
} finally { await browser.close(); }
