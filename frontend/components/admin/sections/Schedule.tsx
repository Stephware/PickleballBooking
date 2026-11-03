"use client";

import { AdminBookings } from "@/components/admin/sections/Bookings";
import { AdminManual } from "@/components/admin/sections/Manual";
import { AdminBlocks } from "@/components/admin/sections/Blocks";
import type { StaffProfile } from "@/types/admin";
import type { Venue } from "@/types/player";

export type ScheduleMode = "list" | "booking" | "block";

export function AdminSchedule({ user, venue, mode, onModeChange }: {
  user: StaffProfile; venue: Venue; mode: ScheduleMode;
  onModeChange: (mode: ScheduleMode) => void;
}) {
  const change = (next: ScheduleMode) => onModeChange(next);
  return <div className="admin-workflow">
    {mode !== "list" && <div className="admin-workflow-back">
      <button className="button-outline" type="button" onClick={() => change("list")}>
        ← Back to Schedule
      </button>
    </div>}
    <nav className="admin-workflow-tabs" aria-label="Schedule actions">
      <button type="button" className={mode === "list" ? "active" : ""}
        aria-current={mode === "list" ? "page" : undefined}
        onClick={() => change("list")}>Reservations</button>
      <button type="button" className={mode === "booking" ? "active" : ""}
        aria-current={mode === "booking" ? "page" : undefined}
        onClick={() => change("booking")}>+ Add Booking</button>
      <button type="button" className={mode === "block" ? "active" : ""}
        aria-current={mode === "block" ? "page" : undefined}
        onClick={() => change("block")}>Block Court</button>
    </nav>
    {mode === "list" && <AdminBookings user={user} venue={venue}/>}
    {mode === "booking" && <AdminManual user={user} venue={venue}/>}
    {mode === "block" && <AdminBlocks user={user} venue={venue}/>}
  </div>;
}
