/* eslint-disable @next/next/no-img-element -- local blob: previews must not use image optimization */
"use client";

import { useEffect, useRef, useState } from "react";
import { jsonRequest, money } from "@/lib/player";
import { VenueContactLinks } from "@/components/ui/VenueContact";
import { ReceiptImageDialog } from "@/components/ui/ReceiptImageDialog";
import type { VenuePublicDetails } from "@/lib/venue-public";
import type { Booking, Payment, Venue } from "@/types/player";

export function PaymentProofForm({ booking, venue, publicDetails, onSuccess }: {
  booking: Booking; venue: Venue; publicDetails: VenuePublicDetails; onSuccess: () => void;
}) {
  const [method, setMethod] = useState<"GCASH" | "BANK_TRANSFER">("GCASH");
  const [reference, setReference] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  // Revoke the previous image blob when the preview changes or unmounts.
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  function pickFile(next: File | null) {
    setError(""); setExpanded(false);
    if (next && (next.size > 5 * 1024 * 1024 || next.size === 0)) {
      setPreview(null); setFile(null); setError("Choose a receipt smaller than 5 MB.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    if (next && !["image/png", "image/jpeg", "image/webp", "application/pdf"].includes(next.type)) {
      setPreview(null); setFile(null); setError("Use a JPG, PNG, WebP, or PDF receipt.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setPreview(next ? URL.createObjectURL(next) : null);
    setFile(next);
  }

  const instructions = method === "GCASH" ? publicDetails.payments.gcash : publicDetails.payments.bank;
  async function copyNumber(value: string) {
    try { await navigator.clipboard.writeText(value); setCopyStatus("Account number copied."); }
    catch { setCopyStatus("Please select and copy the number manually."); }
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
      <p className="muted">Your court is temporarily held. Check the official recipient details
        below before transferring, then upload your receipt.
        <strong> A submitted proof is not a verified payment or confirmed booking.</strong></p>
      <div className="payment-total">
        <span>Amount to pay</span>
        <strong>{money(booking.totalAmount, booking.currency || venue.currency)}</strong>
      </div>
      <form className="booking-form" onSubmit={submit}>
        <fieldset className="method-options">
          <legend>Payment method</legend>
          <label className={method === "GCASH" ? "method selected-method" : "method"}>
            <input type="radio" name="method" checked={method === "GCASH"}
              onChange={() => { setMethod("GCASH"); setCopyStatus(""); }} /> GCash
          </label>
          <label className={method === "BANK_TRANSFER" ? "method selected-method" : "method"}>
            <input type="radio" name="method" checked={method === "BANK_TRANSFER"}
              onChange={() => { setMethod("BANK_TRANSFER"); setCopyStatus(""); }} /> Bank transfer
          </label>
        </fieldset>
        <div className="venue-payment-instructions" aria-live="polite">
          {instructions ? <>
            <p className="eyebrow">Official venue payment recipient</p>
            {method === "BANK_TRANSFER" && publicDetails.payments.bank &&
              <div><span>Bank</span><strong>{publicDetails.payments.bank.bankName}</strong></div>}
            <div><span>Account holder</span><strong>{instructions.accountName}</strong></div>
            <div><span>Account number</span><strong className="venue-account-number">
              {instructions.accountNumber}</strong></div>
            <button type="button" className="button-outline"
              onClick={() => void copyNumber(instructions.accountNumber)}>Copy account number</button>
            {copyStatus && <span role="status" className="form-hint">{copyStatus}</span>}
            {instructions.qrPath && <>
              <img className="venue-qr" src={instructions.qrPath}
                width={230} height={230} alt={"Official " +
                  (method === "GCASH" ? "GCash" : "bank transfer") + " QR code"}/>
            </>}
            <p className="form-hint">Confirm the recipient name and number in your payment app
              before sending. The venue verifies every transfer manually.</p>
          </> : <div className="alert info" role="status">
            <strong>Payment destination not yet published for {method === "GCASH" ? "GCash" : "bank transfer"}.</strong>
            <p>Do not transfer money to an unverified number or account. Contact the venue first.
              If you already paid using details confirmed directly by the venue, you may submit your receipt below.</p>
            <VenueContactLinks contact={publicDetails.contact} compact/>
          </div>}
        </div>
        <label className="field">
          <span>Transaction reference <b aria-hidden="true">*</b></span>
          <input required value={reference} maxLength={150} minLength={3}
            placeholder="Reference on your receipt"
            onChange={(e) => { setReference(e.target.value); setError(""); }} />
        </label>
        <label className="field">
          <span>Payment screenshot or receipt <b aria-hidden="true">*</b></span>
          <input ref={fileInput} type="file" required accept=".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf"
            aria-describedby="proof-hint" onChange={(e) => pickFile(e.target.files?.[0] || null)} />
          <span className="form-hint" id="proof-hint">PNG, JPG, WebP, or PDF · maximum 5 MB</span>
        </label>
        {file && <div className="proof-preview">
          <div><strong>Review the selected receipt</strong>
            <p>{file.name} · {(file.size / 1024).toFixed(0)} KB</p></div>
          {preview && file.type.startsWith("image/") && <>
            <button type="button" className="proof-image-button"
              aria-label="Enlarge selected receipt image" onClick={() => setExpanded(true)}>
              <img src={preview} alt="Thumbnail of the selected payment receipt" />
              <span>Tap to enlarge</span>
            </button>
          </>}
          {preview && file.type === "application/pdf" &&
            <a className="button-outline" href={preview} target="_blank"
              rel="noopener noreferrer">Open selected PDF locally</a>}
          <button type="button" className="text-button" onClick={() => {
            pickFile(null);
            if (fileInput.current) fileInput.current.value = "";
          }}>Remove and choose another</button>
        </div>}
        <ReceiptImageDialog src={file?.type.startsWith("image/") ? preview : null}
          open={expanded} onClose={() => setExpanded(false)}
          alt="Full-size selected payment receipt"/>
        {error && <p className="alert error" role="alert">{error}</p>}
        <button className="button-primary full-button" type="submit" disabled={busy || !file}
          aria-busy={busy}>{busy ? "Uploading receipt…" : "Submit receipt for review"}</button>
      </form>
      <p className="form-hint">The venue checks payment manually. If the hold or review window
        expires, please contact the venue before sending another transfer.</p>
    </section>
  );
}
