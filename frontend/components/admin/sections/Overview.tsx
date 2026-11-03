"use client";

import { useCallback, useEffect, useState } from "react";
import { adminRequest, extractError, hasManagerRights, todayForVenue } from "@/lib/admin-client";
import { instantLabel, money } from "@/lib/player";
import { reviewPriority, reviewPriorityLabel } from "@/lib/payment-review";
import type { AdminBooking, AdminSectionId, PendingPayment, StaffProfile } from "@/types/admin";
import type { Venue } from "@/types/player";
import { Empty, Notice, SectionHeader } from "@/components/admin/AdminShared";

export function AdminOverview({ user, venue, navigate }: {
  user: StaffProfile; venue: Venue; navigate: (section: AdminSectionId, mode?: "booking" | "block") => void;
}) {
  const today = todayForVenue(venue.timezone);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [pending, setPending] = useState<PendingPayment[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const reload = useCallback(() => Promise.all([
        adminRequest<AdminBooking[]>("/bookings?date=" + today),
        adminRequest<PendingPayment[]>("/payments/pending"),
      ]).then(([b, p]) => {
      setBookings(b); setPending(p); setError("");
    }).catch(reason => { setError(extractError(reason)); })
    .finally(() => { setLoading(false); }), [today]);
  useEffect(() => { void reload(); }, [reload]);
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;
  const held = bookings.filter((b) => ["HELD", "AWAITING_REVIEW"].includes(b.status)).length;
  const reviewsNeedingAttention = pending.filter(payment => reviewPriority(payment) !== "NORMAL");
  return <>
    <SectionHeader eyebrow={"VENUE OPERATIONS · " + venue.venueName} title="Today"
      description={"Your court activity for " + new Intl.DateTimeFormat("en-PH",
        { dateStyle: "full", timeZone: "UTC" }).format(new Date(today + "T12:00:00Z")) + "."}
      action={<button className="button-outline" type="button" disabled={loading}
        onClick={() => { setLoading(true); setError(""); void reload(); }}>↻ Refresh</button>} />
    {error && <Notice>{error} <button className="inline-link" type="button"
      onClick={() => { setLoading(true); void reload(); }}>Try again</button></Notice>}
    {!loading && !error && reviewsNeedingAttention.length > 0 &&
      <Notice kind="info">{reviewsNeedingAttention.length} submitted payment{reviewsNeedingAttention.length === 1 ? "" : "s"}
        {" "}need staff attention. Review the payment queue before the guests' game times.
        Courts with submitted proof remain reserved until a manual decision.</Notice>}
    <section className="admin-quick-actions">
      <h3>Quick actions</h3>
      <div className="admin-action-row">
        <button className="button-primary" type="button"
          onClick={() => navigate("schedule", "booking")}>+ Add Booking</button>
        <button className="button-outline" type="button"
          onClick={() => navigate("payments")}>Review payments</button>
        {hasManagerRights(user) && <button className="button-outline" type="button"
          onClick={() => navigate("schedule", "block")}>Block Court</button>}
      </div>
    </section>
    <div className="admin-kpi-grid">
      {[
        { label: "Today's bookings", value: bookings.length, hint: "Total reservations" },
        { label: "Pending payments", value: pending.length, hint: "Proofs to review" },
        { label: "Confirmed", value: confirmed, hint: "Ready to play" },
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
          : bookings.slice().sort((a,b) => a.startsAtUtc.localeCompare(b.startsAtUtc)).slice(0, 6).map((b) => <div className="admin-list-row" key={b.bookingCode}>
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
              <small>{p.paymentMethod.replaceAll("_", " ")} · {p.bookingCode}</small>
              <small>{reviewPriorityLabel(reviewPriority(p))}</small></div>
            <strong>{money(p.amount, venue.currency)}</strong>
          </div>)}
      </section>
    </div>
  </>;
}
