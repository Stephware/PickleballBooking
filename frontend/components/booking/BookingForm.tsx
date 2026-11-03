"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { jsonRequest, money, prettyDate, timeLabel } from "@/lib/player";
import type { Booking, SelectedRange } from "@/types/player";

interface CreateResponse { booking: Booking; }

export function BookingForm({ selection, onBack }: {
  selection: SelectedRange; onBack: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const errorSummary = useRef<HTMLDivElement>(null);
  useEffect(() => { if (error) errorSummary.current?.focus(); }, [error]);
  const missingContact = Boolean(error) && !phone.trim() && !email.trim();
  const key = useRef<string | null>(null);
  const slots = selection.slots;
  const total = slots.reduce((sum, slot) => sum + slot.totalPrice, 0);
  const first = slots[0];
  const last = slots[slots.length - 1];
  function edit(setter: (value: string) => void, value: string) {
    setter(value);
    key.current = null; // changed intent requires a new idempotency key
    setError("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!name.trim() || (!phone.trim() && !email.trim())) {
      setError("Enter your name and at least one contact method.");
      return;
    }
    if (!key.current) key.current = crypto.randomUUID();
    setBusy(true);
    setError("");
    try {
      const saved = await jsonRequest<CreateResponse>("/api/player/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: key.current,
          courtId: selection.courtId,
          date: selection.date,
          startsAt: first.startsAt,
          endsAt: last.endsAt,
          guestName: name.trim(),
          guestPhone: phone.trim() || null,
          guestEmail: email.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      router.push("/booking/" + encodeURIComponent(saved.booking.bookingCode));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the hold.");
      // Keep the same key to permit safe retry of a timed-out request.
    } finally { setBusy(false); }
  }

  return (
    <section className="booking-panel card-surface" id="booking-details" aria-labelledby="booking-title">
      <button className="subpage-back button-back" type="button" onClick={onBack}>
        ← Back to court and time
      </button>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Step 2 of 2 · Your reservation</p>
          <h2 id="booking-title">Save your time on court</h2>
        </div>
      </div>
      <div className="reservation-recap" aria-label="Selected court details">
        <div><span className="micro-label">Court</span><strong>{selection.courtName}</strong></div>
        <div><span className="micro-label">Day</span><strong>{prettyDate(selection.date)}</strong></div>
        <div><span className="micro-label">Time</span>
          <strong>{timeLabel(first.startsAt)} – {timeLabel(last.endsAt)}</strong>
        </div>
        <div><span className="micro-label">Total</span>
          <strong className="recap-price">{money(total, selection.currency)}</strong>
        </div>
      </div>
      <form onSubmit={submit} className="booking-form">
        <div className="form-grid">
          <label className="field field-wide">
            <span>Full name <b aria-hidden="true">*</b></span>
            <input name="name" autoComplete="name" required maxLength={150}
              placeholder="Your full name" value={name}
              onChange={(e) => edit(setName, e.target.value)} />
          </label>
          <label className="field">
            <span>Mobile number</span>
            <input id="booking-phone" name="phone" type="tel" autoComplete="tel" maxLength={32}
              aria-invalid={missingContact || undefined} aria-describedby={missingContact ? "booking-error" : undefined}
              placeholder="09xx xxx xxxx" value={phone}
              onChange={(e) => edit(setPhone, e.target.value)} />
          </label>
          <label className="field">
            <span>Email address</span>
            <input id="booking-email" name="email" type="email" autoComplete="email" maxLength={254}
              aria-invalid={missingContact || undefined} aria-describedby={missingContact ? "booking-error" : undefined}
              placeholder="you@example.com" value={email}
              onChange={(e) => edit(setEmail, e.target.value)} />
          </label>
          <p className="form-hint field-wide">Provide at least one contact method so the venue can reach you.</p>
          <label className="field field-wide">
            <span>Additional notes <span className="muted">(optional)</span></span>
            <textarea name="notes" maxLength={500} rows={3}
              placeholder="Anything the venue should know?"
              value={notes} onChange={(e) => edit(setNotes, e.target.value)} />
          </label>
        </div>
        <div className="booking-disclaimer">
          <strong>This creates a temporary hold, not a confirmed booking.</strong>
          <p>You will receive a booking reference and instructions to upload payment proof.
             The venue must review your payment before confirming your court.</p>
        </div>
        {error && <div className="alert error" role="alert" tabIndex={-1}
          ref={errorSummary} id="booking-error">{error}
          {missingContact && <> <a href="#booking-phone">Add a mobile number</a> or <a href="#booking-email">email address</a>.</>}
        </div>}
        <button type="submit" className="button-primary full-button" disabled={busy}
          aria-busy={busy}>
          {busy ? "Saving your court…" : "Hold court · " + money(total, selection.currency)}
          <span aria-hidden="true">→</span>
        </button>
      </form>
    </section>
  );
}
