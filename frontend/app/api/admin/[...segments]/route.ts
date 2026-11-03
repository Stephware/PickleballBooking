import { NextRequest, NextResponse } from "next/server";
import {
  adminAllowed, adminCookieHeader, adminCsrf, adminError, backendAdmin,
  clearBackendSession, hasStaffCookie, relayJson, requestOriginValid,
  RESPONSE_HEADERS,
} from "@/lib/admin-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ segments: string[] }> };

async function handle(request: NextRequest, context: Context, method: string) {
  const { segments } = await context.params;
  if (segments.length > 4 || !adminAllowed(method, segments))
    return adminError("Not found.", 404);
  if (!hasStaffCookie(request)) return adminError("Staff sign-in required.", 401);
  if (method !== "GET" && !requestOriginValid(request))
    return adminError("Invalid request origin.", 403);

  const csrf = method === "GET" ? undefined : adminCsrf(request);
  if (method !== "GET" && !csrf) return adminError("Sign in again to continue.", 401);
  const path = segments.join("/");
  let query = "";
  if (method === "GET" && (path === "bookings" || path === "operations/blocks")) {
    const date = request.nextUrl.searchParams.get("date");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
      return adminError("Choose a valid date.", 400);
    query = "?date=" + encodeURIComponent(date);
  }
  try {
    const body = method === "GET" ? undefined : await request.text();
    if (body && body.length > 20000) return adminError("Request is too large.", 413);
    const backend = await backendAdmin("/api/v1/admin/" + path + query, {
      method,
      ...(method !== "GET" ? {
        headers: { "Content-Type": "application/json" },
        body: body || "{}",
      } : {}),
    }, adminCookieHeader(request), csrf);

    // Proof content never becomes a public static file or JS-accessible
    // secret URL; same-origin authenticated image request only.
    if (method === "GET" && /^payments\/[1-9][0-9]{0,15}\/proof$/.test(path) &&
        backend.ok) {
      const mime = backend.headers.get("content-type")?.split(";")[0];
      if (!["image/png", "image/jpeg", "image/webp", "application/pdf"].includes(mime || ""))
        return adminError("Unrecognized proof file.", 502);
      const length = Number(backend.headers.get("content-length") || 0);
      if (length > 5 * 1024 * 1024) return adminError("Proof is too large.", 413);
      const data = await backend.arrayBuffer();
      if (data.byteLength > 5 * 1024 * 1024) return adminError("Proof is too large.", 413);
      return new NextResponse(data, {
        headers: {
          ...RESPONSE_HEADERS,
          "Content-Type": mime!,
          "Content-Disposition": mime === "application/pdf"
            ? "attachment; filename=payment-proof.pdf" : "inline",
          "Content-Security-Policy": "sandbox",
        },
      });
    }

    const relayed = await relayJson(backend);
    if (backend.status === 401) clearBackendSession(relayed);
    if (path === "auth/change-password" && backend.ok)
      clearBackendSession(relayed); // .NET invalidates prior login after password change
    return relayed;
  } catch { return adminError("The admin service is temporarily unavailable.", 503); }
}

export async function GET(request: NextRequest, ctx: Context) {
  return handle(request, ctx, "GET");
}
export async function POST(request: NextRequest, ctx: Context) {
  return handle(request, ctx, "POST");
}
export async function PUT(request: NextRequest, ctx: Context) {
  return handle(request, ctx, "PUT");
}
export async function PATCH(request: NextRequest, ctx: Context) {
  return handle(request, ctx, "PATCH");
}
