"use client";

import { useState } from "react";
import { adminRequest, extractError, hasManagerRights } from "@/lib/admin-client";
import { instantLabel, money } from "@/lib/player";
import type { PaymentSummaryAdmin, StaffProfile } from "@/types/admin";
import { Empty, Notice } from "@/components/admin/AdminShared";

export function PaymentLedger({ user }: { user: StaffProfile }) {
  const [code, setCode] = useState("");
  const [summary, setSummary] = useState<PaymentSummaryAdmin | null>(null);
  const [method, setMethod] = useState("CASH");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [refundId, setRefundId] = useState<number | null>(null);
  const [refundReference, setRefundReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load(target = code) {
    const ref = target.trim().toUpperCase();
    if (!/^PB-[0-9A-F]{16}$/.test(ref))
      throw new Error("Enter a valid PB- booking reference.");
    const result = await adminRequest<PaymentSummaryAdmin>("/payments/bookings/" + ref);
    setCode(ref); setSummary(result);
  }
  async function find(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try { await load(); }
    catch (cause) { setError(extractError(cause)); setSummary(null); }
    finally { setBusy(false); }
  }
  async function record(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!summary) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await adminRequest("/payments/bookings/" + summary.bookingCode, "POST", {
        paymentMethod: method, amount: Number(amount),
        transactionReference: reference.trim() || null, notes: notes.trim() || null,
      });
      setAmount(""); setReference(""); setNotes("");
      setMessage("Payment claim recorded. Owner/Manager verification is still required.");
      await load(summary.bookingCode);
    } catch (cause) { setError(extractError(cause)); }
    finally { setBusy(false); }
  }
  async function recordRefund(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!summary || refundId === null) return;
    if (!window.confirm("Confirm this refund was already completed outside the system?")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await adminRequest("/payments/" + refundId + "/record-refund", "POST", {
        refundReference: refundReference.trim(),
      });
      setRefundId(null); setRefundReference("");
      setMessage("External refund recorded; no money was sent by this app.");
      await load(summary.bookingCode);
    } catch (cause) { setError(extractError(cause)); }
    finally { setBusy(false); }
  }

  return <section className="admin-ledger card-surface">
    <h3>Booking payment ledger</h3>
    <p className="muted">Search a reference to view verified amounts or record a payment
      received in person. Recorded transfers still require review.</p>
    <form className="admin-inline-form" onSubmit={find}>
      <label>Booking reference<input value={code} maxLength={19} required
        placeholder="PB-0123456789ABCDEF"
        onChange={e => setCode(e.target.value.toUpperCase())} /></label>
      <button className="button-outline" disabled={busy} type="submit">Find booking</button>
    </form>
    {error && <Notice>{error}</Notice>}
    {message && <Notice kind="success">{message}</Notice>}
    {summary && <>
      <div className="admin-ledger-totals">
        <div><span className="micro-label">BOOKING TOTAL</span><strong>
          {money(summary.bookingTotal, summary.currency)}</strong></div>
        <div><span className="micro-label">VERIFIED</span><strong>
          {money(summary.verifiedTotal, summary.currency)}</strong></div>
        <div><span className="micro-label">BALANCE DUE</span><strong>
          {money(summary.balanceDue, summary.currency)}</strong></div>
      </div>
      <p className="admin-hint">Booking status: {summary.bookingStatus.replaceAll("_", " ")}</p>
      {summary.payments.length === 0 ? <Empty text="No payment entries yet." /> :
        summary.payments.map(p => <div className="admin-list-row" key={p.id}>
          <div><strong>{p.paymentMethod.replaceAll("_", " ")}</strong>
            <small>{p.status} · {instantLabel(p.submittedAtUtc, "Asia/Manila")}</small>
            {p.transactionReference && <small>Reference: {p.transactionReference}</small>}</div>
          <div className="admin-row-actions"><strong>{money(p.amount, summary.currency)}</strong>
            {hasManagerRights(user) && summary.bookingStatus === "CANCELLED" &&
              p.status === "VERIFIED" && <button type="button" className="text-button"
                onClick={() => { setRefundId(p.id); setRefundReference(""); }}>
                Record refund</button>}
          </div>
        </div>)}
      {summary.bookingStatus === "CONFIRMED" && summary.balanceDue > 0 && <form
        className="admin-form admin-ledger-form" onSubmit={record}>
        <h4>Record an external payment</h4>
        <div className="admin-form-grid">
          <label>Method<select value={method} onChange={e => setMethod(e.target.value)}>
            <option value="CASH">Cash</option><option value="GCASH">GCash</option>
            <option value="BANK_TRANSFER">Bank transfer</option>
            <option value="OTHER">Other</option>
          </select></label>
          <label>Amount<input required type="number" min=".01" step=".01"
            max={summary.balanceDue} value={amount}
            onChange={e => setAmount(e.target.value)} placeholder="Enter amount" /></label>
          <label>Transaction reference<input maxLength={150}
            required={method === "GCASH" || method === "BANK_TRANSFER"}
            value={reference} onChange={e => setReference(e.target.value)} /></label>
          <label>Notes<input maxLength={500} value={notes}
            onChange={e => setNotes(e.target.value)} /></label>
        </div>
        <button className="button-primary" type="submit" disabled={busy || !amount}>
          Record payment claim</button>
      </form>}
      {refundId !== null && <form className="admin-form admin-ledger-form"
        onSubmit={recordRefund}>
        <h4>Record previously completed external refund</h4>
        <label>External refund reference<input required minLength={3} maxLength={150}
          value={refundReference} onChange={e => setRefundReference(e.target.value)} /></label>
        <div className="admin-action-row">
          <button className="button-primary" type="submit" disabled={busy}>Record refund</button>
          <button type="button" className="button-outline" onClick={() => setRefundId(null)}>
            Cancel</button>
        </div>
        <p className="admin-hint">This action does not initiate a bank/GCash refund.</p>
      </form>}
    </>}
  </section>;
}
