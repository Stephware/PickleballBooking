import type { Slot } from "@/types/player";

/** Staff-only picker: one WALK_IN_NOW slot may start a walk-in reservation.
 * Later slots must be AVAILABLE. Blocks and phone/Messenger bookings cannot
 * select started slots. Database-side overlap checks remain authoritative. */
export function extendStaffSlots(
  current: Slot[], next: Slot, allowWalkInNow: boolean,
): Slot[] | null {
  if (next.status !== "AVAILABLE" &&
      !(allowWalkInNow && next.status === "WALK_IN_NOW")) return null;
  if (!current.length || current.some(s => s.startsAtUtc === next.startsAtUtc))
    return [next];
  if (current.length >= 8) return null;
  if (current.at(-1)?.endsAtUtc === next.startsAtUtc &&
      next.status === "AVAILABLE") return [...current, next];
  if (next.endsAtUtc === current[0].startsAtUtc &&
      (next.status === "AVAILABLE" ||
       (allowWalkInNow && next.status === "WALK_IN_NOW"))) return [next, ...current];
  return [next];
}

export function selectionAmount(slots: Slot[]): number {
  return slots.reduce((sum, slot) => sum + slot.totalPrice, 0);
}
