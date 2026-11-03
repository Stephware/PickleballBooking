"use client";

import { useState } from "react";
import { adminRequest, extractError, hasManagerRights, todayForVenue } from "@/lib/admin-client";
import { instantLabel, money } from "@/lib/player";
import type { AdminBooking, StaffProfile } from "@/types/admin";
import type { Venue } from "@/types/player";
import { Empty, Loading, Notice, SectionHeader, useAdminResource } from "@/components/admin/AdminShared";

export function AdminBookings({ user, venue }: { user: StaffProfile; venue: Venue }) {
  const [date, setDate] = useState(() => todayForVenue(venue.timezone));
  const [filter, setFilter] = useState("ALL");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const { data, loading, error: loadError, reload } =
    useAdminResource<AdminBooking[]>("/bookings?date=" + date, []);
  const canManage = hasManagerRights(user);
  const items = data.filter((b) => filter === "ALL" || b.status === filter);

  async function action(booking: AdminBooking, type: "confirm" | "cancel") {
    // Cancellation requires the explicit inline booking-specific confirmation.
    if (type === "cancel" && cancelling !== booking.bookingCode) return;
    setBusy(booking.bookingCode); setError(""); setMessage("");
    try {
      await adminRequest("/bookings/" + booking.bookingCode + "/" + type, "POST",
        type === "cancel" ? { reason: reason.trim() || "Cancelled by staff" } : {});
      setReason(""); setCancelling(null);
      setMessage(type === "cancel" ? "Booking cancelled. Reconcile any payments separately."
        : "Booking confirmed.");
      await reload();
    } catch (cause) { setError(extractError(cause)); }
    finally { setBusy(""); }
  }

  return <>
    <SectionHeader eyebrow="Court operations" title="Reservations"
      description="View all bookings for a selected day and manage eligible reservations."
      action={<button className="button-outline" type="button" disabled={loading}
        onClick={() => void reload()}>↻ Refresh</button>} />
    <div className="admin-toolbar">
      <label>Booking date<input type="date" value={date}
        onChange={(e) => { setDate(e.target.value); setCancelling(null); setError(""); setMessage(""); }} /></label>
      <label>Status<select value={filter} onChange={(e) => { setFilter(e.target.value); setCancelling(null); }}>
        {["ALL", "HELD", "AWAITING_REVIEW", "CONFIRMED", "EXPIRED", "CANCELLED", "COMPLETED"].map(s =>
          <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
      </select></label>
    </div>
    {(error || loadError) && <Notice>{error || loadError} <button type="button"
      className="inline-link" onClick={() => void reload()}>Try again</button></Notice>}
    {message && <Notice kind="success">{message}</Notice>}
    {loading ? <Loading text="Loading reservations…" />
      : items.length === 0 ? <div className="admin-empty-with-action">
          <Empty text={data.length === 0 ? "No reservations for this date." :
            "No reservations match this status."} />
          {filter !== "ALL" && <button type="button" className="button-outline"
            onClick={() => setFilter("ALL")}>Show all statuses</button>}
        </div>
      : <div className="admin-table-wrap card-surface">
        <table className="admin-table admin-booking-table"><thead><tr><th>Booking</th><th>When</th>
          <th>Court</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{items.map((b) => <tr key={b.bookingCode}>
            <td data-label="Guest"><strong>{b.guestName}</strong><small>{b.bookingCode}</small>
              <small>{b.guestPhone || b.guestEmail || "No contact"}</small></td>
            <td data-label="Time">{instantLabel(b.startsAtUtc, venue.timezone)}
              <small>Until {instantLabel(b.endsAtUtc, venue.timezone)}</small></td>
            <td data-label="Court">Court {b.courtId}</td><td data-label="Amount">{money(b.totalAmount, venue.currency)}</td>
            <td data-label="Status"><span className={"admin-status status-" + b.status.toLowerCase()}>
              {b.status.replaceAll("_", " ")}</span></td>
            <td data-label="Actions">{canManage && b.status === "HELD" &&
              cancelling !== b.bookingCode && <button
              type="button" className="button-outline admin-small-button"
              disabled={Boolean(busy)} onClick={() => void action(b, "confirm")}>Confirm</button>}
              {canManage && ["HELD", "AWAITING_REVIEW", "CONFIRMED"].includes(b.status) &&
                cancelling !== b.bookingCode &&
                <button className="admin-danger-link" type="button" disabled={Boolean(busy)}
                  onClick={() => { setCancelling(b.bookingCode); setReason(""); setError(""); }}>
                  Cancel booking</button>}
              {canManage && cancelling === b.bookingCode && <div className="admin-inline-cancel"
                role="group" aria-label={"Confirm cancellation of " + b.bookingCode}>
                <strong>Cancel {b.bookingCode}?</strong>
                <p>This releases the court. Any refund must be handled separately.</p>
                <label>Reason (optional)
                  <input value={reason} maxLength={300}
                    placeholder="Reason for this booking only"
                    onChange={e => setReason(e.target.value)} />
                </label>
                <div className="admin-inline-cancel-actions">
                  <button type="button" className="button-outline" disabled={Boolean(busy)}
                    onClick={() => { setCancelling(null); setReason(""); }}>Keep booking</button>
                  <button type="button" className="button-outline destructive"
                    disabled={Boolean(busy)} onClick={() => void action(b, "cancel")}>
                    {busy === b.bookingCode ? "Cancelling…" : "Confirm cancellation"}
                  </button>
                </div>
              </div>}
              {!canManage && <span className="muted">View only</span>}</td>
          </tr>)}</tbody></table>
      </div>}
    <p className="admin-hint">Only the backend can confirm a qualifying hold. Online paid bookings
      require verified payment first; cancelling a paid reservation does not send a refund.</p>
  </>;
}
