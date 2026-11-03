"use client";

import { useCallback, useEffect, useState } from "react";
import { adminRequest, extractError, todayForVenue } from "@/lib/admin-client";
import { instantLabel, money } from "@/lib/player";
import type { AdminBooking, AdminSectionId, CourtAdmin, PendingPayment, StaffProfile } from "@/types/admin";
import type { Venue } from "@/types/player";
import { Empty, Notice, SectionHeader } from "@/components/admin/AdminShared";

export function AdminOverview({ user, venue, navigate }: {
  user: StaffProfile; venue: Venue; navigate: (section: AdminSectionId, mode?: "booking" | "block") => void;
}) {
  const today = todayForVenue(venue.timezone);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [courts, setCourts] = useState<CourtAdmin[]>([]);
  const [pending, setPending] = useState<PendingPayment[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const reload = useCallback(() => Promise.all([
        adminRequest<AdminBooking[]>("/bookings?date=" + today),
        adminRequest<CourtAdmin[]>("/courts"),
        adminRequest<PendingPayment[]>("/payments/pending"),
      ]).then(([b, c, p]) => {
      setBookings(b); setCourts(c); setPending(p); setError("");
    }).catch(reason => { setError(extractError(reason)); })
    .finally(() => { setLoading(false); }), [today]);
  useEffect(() => { void reload(); }, [reload]);
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;
  const held = bookings.filter((b) => ["HELD", "AWAITING_REVIEW"].includes(b.status)).length;
  const activeCourts = courts.filter((c) => c.isActive).length;
  return <>
    <SectionHeader eyebrow="Your venue at a glance" title={"Good day, " + user.fullName.split(" ")[0] + "."}
      description="A snapshot of today's reservations and pending reviews."
      action={<button className="button-outline" type="button" disabled={loading}
        onClick={() => { setLoading(true); setError(""); void reload(); }}>↻ Refresh</button>} />
    {error && <Notice>{error}</Notice>}
    <div className="admin-kpi-grid">
      {[
        { label: "Today's confirmed", value: confirmed, hint: "Court reservations" },
        { label: "Awaiting review", value: pending.length, hint: "Payment submissions" },
        { label: "Active courts", value: activeCourts, hint: "Available to schedule" },
        { label: "Unconfirmed holds", value: held, hint: "Held / awaiting review" },
      ].map((kpi) => <article className="admin-kpi card-surface" key={kpi.label}>
        <span className="micro-label">{kpi.label}</span>
        <strong>{loading ? "—" : kpi.value}</strong>
        <small>{kpi.hint}</small>
      </article>)}
    </div>
    <div className="admin-two-column">
      <section className="admin-panel card-surface">
        <div className="admin-panel-heading"><h3>Today on court</h3>
          <button className="text-button" type="button"
            onClick={() => navigate("schedule")}>View all</button></div>
        {loading ? <p role="status">Loading reservations…</p>
          : bookings.length === 0 ? <Empty text="No bookings for today." />
          : bookings.slice(0, 6).map((b) => <div className="admin-list-row" key={b.bookingCode}>
            <div><strong>{b.guestName}</strong>
              <small>{instantLabel(b.startsAtUtc, venue.timezone)} · Court {b.courtId}</small></div>
            <span className={"admin-status status-" + b.status.toLowerCase()}>{b.status.replaceAll("_", " ")}</span>
          </div>)}
      </section>
      <section className="admin-panel card-surface">
        <div className="admin-panel-heading"><h3>Payment reviews</h3>
          <button className="text-button" type="button"
            onClick={() => navigate("payments")}>Open queue</button></div>
        {loading ? <p role="status">Loading payments…</p>
          : pending.length === 0 ? <Empty text="No proofs waiting for review." />
          : pending.slice(0, 6).map((p) => <div className="admin-list-row" key={p.paymentId}>
            <div><strong>{p.guestName}</strong>
              <small>{p.paymentMethod.replaceAll("_", " ")} · {p.bookingCode}</small></div>
            <strong>{money(p.amount, venue.currency)}</strong>
          </div>)}
      </section>
    </div>
    <section className="admin-quick-actions">
      <h3>Quick actions</h3>
      <div className="admin-action-row">
        <button className="button-primary" type="button"
          onClick={() => navigate("schedule", "booking")}>+ Add Booking</button>
        <button className="button-outline" type="button"
          onClick={() => navigate("payments")}>Review payments</button>
        <button className="button-outline" type="button"
          onClick={() => navigate("schedule", "block")}>Block Court</button>
      </div>
    </section>
  </>;
}
