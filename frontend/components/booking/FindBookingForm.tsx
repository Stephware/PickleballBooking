"use client";

import { useRouter } from "next/navigation";
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
      <p className="eyebrow">Private booking access</p>
      <h1>Find your reservation.</h1>
      <p className="muted">Enter your booking reference to reopen a reservation made
        on this device. If you were given a private access token by the venue,
        enter it below to access the booking from another browser.</p>
      <form className="booking-form" onSubmit={open}>
        <label className="field"><span>Booking reference</span>
          <input required maxLength={19} autoCapitalize="characters"
            placeholder="PB-0123456789ABCDEF" value={code}
            onChange={(e) => { setCode(e.target.value); setError(""); }} />
        </label>
        <label className="field"><span>Access token <span className="muted">(optional on this device)</span></span>
          <input type="password" autoComplete="off" value={token}
            placeholder="Private token supplied by the venue"
            onChange={(e) => { setToken(e.target.value); setError(""); }} />
        </label>
        {error && <p className="alert error" role="alert">{error}</p>}
        <button type="submit" className="button-primary" disabled={busy}>
          {busy ? "Opening…" : "View my booking"} <span aria-hidden="true">→</span>
        </button>
      </form>
    </div>
  );
}
