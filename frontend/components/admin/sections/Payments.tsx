"use client";

import { useRef, useState } from "react";
import { adminRequest, extractError, hasManagerRights } from "@/lib/admin-client";
import { instantLabel, money } from "@/lib/player";
import { PaymentLedger } from "@/components/admin/sections/PaymentLedger";
import { ReceiptImageDialog } from "@/components/ui/ReceiptImageDialog";
import { Empty, Loading, Notice, SectionHeader, useAdminResource } from "@/components/admin/AdminShared";
import type { PendingPayment, PaymentSummaryAdmin, StaffProfile } from "@/types/admin";

export function AdminPayments({ user }: { user: StaffProfile }) {
  const { data: pending, loading, error: loadError, reload } =
    useAdminResource<PendingPayment[]>("/payments/pending", []);
  const [selected, setSelected] = useState<PendingPayment | null>(null);
  const [proofError, setProofError] = useState(false);
  const [proofReady, setProofReady] = useState(false);
  const [enlarged, setEnlarged] = useState(false);
  const detailRef = useRef<HTMLElement>(null);
  const detailVersion = useRef(0);
  const [details, setDetails] = useState<PaymentSummaryAdmin | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const canManage = hasManagerRights(user);

  async function select(payment: PendingPayment) {
    const version = ++detailVersion.current;
    setSelected(payment); setDetails(null); setNotes(""); setError(""); setMessage("");
    setProofError(false); setProofReady(false); setEnlarged(false);
    try {
      const result = await adminRequest<PaymentSummaryAdmin>(
        "/payments/bookings/" + payment.bookingCode);
      if (version === detailVersion.current) setDetails(result);
    } catch (cause) {
      if (version === detailVersion.current) setError(extractError(cause));
    }
    if (window.matchMedia("(max-width: 950px)").matches) {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function review(decision: "approve" | "reject") {
    if (!selected || busy || !canManage) return;
    if (!window.confirm(decision === "approve"
      ? "Have you verified this transfer against the venue's actual account records?"
      : "Reject this payment? An awaiting-review booking may be released.")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await adminRequest("/payments/" + selected.paymentId + "/" + decision,
        "POST", { notes: notes.trim() || null });
      setMessage(decision === "approve"
        ? "Payment marked verified after review."
        : "Payment rejected. Review any transferred funds separately.");
      ++detailVersion.current;
      setSelected(null); setDetails(null); setNotes(""); setEnlarged(false);
      await reload();
    } catch (cause) { setError(extractError(cause)); }
    finally { setBusy(false); }
  }

  return <>
    <SectionHeader eyebrow="Financial review" title="Payment approvals"
      description="Compare proof and reference against actual bank or GCash records before approving."
      action={<button type="button" className="button-outline"
        onClick={() => void reload()} disabled={loading}>↻ Refresh queue</button>} />
    <div className="admin-review-layout">
      <section className="admin-panel card-surface" aria-label="Pending payment queue">
        <div className="admin-panel-heading"><h3>Awaiting verification</h3>
          <span className="admin-count">{loading || loadError ? "—" : pending.length}</span></div>
        {loadError && <Notice>{loadError} <button type="button"
          className="inline-link" onClick={() => void reload()}>Try again</button></Notice>}
        {loading ? <Loading /> : loadError ? <Empty text="Payment queue could not be loaded." /> :
          pending.length === 0
          ? <Empty text="No payment submissions are waiting for review." />
          : pending.map((p) => <button type="button" key={p.paymentId}
            className={"admin-queue-item" + (selected?.paymentId === p.paymentId ? " selected" : "")}
            onClick={() => void select(p)}>
            <span><strong>{p.guestName}</strong>
              <small>{p.bookingCode} · {p.paymentMethod.replaceAll("_", " ")}</small></span>
            <strong>{money(p.amount, details?.currency || "PHP")}</strong>
          </button>)}
      </section>
      <section ref={detailRef} className="admin-panel card-surface admin-review-detail"
        aria-label="Payment review details">
        {selected && <button type="button" className="admin-detail-back"
          onClick={() => { ++detailVersion.current; setSelected(null); setDetails(null); setError("");
            setEnlarged(false); }}>
          ← Back to payment queue</button>}
        <div className="admin-panel-heading"><h3>Review details</h3></div>
        {!selected ? <Empty text="Select a submitted payment to view its reference and proof." />
          : <>
            {error && <Notice>{error} <button type="button" className="inline-link"
              onClick={() => void select(selected)}>Try again</button></Notice>}
            {!details && !error ? <Loading text="Loading payment details…" /> : details ?
              <div className="admin-payment-detail">
                <dl className="admin-definition">
                  <div><dt>Guest</dt><dd>{selected.guestName}</dd></div>
                  <div><dt>Booking</dt><dd>{selected.bookingCode}</dd></div>
                  <div><dt>Booking status</dt><dd>{details.bookingStatus.replaceAll("_", " ")}</dd></div>
                  <div><dt>Method</dt><dd>{selected.paymentMethod.replaceAll("_", " ")}</dd></div>
                  <div><dt>Claimed amount</dt><dd>{money(selected.amount, details.currency)}</dd></div>
                  <div><dt>Booking total</dt><dd>{money(details.bookingTotal, details.currency)}</dd></div>
                  <div><dt>Submitted</dt><dd>{instantLabel(selected.submittedAtUtc, "Asia/Manila")}</dd></div>
                  <div><dt>Reference</dt><dd>{details.payments.find(p => p.id === selected.paymentId)
                    ?.transactionReference || "None supplied"}</dd></div>
                </dl>
                {selected.hasProof ? <div className="admin-proof">
                  <p className="micro-label">PRIVATE PAYMENT PROOF</p>
                  <p className="admin-hint">Inspect the receipt closely, then independently
                    verify the transaction in the venue&apos;s bank or GCash account before approving.</p>
                  {!proofError ? <button type="button" className="admin-proof-image-button"
                    disabled={!proofReady} aria-label="Enlarge submitted payment receipt"
                    onClick={() => setEnlarged(true)}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- authenticated preview */}
                    <img src={"/api/admin/payments/" + selected.paymentId + "/proof"}
                      alt="Submitted payment proof; compare against actual transfer records"
                      onLoad={() => setProofReady(true)}
                      onError={() => { setProofReady(false); setProofError(true); }}/>
                    {proofReady && <span>Tap to view full size</span>}
                  </button> : <Notice kind="info">This receipt is a PDF or its image cannot be displayed
                    here. Use the protected download link to inspect it.</Notice>}
                  <a className="button-outline" href={"/api/admin/payments/" +
                    selected.paymentId + "/proof"} target="_blank" rel="noopener noreferrer">
                    Open receipt / download PDF securely
                  </a>
                  <ReceiptImageDialog
                    src={proofError ? null : "/api/admin/payments/" + selected.paymentId + "/proof"}
                    open={enlarged} onClose={() => setEnlarged(false)}
                    alt="Enlarged private payment proof for staff review"/>
                </div> : <Notice kind="info">This payment has no uploaded receipt.
                  Verify the claimed payment externally.</Notice>}
                {canManage ? <>
                  <label className="admin-field">Review notes (optional)
                    <textarea value={notes} maxLength={500} rows={3}
                      onChange={(e) => setNotes(e.target.value)} /></label>
                  <div className="admin-action-row">
                    <button type="button" className="button-primary"
                      onClick={() => void review("approve")} disabled={busy}>
                      {busy ? "Processing…" : "Approve verified payment"}</button>
                    <button type="button" className="button-outline destructive"
                      onClick={() => void review("reject")} disabled={busy}>
                      Reject payment</button>
                  </div>
                </> : <Notice kind="info">Owner or Manager approval required.</Notice>}
              </div>}
          </>}
      </section>
    </div>
    {message && <Notice kind="success">{message}</Notice>}
    <details className="admin-ledger-disclosure">
      <summary><strong>Other payment actions</strong>
        <span>Find a booking, record an external payment or a completed refund</span></summary>
      <PaymentLedger user={user} />
    </details>
    <p className="admin-hint">Approving a receipt is a manual financial attestation, not an
      automatic bank verification. Expired bookings may need separate reconciliation.</p>
  </>;
}
