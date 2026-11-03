"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PaymentProofForm } from "@/components/booking/PaymentProofForm";
import { VenueContactLinks } from "@/components/ui/VenueContact";
import type { VenuePublicDetails } from "@/lib/venue-public";
import { instantLabel, jsonRequest, money } from "@/lib/player";
import type { Booking, PaymentSummary, Venue } from "@/types/player";

const statusInfo: Record<string, { title: string; description: string; badge: string }> = {
  HELD: {
    title: "Court temporarily held",
    description: "Upload your payment proof before your hold expires.",
    badge: "Hold active",
  },
  AWAITING_REVIEW: {
    title: "Payment proof received",
    description: "The venue is reviewing your receipt. Your booking is not confirmed yet.",
    badge: "Under review",
  },
  CONFIRMED: {
    title: "Your court is confirmed!",
    description: "The venue has confirmed your reservation. See you on court.",
    badge: "Confirmed",
  },
  EXPIRED: {
    title: "This booking has expired",
    description: "The hold or review deadline passed. This court is no longer reserved for you.",
    badge: "Expired",
  },
  CANCELLED: {
    title: "Booking cancelled",
    description: "This reservation has been cancelled.",
    badge: "Cancelled",
  },
  COMPLETED: {
    title: "Game completed",
    description: "Thanks for playing.",
    badge: "Completed",
  },
};

export function BookingStatus({ code, venue, publicDetails }: {
  code: string; venue: Venue; publicDetails: VenuePublicDetails;
}) {
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [payments, setPayments] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [missingAccess, setMissingAccess] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const refresh = useCallback(() =>
    jsonRequest<Booking>("/api/player/bookings/" + encodeURIComponent(code)).then(async b => {
      setBooking(b);
      setError("");
      setMissingAccess(false);
      try {
        const summary = await jsonRequest<PaymentSummary>(
          "/api/player/bookings/" + encodeURIComponent(code) + "/payments");
        setPayments(summary);
      } catch { setPayments(null); } // Payment summary failure does not hide booking.
    }).catch(cause => {
      setBooking(null);
      setPayments(null);
      const reason = cause instanceof Error ? cause.message : "Could not load the reservation.";
      if (reason.includes("access") || reason.includes("not found"))
        setMissingAccess(true);
      else setError(reason);
    }).finally(() => { setLoading(false); }), [code]);

  useEffect(() => { void refresh(); }, [refresh]);
  function reload() {
    setLoading(true); setError(""); return refresh();
  }
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 10000);
    return () => window.clearInterval(id);
  }, []);

  async function recover(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await jsonRequest<{ ok: boolean }>("/api/player/bookings/" + code + "/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: tokenInput.trim() }),
      });
      setTokenInput("");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not restore access.");
    } finally { setBusy(false); }
  }

  async function cancel() {
    if (busy || !booking ||
        !window.confirm("Cancel this temporary booking? Your reserved time will be released.")) return;
    setBusy(true);
    setError("");
    try {
      await jsonRequest<Booking>("/api/player/bookings/" + code + "/cancel", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelled by guest" }),
      });
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to cancel booking.");
    } finally { setBusy(false); }
  }

  if (loading && !booking) return <div className="empty-card" role="status">
    <span className="spinner" aria-hidden="true" /> Loading your reservation…
  </div>;

  if (!booking && missingAccess) return (
    <section className="booking-status-container">
      <Link href="/" className="subpage-back">← Back to courts</Link>
      <div className="card-surface access-card">
        <p className="eyebrow">Private booking</p>
        <h1>Access your reservation</h1>
        <p className="muted">This booking is protected. Reservations created in this browser
          are available here automatically. If the venue gave you a private access token,
          enter it below. Otherwise, use the original browser or contact the venue.</p>
        <p className="reference-line">Reference <strong>{code}</strong></p>
        <form className="booking-form" onSubmit={recover}>
          <label className="field"><span>Booking access token</span>
            <input type="password" required autoComplete="off" value={tokenInput}
              placeholder="Paste the private token"
              onChange={(e) => setTokenInput(e.target.value)} />
          </label>
          {error && <p role="alert" className="alert error">{error}</p>}
          <button className="button-primary" disabled={busy} type="submit">
            {busy ? "Checking…" : "Open booking"}
          </button>
        </form>
      </div>
    </section>
  );

  if (!booking) return <div>
    <Link href="/" className="subpage-back">← Back to courts</Link>
    <div className="empty-card" role="alert">
      <h2>Booking unavailable</h2><p>{error || "Could not load your booking."}</p>
      <button type="button" className="button-outline" onClick={() => void reload()}>Try again</button>
    </div>
  </div>;

  const meta = statusInfo[booking.status] || {
    title: "Booking status: " + booking.status, description: "Check with the venue for details.",
    badge: booking.status,
  };
  const expiredTime = booking.expiresAtUtc ? Date.parse(booking.expiresAtUtc) : 0;
  const canUpload = booking.status === "HELD" && booking.totalAmount > 0 &&
    expiredTime > now && !payments?.payments.some((p) => p.status === "SUBMITTED" || p.status === "VERIFIED");
  const canCancel = booking.status === "HELD" && expiredTime > now &&
    !payments?.payments.some((p) => p.status === "SUBMITTED" || p.status === "VERIFIED");

  return (
    <div className="booking-status-container">
      <Link href="/" className="subpage-back">← Back to courts</Link>
      <section className="booking-result card-surface" aria-labelledby="result-title">
        <div className="result-header">
          <span className={"status-badge badge-" + booking.status.toLowerCase()}>{meta.badge}</span>
          <button type="button" className="text-button" onClick={() => void reload()}
            disabled={loading}>↻ Refresh status</button>
        </div>
        <h1 id="result-title">{meta.title}</h1>
        <p className="muted">{meta.description}</p>
        <div className="booking-reference">
          <span className="micro-label">Your booking reference</span>
          <div><strong>{booking.bookingCode}</strong>
            <button type="button" className="text-button"
              onClick={() => void navigator.clipboard.writeText(booking.bookingCode)}>
              Copy code
            </button>
          </div>
        </div>
        <dl className="detail-list">
          <div><dt>Court</dt><dd>Court #{booking.courtId}</dd></div>
          <div><dt>Start</dt><dd>{instantLabel(booking.startsAtUtc, venue.timezone)}</dd></div>
          <div><dt>End</dt><dd>{instantLabel(booking.endsAtUtc, venue.timezone)}</dd></div>
          <div><dt>Booking total</dt><dd>{money(booking.totalAmount, booking.currency)}</dd></div>
          {booking.expiresAtUtc && <div><dt>Current deadline</dt>
            <dd>{instantLabel(booking.expiresAtUtc, venue.timezone)}
              {expiredTime <= now && <span className="danger-text"> · Time passed; refresh status</span>}
            </dd></div>}
        </dl>
        {error && <p className="alert error" role="alert">{error}</p>}
        {canCancel && <button type="button" className="button-outline destructive"
          onClick={() => void cancel()} disabled={busy}>Cancel this hold</button>}
        <p className="form-hint">Booking reference is not proof of payment.
          Keep this browser session for private status access.</p>
      </section>

      {payments && <section className="card-surface payment-history" aria-label="Payment summary">
        <div className="panel-heading"><h2>Payment activity</h2>
          <strong>{money(payments.verifiedTotal, payments.currency)} verified</strong></div>
        {payments.payments.length === 0 && <p className="muted">No payment proof submitted yet.</p>}
        {payments.payments.map((p) => (
          <div className="payment-row" key={p.id}>
            <div><strong>{p.paymentMethod.replaceAll("_", " ")}</strong>
              <span className="micro-label">{p.status} · {instantLabel(p.submittedAtUtc, venue.timezone)}</span></div>
            <strong>{money(p.amount, payments.currency)}</strong>
          </div>
        ))}
      </section>}
      {canUpload && <PaymentProofForm booking={booking} venue={venue} publicDetails={publicDetails}
        onSuccess={() => void reload()} />}
      {booking.status === "AWAITING_REVIEW" && (
        <p role="status" className="alert info">Your receipt is awaiting manual approval.
          Do not send another payment unless the venue asks you to.</p>
      )}
      {booking.status === "HELD" && booking.totalAmount === 0 && (
        <p role="status" className="alert info">No payment is due for this reservation.
          Contact the venue for confirmation.</p>
      )}
      {(booking.status === "CANCELLED" || booking.status === "EXPIRED") && (
        <p className="alert info">If you already transferred money, contact the venue for
          reconciliation before making another payment.</p>
      )}
      <div className="status-navigation">
        <VenueContactLinks contact={publicDetails.contact} compact />
        <button type="button" className="text-button" onClick={() => router.refresh()}>
          Reload page
        </button>
      </div>
    </div>
  );
}
