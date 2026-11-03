export { adminAllowed } from "@/lib/admin-policy";
import { NextRequest, NextResponse } from "next/server";
import { headers as incomingHeaders } from "next/headers";
import { backendHeaders } from "@/lib/backend-headers";
import { apiOrigin } from "@/lib/server-api";

const adminCookies = {
  staff: "pb_admin_staff",
  antiforgery: "pb_admin_antiforgery",
  csrf: "pb_admin_csrf",
} as const;
export const ADMIN_COOKIE_NAMES = adminCookies;

export const RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

export function requestOriginValid(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (process.env.NODE_ENV === "production" && !process.env.APP_ORIGIN) return false;
  return Boolean(origin && origin === (process.env.APP_ORIGIN || request.nextUrl.origin));
}

export function adminCookieHeader(request: NextRequest): string {
  const staff = request.cookies.get(adminCookies.staff)?.value;
  const anti = request.cookies.get(adminCookies.antiforgery)?.value;
  return [
    staff ? "pickleball.staff=" + staff : "",
    anti ? "pickleball.csrf=" + anti : "",
  ].filter(Boolean).join("; ");
}

export function hasStaffCookie(request: NextRequest) {
  return Boolean(request.cookies.get(adminCookies.staff)?.value);
}

export function adminCsrf(request: NextRequest) {
  return request.cookies.get(adminCookies.csrf)?.value;
}

export function backendCookie(response: Response, name: string): string | null {
  const values = response.headers.getSetCookie();
  for (const value of values) {
    const first = value.split(";")[0];
    if (first.startsWith(name + "=")) return first.slice(name.length + 1);
  }
  return null;
}

export async function backendAdmin(
  path: string, init: RequestInit = {},
  cookie = "", csrf?: string,
): Promise<Response> {
  if (!path.startsWith("/api/v1/admin/")) throw new Error("Admin URL must be allowlisted.");
  const headers = new Headers(init.headers);
  backendHeaders(await incomingHeaders()).forEach((value, name) => headers.set(name, value));
  if (cookie) headers.set("Cookie", cookie);
  if (csrf) headers.set("X-CSRF-TOKEN", csrf);
  const response = await fetch(new URL(path, apiOrigin()), {
    ...init,
    headers,
    cache: "no-store",
    redirect: "manual",
    signal: AbortSignal.timeout(25000),
  });
  if (response.status >= 300 && response.status < 400)
    throw new Error("Unexpected backend redirect.");
  return response;
}

export async function relayJson(response: Response): Promise<NextResponse> {
  const status = [200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 503].includes(response.status)
    ? response.status : 502;
  if (status === 204)
    return new NextResponse(null, { status, headers: RESPONSE_HEADERS });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = payload as { error?: unknown } | null;
    return NextResponse.json({
      error: typeof detail?.error === "string" && detail.error.length < 400
        ? detail.error : "This admin operation could not be completed.",
    }, { status, headers: RESPONSE_HEADERS });
  }
  return NextResponse.json(payload, { status, headers: RESPONSE_HEADERS });
}

export function adminError(message: string, status: number) {
  return NextResponse.json({ error: message }, {
    status, headers: RESPONSE_HEADERS,
  });
}

export function setBackendSession(
  response: NextResponse, staff: string, anti: string, csrf: string,
) {
  const secure = process.env.NODE_ENV === "production";
  // Cookie values are opaque signed .NET tickets/CSRF tokens. Never expose to JS.
  for (const [name, value] of [
    [adminCookies.staff, staff],
    [adminCookies.antiforgery, anti],
    [adminCookies.csrf, csrf],
  ]) {
    response.cookies.set(name, value, {
      httpOnly: true, secure, sameSite: "strict",
      path: "/api/admin", maxAge: 60 * 60 * 8,
    });
  }
}

export function clearBackendSession(response: NextResponse) {
  for (const name of Object.values(adminCookies)) {
    response.cookies.set(name, "", {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "strict", path: "/api/admin", maxAge: 0,
    });
  }
}

