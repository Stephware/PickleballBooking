/* eslint-disable @next/next/no-img-element -- local blob: previews must not use image optimization */
"use client";

import { useEffect, useState } from "react";
import { jsonRequest, money } from "@/lib/player";
import type { Booking, Payment, Venue } from "@/types/player";

export function PaymentProofForm({ booking, venue, onSuccess }: {
  booking: Booking; venue: Venue; onSuccess: () => void;
}) {
  const [method, setMethod] = useState<"GCASH" | "BANK_TRANSFER">("GCASH");
  const [reference, setReference] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Revoke the previous image blob when the preview changes or unmounts.
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  function pickFile(next: File | null) {
    setError("");
    if (next && (next.size > 5 * 1024 * 1024 || next.size === 0)) {
      setPreview(null); setFile(null); setError("Choose a receipt smaller than 5 MB."); return;
    }
    if (next && !["image/png", "image/jpeg", "image/webp", "application/pdf"].includes(next.type)) {
      setPreview(null); setFile(null); setError("Use a JPG, PNG, WebP, or PDF receipt."); return;
    }
    setPreview(next && next.type.startsWith("image/") ? URL.createObjectURL(next) : null);
    setFile(next);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!file || reference.trim().length < 3) {
      setError("Select your receipt and enter its transaction reference.");
      return;
    }
    const form = new FormData();
    form.set("PaymentMethod", method);
    form.set("Amount", booking.totalAmount.toFixed(2));
    form.set("TransactionReference", reference.trim());
    form.set("Proof", file);
    setBusy(true);
    setError("");
    try {
      await jsonRequest<Payment>("/api/player/bookings/" +
        encodeURIComponent(booking.bookingCode) + "/payments", {
          method: "POST", body: form,
        });
      onSuccess();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The proof could not be uploaded.");
    } finally { setBusy(false); }
  }

  return (
    <section className="payment-card card-surface" aria-labelledby="payment-title">
      <p className="eyebrow">Next step · Payment proof</p>
      <h2 id="payment-title">Submit your receipt</h2>
      <p className="muted">Your court is on a temporary hold. Transfer using the venue&apos;s
        verified official payment instructions, then upload proof for manual review.
        <strong> Uploading a receipt does not confirm payment.</strong></p>
      <div className="payment-total">
        <span>Amount to pay</span>
        <strong>{money(booking.totalAmount, booking.currency || venue.currency)}</strong>
      </div>
      <form className="booking-form" onSubmit={submit}>
        <fieldset className="method-options">
          <legend>Payment method</legend>
          <label className={method === "GCASH" ? "method selected-method" : "method"}>
            <input type="radio" name="method" checked={method === "GCASH"}
              onChange={() => setMethod("GCASH")} /> GCash
          </label>
          <label className={method === "BANK_TRANSFER" ? "method selected-method" : "method"}>
            <input type="radio" name="method" checked={method === "BANK_TRANSFER"}
              onChange={() => setMethod("BANK_TRANSFER")} /> Bank transfer
          </label>
        </fieldset>
        <label className="field">
          <span>Transaction reference <b aria-hidden="true">*</b></span>
          <input required value={reference} maxLength={150} minLength={3}
            placeholder="Reference on your receipt"
            onChange={(e) => { setReference(e.target.value); setError(""); }} />
        </label>
        <label className="field">
          <span>Payment screenshot or receipt <b aria-hidden="true">*</b></span>
          <input type="file" required accept=".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf"
            aria-describedby="proof-hint" onChange={(e) => pickFile(e.target.files?.[0] || null)} />
          <span className="form-hint" id="proof-hint">PNG, JPG, WebP, or PDF · maximum 5 MB</span>
        </label>
        {file && <div className="proof-preview">
          <div><strong>Selected receipt</strong><p>{file.name} · {(file.size / 1024).toFixed(0)} KB</p></div>
          {preview && <img src={preview} alt="Preview of the receipt you selected" />}
          {file.type === "application/pdf" &&
            <p className="muted">PDF selected — open the file locally to review before submitting.</p>}
          <button type="button" className="text-button" onClick={() => pickFile(null)}>Remove file</button>
        </div>}
        {error && <p className="alert error" role="alert">{error}</p>}
        <button className="button-primary full-button" type="submit" disabled={busy || !file}
          aria-busy={busy}>{busy ? "Uploading receipt…" : "Submit receipt for review"}</button>
      </form>
      <p className="form-hint">The venue checks payment manually. If the hold or review window
        expires, please contact the venue before sending another transfer.</p>
    </section>
  );
}
