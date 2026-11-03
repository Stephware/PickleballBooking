import { NextRequest, NextResponse } from "next/server";
import { backendHeaders } from "@/lib/backend-headers";
import { apiOrigin } from "@/lib/server-api";
import { BodyTooLargeError, readLimitedBody, readLimitedText } from "@/lib/request-body";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const codePattern = /^PB-[0-9A-F]{16}$/;
const secretName = (code: string) => "pb_guest_" + code;
const noStore = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: noStore });
}
function validPostOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  // Set APP_ORIGIN to the public HTTPS origin on production reverse proxies.
  if (process.env.NODE_ENV === "production" && !process.env.APP_ORIGIN) return false;
  return Boolean(origin && origin === (process.env.APP_ORIGIN || request.nextUrl.origin));
}
async function upstream(path: string, init: RequestInit = {}, token?: string, incoming?: Headers) {
  const headers = new Headers(init.headers);
  if (token) headers.set("X-Booking-Token", token);
  if (incoming) backendHeaders(incoming).forEach((value, name) => headers.set(name, value));
  const response = await fetch(new URL(path, apiOrigin()), {
    ...init, headers, cache: "no-store",
    signal: AbortSignal.timeout(25000), redirect: "manual",
  });
  if (response.status >= 300 && response.status < 400)
    throw new Error("Unexpected upstream redirect");
  const data: unknown = await response.json().catch(() => null);
  const details = data as { error?: unknown } | null;
  const message = typeof details?.error === "string" && details.error.length < 300
    ? details.error : "Request could not be completed.";
  return { response, data, message };
}
function sanitizeStatus(status: number) {
  return [200, 201, 400, 401, 403, 404, 409, 413, 422, 429, 503].includes(status)
    ? status : 502;
}
function proxy(data: unknown, status: number, message: string) {
  return NextResponse.json(status >= 400 ? { error: message } : data, {
    status: sanitizeStatus(status), headers: noStore,
  });
}
function storeToken(out: NextResponse, code: string, token: string) {
  out.cookies.set(secretName(code), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/player/bookings",
    maxAge: 60 * 60 * 24 * 30,
  });
}
type Context = { params: Promise<{ segments: string[] }> };

async function handle(request: NextRequest, context: Context, method: "GET" | "POST") {
  const { segments } = await context.params;
  const upstreamForRequest = (path: string, init: RequestInit = {}, token?: string) =>
    upstream(path, init, token, request.headers);
  if (segments.length > 4) return error("Not found.", 404);
  if (method === "POST" && !validPostOrigin(request))
    return error("Invalid request origin. Reload the page and retry.", 403);

  const path = segments.join("/");
  const code = segments[0] === "bookings" && segments.length > 1 ? segments[1] : null;
  if (code && !codePattern.test(code)) return error("Booking not found.", 404);
  const token = code ? request.cookies.get(secretName(code))?.value : undefined;
  try {
    if (method === "GET") {
      if (path === "venue") {
        const result = await upstreamForRequest("/api/v1/venue");
        return proxy(result.data, result.response.status, result.message);
      }
      if (path === "availability") {
        const date = request.nextUrl.searchParams.get("date");
        const courtId = request.nextUrl.searchParams.get("courtId");
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
            (courtId && !/^[1-9]\d{0,15}$/.test(courtId)))
          return error("Choose a valid booking date and court.", 400);
        const query = new URLSearchParams({ date });
        if (courtId) query.set("courtId", courtId);
        const result = await upstreamForRequest("/api/v1/availability?" + query.toString());
        return proxy(result.data, result.response.status, result.message);
      }
      if (code && segments.length === 2) {
        if (!token) return error("Booking access required.", 404);
        const result = await upstreamForRequest("/api/v1/bookings/" + code, {}, token);
        return proxy(result.data, result.response.status, result.message);
      }
      if (code && path === "bookings/" + code + "/payments") {
        if (!token) return error("Booking access required.", 404);
        const result = await upstreamForRequest("/api/v1/bookings/" + code + "/payments", {}, token);
        return proxy(result.data, result.response.status, result.message);
      }
    }

    if (method === "POST") {
      if (path === "bookings") {
        const body = await readLimitedText(request, 5000);
        const result = await upstreamForRequest("/api/v1/bookings", {
          method: "POST", body, headers: { "Content-Type": "application/json" },
        });
        if (!result.response.ok) return proxy(null, result.response.status, result.message);
        const value = result.data as {
          booking?: { bookingCode?: string }; accessToken?: string
        };
        const newCode = value?.booking?.bookingCode;
        if (!newCode || !codePattern.test(newCode) || !value.accessToken)
          return error("Booking response was invalid.", 502);
        // Backend bearer token is stored in an HttpOnly cookie, never sent
        // to browser JavaScript, localStorage, the URL or analytics.
        const output = NextResponse.json({ booking: value.booking }, {
          status: 201, headers: noStore,
        });
        storeToken(output, newCode, value.accessToken);
        return output;
      }
      if (code && path === "bookings/" + code + "/access") {
        const text = await readLimitedText(request, 2048);
        const data = JSON.parse(text) as { accessToken?: unknown } | null;
        const received = data?.accessToken;
        if (typeof received !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(received))
          return error("Enter a valid booking access token.", 400);
        const result = await upstreamForRequest("/api/v1/bookings/" + code, {}, received);
        if (!result.response.ok) return error("Booking reference or access token is invalid.", 404);
        const output = NextResponse.json({ ok: true }, { headers: noStore });
        storeToken(output, code, received);
        return output;
      }
      if (code && path === "bookings/" + code + "/cancel") {
        if (!token) return error("Booking access required.", 404);
        const body = await readLimitedText(request, 1000);
        const result = await upstreamForRequest("/api/v1/bookings/" + code + "/cancel", {
          method: "POST", body, headers: { "Content-Type": "application/json" },
        }, token);
        return proxy(result.data, result.response.status, result.message);
      }
      if (code && path === "bookings/" + code + "/payments") {
        if (!token) return error("Booking access required.", 404);
        const body = await readLimitedBody(request, 6 * 1024 * 1024);
        const form = await new Response(body, {
          headers: { "Content-Type": request.headers.get("content-type") ?? "" },
        }).formData().catch(() => null);
        if (!form) return error("Upload a valid receipt form.", 400);
        const proof = form.get("Proof");
        if (!(proof instanceof File) || proof.size === 0 ||
            proof.size > 5 * 1024 * 1024)
          return error("Upload a receipt smaller than 5 MB.", 400);
        const result = await upstreamForRequest("/api/v1/bookings/" + code + "/payments", {
          method: "POST", body: form,
        }, token);
        return proxy(result.data, result.response.status, result.message);
      }
    }
    return error("Not found.", 404);
  } catch (cause) {
    if (cause instanceof BodyTooLargeError) return error("Request is too large.", 413);
    if (cause instanceof SyntaxError)
      return error("Request body is invalid.", 400);
    return error("The booking service is temporarily unavailable. Try again.", 503);
  }
}
export async function GET(request: NextRequest, context: Context) {
  return handle(request, context, "GET");
}
export async function POST(request: NextRequest, context: Context) {
  return handle(request, context, "POST");
}
