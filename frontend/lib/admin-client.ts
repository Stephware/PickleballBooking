import { dateInZone } from "@/lib/player";
import type { StaffProfile } from "@/types/admin";

export const ADMIN_BASE = "/api/admin";
export const hasManagerRights = (user: StaffProfile) =>
  user.role === "OWNER" || user.role === "MANAGER";
export const hasOwnerRights = (user: StaffProfile) => user.role === "OWNER";

export const weekdayNames = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

export async function adminRequest<T>(
  path: string, method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(ADMIN_BASE + path, {
      method,
      cache: "no-store",
      credentials: "same-origin",
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error("Cannot reach the administration server. Check your connection.");
  }
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null) as {
    error?: unknown
  } | null;
  if (!response.ok) {
    if (response.status === 401 && path !== "/session" && typeof window !== "undefined") {
      window.dispatchEvent(new Event("pb-admin-session-expired"));
    }
    const msg = typeof data?.error === "string"
      ? data.error : response.status === 401 ? "Session expired. Sign in again."
      : response.status === 403 ? "Your account cannot perform this action."
      : "This action couldn't be completed.";
    throw new Error(msg);
  }
  return data as T;
}

export function todayForVenue(timezone: string) { return dateInZone(timezone); }
export function extractError(reason: unknown): string {
  return reason instanceof Error ? reason.message : "Something went wrong. Try again.";
}

/** .NET TimeOnly JSON contracts use precise HH:mm:ss local wall-clock strings. */
export function apiTime(value: string): string {
  return /^\d{2}:\d{2}$/.test(value) ? value + ":00" : value;
}
