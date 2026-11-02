import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Server-only diagnostic proxy. Does not expose API_BASE_URL or credentials.
export async function GET() {
  const baseUrl = process.env.API_BASE_URL ?? "http://localhost:5090";

  try {
    const response = await fetch(new URL("/health", baseUrl), {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });

    return NextResponse.json(
      { backend: response.ok ? "healthy" : "unavailable" },
      { status: response.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { backend: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
