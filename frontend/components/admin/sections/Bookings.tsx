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
  const { data, loading, error: loadError, reload } =
    useAdminResource<AdminBooking[]>("/bookings?date=" + date, []);
  const canManage = hasManagerRights(user);
  const items = data.filter((b) => filter === "ALL" || b.status === filter);

  async function action(booking: AdminBooking, type: "confirm" | "cancel") {
    if (type === "cancel" && !window.confirm(
      "Cancel " + booking.bookingCode + "? This may require a separate external refund."
    )) return;
    setBusy(booking.bookingCode); setError(""); setMessage("");
    try {
      await adminRequest("/bookings/" + booking.bookingCode + "/" + type, "POST",
        type === "cancel" ? { reason: reason.trim() || "Cancelled by staff" } : {});
      setReason("");
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
        onChange={(e) => setDate(e.target.value)} /></label>
      <label>Status<select value={filter} onChange={(e) => setFilter(e.target.value)}>
        {["ALL", "HELD", "AWAITING_REVIEW", "CONFIRMED", "EXPIRED", "CANCELLED", "COMPLETED"].map(s =>
          <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
      </select></label>
    </div>
    {(error || loadError) && <Notice>{error || loadError}</Notice>}
    {message && <Notice kind="success">{message}</Notice>}
    {loading ? <Loading text="Loading reservations…" />
      : items.length === 0 ? <Empty text="No reservations match the selected day and status." />
      : <div className="admin-table-wrap card-surface">
        <table className="admin-table"><thead><tr><th>Booking</th><th>When</th>
          <th>Court</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{items.map((b) => <tr key={b.bookingCode}>
            <td><strong>{b.guestName}</strong><small>{b.bookingCode}</small>
              <small>{b.guestPhone || b.guestEmail || "No contact"}</small></td>
            <td>{instantLabel(b.startsAtUtc, venue.timezone)}
              <small>Until {instantLabel(b.endsAtUtc, venue.timezone)}</small></td>
            <td>Court {b.courtId}</td><td>{money(b.totalAmount, venue.currency)}</td>
            <td><span className={"admin-status status-" + b.status.toLowerCase()}>
              {b.status.replaceAll("_", " ")}</span></td>
            <td>{canManage && b.status === "HELD" && <button
              type="button" className="button-outline admin-small-button"
              disabled={Boolean(busy)} onClick={() => void action(b, "confirm")}>Confirm</button>}
              {canManage && ["HELD", "AWAITING_REVIEW", "CONFIRMED"].includes(b.status) &&
                <button className="admin-danger-link" type="button" disabled={Boolean(busy)}
                  onClick={() => void action(b, "cancel")}>Cancel</button>}
              {!canManage && <span className="muted">View only</span>}</td>
          </tr>)}</tbody></table>
      </div>}
    {canManage && <label className="admin-cancel-reason">Optional cancellation reason
      <input value={reason} maxLength={300} placeholder="Reason recorded on cancelled booking"
        onChange={(e) => setReason(e.target.value)} /></label>}
    <p className="admin-hint">Only the backend can confirm a qualifying hold. Online paid bookings
      require verified payment first; cancelling a paid reservation does not send a refund.</p>
  </>;
}
