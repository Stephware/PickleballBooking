"use client";

import { useEffect, useMemo, useState } from "react";
import { adminRequest, extractError, todayForVenue, apiTime } from "@/lib/admin-client";
import { money, timeLabel } from "@/lib/player";
import type { CourtAdmin, StaffProfile } from "@/types/admin";
import type { AvailabilityDay, Slot, Venue } from "@/types/player";
import { Empty, Notice, SectionHeader, useAdminResource } from "@/components/admin/AdminShared";

type ManualResponse = {
  booking: { bookingCode: string; totalAmount: number; status: string; currency: string };
  accessToken: string;
};

export function AdminManual({ venue }: { user: StaffProfile; venue: Venue }) {
  const [date, setDate] = useState(() => todayForVenue(venue.timezone));
  const courts = useAdminResource<CourtAdmin[]>("/courts", []);
  const [courtId, setCourtId] = useState("");
  const [availability, setAvailability] = useState<AvailabilityDay | null>(null);
  const [availabilityVersion, setAvailabilityVersion] = useState(0);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [channel, setChannel] = useState("WALK_IN");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<ManualResponse | null>(null);

  useEffect(() => {
    if (!courtId) { setAvailability(null); return; }
    const controller = new AbortController();
    setAvailability(null); setStart(""); setEnd("");
    fetch("/api/player/availability?date=" + date + "&courtId=" + courtId,
      { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const body = await response.json() as AvailabilityDay & { error?: string };
        if (!response.ok) throw new Error(body.error || "No availability found.");
        return body;
      })
      .then(data => { if (!controller.signal.aborted) setAvailability(data); })
      .catch(cause => { if (!controller.signal.aborted) setError(extractError(cause)); });
    return () => controller.abort();
  }, [courtId, date, availabilityVersion]);

  const slots = availability?.courts[0]?.slots ?? [];
  const endOptions = useMemo(() => {
    const i = slots.findIndex(slot => slot.startsAt === start);
    if (i < 0) return [];
    const values: Slot[] = [];
    for (let k = i; k < Math.min(i + 8, slots.length); k++) {
      const s = slots[k];
      if (s.status !== "AVAILABLE" || (k > i && slots[k - 1].endsAtUtc !== s.startsAtUtc))
        break;
      values.push(s);
    }
    return values;
  }, [slots, start]);
  const selected = endOptions.filter(s => s.endsAt <= end);
  const total = selected.reduce((sum, s) => sum + s.totalPrice, 0);
  const ready = Boolean(start && end && selected.length > 0 &&
    selected[selected.length - 1].endsAt === end);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || !courtId || busy) return;
    setBusy(true); setError(""); setSaved(null);
    try {
      const result = await adminRequest<ManualResponse>("/operations/manual-bookings", "POST", {
        courtId: Number(courtId), date, startsAt: apiTime(start), endsAt: apiTime(end),
        guestName: guestName.trim(), guestPhone: guestPhone.trim() || null,
        guestEmail: guestEmail.trim() || null, notes: notes.trim() || null, channel,
      });
      setSaved(result); setGuestName(""); setGuestPhone(""); setGuestEmail(""); setNotes("");
      setStart(""); setEnd(""); setAvailabilityVersion(v => v + 1);
    } catch (cause) { setError(extractError(cause)); }
    finally { setBusy(false); }
  }
  return <>
    <SectionHeader eyebrow="Front desk" title="New staff booking"
      description="Record walk-ins, phone calls and Messenger reservations in the shared court schedule." />
    {error && <Notice>{error}</Notice>}
    <div className="admin-form-panel card-surface">
      <form className="admin-form" onSubmit={create}>
        <div className="admin-form-grid">
          <label>Booking channel<select value={channel} onChange={e => setChannel(e.target.value)}>
            <option value="WALK_IN">Walk-in</option><option value="PHONE">Phone</option>
            <option value="MESSENGER">Messenger</option>
          </select></label>
          <label>Date<input type="date" required min={todayForVenue(venue.timezone)}
            value={date} onChange={e => { setDate(e.target.value); setError(""); }} /></label>
          <label>Court<select required value={courtId}
            onChange={e => { setCourtId(e.target.value); setError(""); }}>
            <option value="">Select a court</option>
            {courts.data.filter(c => c.isActive).map(c =>
              <option value={c.id} key={c.id}>{c.courtName}</option>)}
          </select></label>
          <label>Start time<select required value={start}
            onChange={e => { setStart(e.target.value); setEnd(""); }}>
            <option value="">Choose available start</option>
            {slots.filter(s => s.status === "AVAILABLE").map(s =>
              <option key={s.startsAtUtc} value={s.startsAt}>{timeLabel(s.startsAt)}</option>)}
          </select></label>
          <label>End time<select required value={end} disabled={!start}
            onChange={e => setEnd(e.target.value)}>
            <option value="">Choose end time</option>
            {endOptions.map(s =>
              <option key={s.endsAtUtc} value={s.endsAt}>{timeLabel(s.endsAt)}</option>)}
          </select></label>
          <label>Full name<input required maxLength={150} value={guestName}
            onChange={e => setGuestName(e.target.value)} placeholder="Player name" /></label>
          <label>Phone<input type="tel" maxLength={32} value={guestPhone}
            onChange={e => setGuestPhone(e.target.value)} placeholder="Mobile number" /></label>
          <label>Email<input type="email" maxLength={254} value={guestEmail}
            onChange={e => setGuestEmail(e.target.value)} placeholder="Email address" /></label>
          <label className="admin-full">Notes (optional)<textarea rows={3} maxLength={500}
            value={notes} onChange={e => setNotes(e.target.value)} /></label>
        </div>
        {!slots.length && courtId && <Empty text="No scheduled times. Select another day or court." />}
        <div className="admin-form-footer">
          <div><span className="micro-label">Estimated booking total</span>
            <strong>{money(total, availability?.currency || venue.currency)}</strong>
            <small>Confirmed reservation, payment may still be outstanding.</small></div>
          <button className="button-primary" type="submit"
            disabled={!ready || busy || (!guestPhone.trim() && !guestEmail.trim())}>
            {busy ? "Creating…" : "Create confirmed booking"}</button>
        </div>
      </form>
    </div>
    {saved && <div className="admin-form-panel card-surface" role="status">
      <Notice kind="success">Reservation created: <strong>{saved.booking.bookingCode}</strong>
        · {saved.booking.status}.</Notice>
      <p className="admin-hint">The private guest access token appears only here.
        Share it securely with the guest if they need cross-device access.</p>
      <div className="admin-secret-row"><input readOnly type="password"
        aria-label="Guest booking access token" value={saved.accessToken} />
        <button type="button" className="button-outline" onClick={() =>
          void navigator.clipboard.writeText(saved.accessToken)}>Copy guest token</button></div>
    </div>}
  </>;
}
