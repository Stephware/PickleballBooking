"use client";

import { useState } from "react";
import { AdminSlotPicker, type StaffSelection } from "@/components/admin/AdminSlotPicker";
import { Empty, Notice, SectionHeader } from "@/components/admin/AdminShared";
import { adminRequest, apiTime, extractError, todayForVenue } from "@/lib/admin-client";
import { selectionAmount } from "@/lib/admin-schedule";
import { money, prettyDate, timeLabel } from "@/lib/player";
import type { StaffProfile } from "@/types/admin";
import type { Venue } from "@/types/player";

type ManualResponse = {
  booking: { bookingCode: string; totalAmount: number; status: string; currency: string };
  accessToken: string;
};
type Channel = "WALK_IN" | "PHONE" | "MESSENGER";

export function AdminManual({ venue }: { user: StaffProfile; venue: Venue }) {
  const [date, setDate] = useState(() => todayForVenue(venue.timezone));
  const [selection, setSelection] = useState<StaffSelection | null>(null);
  const [stage, setStage] = useState<"slots" | "details">("slots");
  const [reloadKey, setReloadKey] = useState(0);
  const [channel, setChannel] = useState<Channel>("WALK_IN");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<ManualResponse | null>(null);

  function changeChannel(next: Channel) {
    setChannel(next);
    setSelection(null); setStage("slots"); setError("");
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selection || !selection.slots.length || busy) return;
    if (!guestName.trim() || (!guestPhone.trim() && !guestEmail.trim())) {
      setError("Enter the guest's name and a phone number or email."); return;
    }
    setBusy(true); setError(""); setSaved(null);
    try {
      const result = await adminRequest<ManualResponse>("/operations/manual-bookings", "POST", {
        courtId: selection.courtId, date: selection.date,
        startsAt: apiTime(selection.slots[0].startsAt),
        endsAt: apiTime(selection.slots.at(-1)!.endsAt),
        guestName: guestName.trim(), guestPhone: guestPhone.trim() || null,
        guestEmail: guestEmail.trim() || null, notes: notes.trim() || null,
        channel,
      });
      setSaved(result); setGuestName(""); setGuestPhone(""); setGuestEmail(""); setNotes("");
      setSelection(null); setStage("slots"); setReloadKey(v => v + 1);
    } catch (cause) { setError(extractError(cause)); }
    finally { setBusy(false); }
  }

  return <section aria-label="Create a staff reservation">
    <SectionHeader eyebrow="Schedule / New reservation" title="Add Booking"
      description="Choose the court and time first, then enter guest details. New staff bookings are confirmed immediately; payment can be recorded separately." />
    {error && <Notice>{error}</Notice>}
    {saved && <div className="admin-panel card-surface" role="status">
      <Notice kind="success">Booking <strong>{saved.booking.bookingCode}</strong> created and confirmed.</Notice>
      <p className="admin-hint">Keep the private guest token secure. Share it privately only if the guest needs access from another browser.</p>
      <div className="admin-secret-row">
        <input readOnly type="password" aria-label="New booking guest access token"
          value={saved.accessToken}/>
        <button type="button" className="button-outline"
          onClick={() => void navigator.clipboard.writeText(saved.accessToken)}>
          Copy private token</button>
      </div>
    </div>}
    {stage === "slots" ? <>
      <div className="admin-channel-picker">
        <span className="micro-label">How did this booking come in?</span>
        <div className="admin-channel-buttons" role="group" aria-label="Booking source">
          {([{ id: "WALK_IN", label: "Walk-in" }, { id: "PHONE", label: "Phone" },
            { id: "MESSENGER", label: "Messenger" }] as const).map(item =>
            <button type="button" key={item.id}
              className={channel === item.id ? "active" : ""}
              aria-pressed={channel === item.id} onClick={() => changeChannel(item.id)}>
              {item.label}</button>)}
        </div>
      </div>
      <AdminSlotPicker venue={venue} date={date} onDateChange={setDate}
        selection={selection} onSelect={setSelection} reloadKey={reloadKey}
        allowWalkInNow={channel === "WALK_IN"}/>
      {selection && selection.slots.length > 0 && <div className="admin-step-actions">
        <button className="button-primary" type="button" onClick={() => {
          setError(""); setStage("details"); window.scrollTo({ top: 0, behavior: "smooth" });
        }}>Continue to guest details →</button>
        <button className="text-button" type="button" onClick={() => setSelection(null)}>
          Clear selection</button>
      </div>}
    </> : selection ? <div className="admin-form-panel card-surface admin-booking-details">
      <button type="button" className="admin-detail-back"
        onClick={() => { setError(""); setStage("slots"); }}>← Back to court and time</button>
      <h3>Guest details</h3>
      <div className="admin-selected-recap">
        <div><small>Court</small><strong>{selection.courtName}</strong></div>
        <div><small>Date</small><strong>{prettyDate(selection.date)}</strong></div>
        <div><small>Time</small><strong>{timeLabel(selection.slots[0].startsAt)} – {
          timeLabel(selection.slots.at(-1)!.endsAt)}</strong></div>
        <div><small>Total</small><strong>{money(selectionAmount(selection.slots), selection.currency)}</strong></div>
      </div>
      <form className="admin-form" onSubmit={create}>
        <div className="admin-form-grid">
          <label>Full name <input required maxLength={150} autoComplete="off"
            placeholder="Guest name" value={guestName}
            onChange={e => setGuestName(e.target.value)}/></label>
          <label>Phone <input type="tel" maxLength={32} autoComplete="off"
            placeholder="09xx xxx xxxx" value={guestPhone}
            onChange={e => setGuestPhone(e.target.value)}/></label>
          <label>Email <input type="email" maxLength={254} autoComplete="off"
            placeholder="name@example.com" value={guestEmail}
            onChange={e => setGuestEmail(e.target.value)}/></label>
          <label className="admin-full">Notes (optional)
            <textarea rows={2} maxLength={500} value={notes}
              onChange={e => setNotes(e.target.value)}/></label>
        </div>
        <p className="admin-hint">Provide phone or email. This saves a confirmed booking, not a verified payment.
          The backend checks availability again before saving.</p>
        <button type="submit" className="button-primary"
          disabled={busy || !guestName.trim() || (!guestPhone.trim() && !guestEmail.trim())}>
          {busy ? "Creating…" : "Confirm booking"}</button>
      </form>
    </div> : <Empty text="Choose a court and time to begin."/>}
  </section>;
}
