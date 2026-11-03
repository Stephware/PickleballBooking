import { NextRequest, NextResponse } from "next/server";
import { BodyTooLargeError, readLimitedText } from "@/lib/request-body";
import {
  adminCookieHeader, adminCsrf, adminError, backendAdmin, backendCookie,
  clearBackendSession, hasStaffCookie, relayJson, requestOriginValid,
  RESPONSE_HEADERS, setBackendSession,
} from "@/lib/admin-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Client receives only the profile, never backend cookies or antiforgery tokens.
export async function GET(request: NextRequest) {
  if (!hasStaffCookie(request)) return adminError("Not signed in.", 401);
  try {
    const backend = await backendAdmin("/api/v1/admin/auth/me", {}, adminCookieHeader(request));
    const result = await relayJson(backend);
    if (backend.status === 401 || backend.status === 403) clearBackendSession(result);
    return result;
  } catch { return adminError("Staff authentication service is unavailable.", 503); }
}

export async function POST(request: NextRequest) {
  if (!requestOriginValid(request)) return adminError("Invalid request origin.", 403);
  let body: { email?: unknown; password?: unknown } | null;
  try { body = JSON.parse(await readLimitedText(request, 4096)); }
  catch (cause) {
    return adminError(cause instanceof BodyTooLargeError
      ? "Login request is too large." : "Enter a valid email and password.",
    cause instanceof BodyTooLargeError ? 413 : 400);
  }
  if (typeof body?.email !== "string" || typeof body.password !== "string" ||
      body.email.length > 254 || body.password.length > 256)
    return adminError("Enter a valid email and password.", 400);
  try {
    // 1. Anonymous antiforgery cookie+token.
    const initial = await backendAdmin("/api/v1/admin/auth/csrf");
    if (!initial.ok) return adminError("Authentication cannot start.", 503);
    const firstCookie = backendCookie(initial, "pickleball.csrf");
    const csrf = (await initial.json() as { token?: string }).token;
    if (!firstCookie || !csrf) return adminError("Cannot initialize secure login.", 503);

    // 2. Authenticate through original .NET cookie+CSRF mechanism.
    const login = await backendAdmin("/api/v1/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password }),
    }, "pickleball.csrf=" + firstCookie, csrf);
    if (!login.ok) return relayJson(login);
    const staffTicket = backendCookie(login, "pickleball.staff");
    if (!staffTicket) return adminError("No staff session was issued.", 503);

    // 3. Reissue CSRF for the AUTHENTICATED identity (anonymous token is
    // not valid for authenticated mutations).
    const authenticated = await backendAdmin("/api/v1/admin/auth/csrf", {},
      "pickleball.csrf=" + firstCookie + "; pickleball.staff=" + staffTicket);
    if (!authenticated.ok) return adminError("Cannot initialize staff session.", 503);
    const newToken = (await authenticated.json() as { token?: string }).token;
    const finalCookie = backendCookie(authenticated, "pickleball.csrf") ?? firstCookie;
    if (!newToken) return adminError("No authenticated antiforgery token issued.", 503);
    const result = NextResponse.json(await login.json(), { headers: RESPONSE_HEADERS });
    setBackendSession(result, staffTicket, finalCookie, newToken);
    return result;
  } catch { return adminError("Authentication service is unavailable.", 503); }
}

export async function DELETE(request: NextRequest) {
  if (!requestOriginValid(request)) return adminError("Invalid request origin.", 403);
  if (!hasStaffCookie(request)) {
    const response = new NextResponse(null, { status: 204, headers: RESPONSE_HEADERS });
    clearBackendSession(response);
    return response;
  }
  const csrf = adminCsrf(request);
  if (!csrf) return adminError("Session verification expired. Sign in again.", 401);
  try {
    const backend = await backendAdmin("/api/v1/admin/auth/logout", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
    }, adminCookieHeader(request), csrf);
    if (!backend.ok && backend.status !== 401) return relayJson(backend);
    const result = new NextResponse(null, { status: 204, headers: RESPONSE_HEADERS });
    clearBackendSession(result);
    return result;
  } catch { return adminError("Unable to contact the sign-out service.", 503); }
}
