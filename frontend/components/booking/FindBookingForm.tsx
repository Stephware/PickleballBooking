"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { jsonRequest } from "@/lib/player";

export function FindBookingForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function open(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!/^PB-[0-9A-F]{16}$/.test(normalized)) {
      setError("Enter a booking code in the format PB- followed by 16 characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (token.trim()) {
        await jsonRequest<{ ok: boolean }>("/api/player/bookings/" + normalized + "/access", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: token.trim() }),
        });
      }
      router.push("/booking/" + normalized);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open the booking.");
      setBusy(false);
    }
  }
  return (
    <div className="access-card card-surface">
      <Link href="/" className="subpage-back">← Back to courts</Link>
      <p className="eyebrow">Private booking access</p>
      <h1>Find your reservation.</h1>
      <p className="muted">Enter the booking code you received when you reserved a court.
        Reservations made in this browser normally open without an extra token.</p>
      <form className="booking-form" onSubmit={open}>
        <label className="field"><span>Booking reference</span>
          <input required maxLength={19} autoCapitalize="characters"
            placeholder="PB-0123456789ABCDEF" value={code}
            onChange={(e) => { setCode(e.target.value); setError(""); }} />
        </label>
        <details className="booking-access-details">
          <summary>Using another device? Enter your private access token</summary>
          <label className="field"><span>Private access token</span>
            <input type="password" autoComplete="off" value={token}
              placeholder="Token supplied privately by the venue"
              onChange={(e) => { setToken(e.target.value); setError(""); }} />
          </label>
          <p className="form-hint">A booking code alone cannot reveal private guest details
            on another device. Contact the venue if you have no access token.</p>
        </details>
        {error && <p className="alert error" role="alert">{error}</p>}
        <button type="submit" className="button-primary" disabled={busy}>
          {busy ? "Opening…" : "View my booking"} <span aria-hidden="true">→</span>
        </button>
      </form>
    </div>
  );
}
