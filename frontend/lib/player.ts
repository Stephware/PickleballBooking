import type { CSSProperties } from "react";
import type { ApiErrorResponse, Slot, SlotStatus, Venue } from "@/types/player";

export const FALLBACK_VENUE: Venue = {
  venueName: "Pickleball Venue", venueSlug: "pickleball",
  timezone: "Asia/Manila", currency: "PHP", logoUrl: null,
  primaryColor: "#176e4b", secondaryColor: "#f2f7f4",
};

export function safeBrandColor(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)
    ? value : fallback;
}
export function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-PH", {
      style: "currency", currency, minimumFractionDigits: 2,
    }).format(amount);
  } catch { return "₱" + amount.toFixed(2); }
}
export function dateInZone(timezone: string, instant = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(instant);
    const get = (name: string) => parts.find((p) => p.type === name)?.value;
    return get("year") + "-" + get("month") + "-" + get("day");
  } catch { return instant.toISOString().slice(0, 10); }
}
export function addDays(date: string, delta: number): string {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}
export function prettyDate(date: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "long", month: "short", day: "numeric", year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date + "T12:00:00Z"));
}
export function timeLabel(value: string): string {
  const [hour = "0", minute = "0"] = value.split(":");
  const hours = Number(hour);
  return String(hours % 12 || 12) + ":" + minute + (hours < 12 ? " AM" : " PM");
}
export function instantLabel(utc: string, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-PH", {
      timeZone: timezone, dateStyle: "medium", timeStyle: "short",
    }).format(new Date(utc));
  } catch { return new Date(utc).toLocaleString(); }
}
export const slotMeta: Record<SlotStatus, { label: string; short: string }> = {
  AVAILABLE: { label: "Available", short: "Open" },
  OCCUPIED: { label: "Reserved", short: "Booked" },
  PENDING: { label: "Pending payment", short: "Pending" },
  ELAPSED: { label: "Time passed", short: "Passed" },
  BLOCKED: { label: "Unavailable — court blocked", short: "Blocked" },
  UNAVAILABLE: { label: "Outside booking window", short: "Closed" },
};
export function canExtend(range: Slot[], slot: Slot): Slot[] | null {
  if (slot.status !== "AVAILABLE") return null;
  if (range.length === 0) return [slot];
  if (range.some((item) => item.startsAtUtc === slot.startsAtUtc)) return [slot];
  if (range.length >= 8) return null;
  if (range.at(-1)?.endsAtUtc === slot.startsAtUtc) return [...range, slot];
  if (slot.endsAtUtc === range[0].startsAtUtc) return [slot, ...range];
  return [slot];
}
export async function jsonRequest<T>(input: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(input, { ...init, cache: "no-store" }); }
  catch { throw new Error("Couldn't connect. Check your internet connection and try again."); }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = payload as ApiErrorResponse | null;
    const message = detail && typeof detail.error === "string"
      ? detail.error : response.status === 404
        ? "Booking not found or access has expired."
        : response.status === 409
          ? "The selected slot changed. Refresh availability and try again."
          : "The request couldn't be completed. Please try again.";
    throw new Error(message);
  }
  return payload as T;
}

/** WCAG relative luminance; choose contrasting text on venue primary color. */
export function brandStyle(venue: Pick<Venue, "primaryColor" | "secondaryColor">): CSSProperties {
  const hex = safeBrandColor(venue.primaryColor, FALLBACK_VENUE.primaryColor);
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const darkChannels = [0x10, 0x20, 0x18].map((c) => c / 255)
    .map((c) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const darkLuminance = 0.2126 * darkChannels[0] + 0.7152 * darkChannels[1] + 0.0722 * darkChannels[2];
  const onBrand = (luminance + 0.05) / (darkLuminance + 0.05) >= 1.05 / (luminance + 0.05)
    ? "#102018" : "#ffffff";
  // Secondary venue color may be dark; blend it into white so reference
  // panels always retain legible dark text on a light surface.
  const secondary = safeBrandColor(venue.secondaryColor, FALLBACK_VENUE.secondaryColor);
  const tint = "#" + [1, 3, 5].map((i) => {
    const channel = parseInt(secondary.slice(i, i + 2), 16);
    return Math.round(channel * 0.16 + 255 * 0.84).toString(16).padStart(2, "0");
  }).join("");
  return { "--brand": hex, "--brand-tint": tint, "--brand-ink": onBrand } as CSSProperties;
}
