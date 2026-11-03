"use client";

import { useState } from "react";
import { AdminSlotPicker, type StaffSelection } from "@/components/admin/AdminSlotPicker";
import { AccessMessage, Empty, Notice, SectionHeader, useAdminResource } from "@/components/admin/AdminShared";
import { adminRequest, apiTime, extractError, hasManagerRights, todayForVenue } from "@/lib/admin-client";
import { instantLabel, prettyDate, timeLabel } from "@/lib/player";
import type { CourtAdmin, CourtBlockAdmin, StaffProfile } from "@/types/admin";
import type { Venue } from "@/types/player";

export function AdminBlocks({ user, venue }: { user: StaffProfile; venue: Venue }) {
  const [date, setDate] = useState(() => todayForVenue(venue.timezone));
  const [selection, setSelection] = useState<StaffSelection | null>(null);
  const [stage, setStage] = useState<"slots" | "reason">("slots");
  const [reloadKey, setReloadKey] = useState(0);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const blocks = useAdminResource<CourtBlockAdmin[]>("/operations/blocks?date=" + date, []);
  const courts = useAdminResource<CourtAdmin[]>("/courts", []);
  const canManage = hasManagerRights(user);

  function changeDate(value: string) {
    setDate(value); setSelection(null); setStage("slots");
  }
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage || !selection || !selection.slots.length || busy) return;
    if (reason.trim().length < 3) { setError("Enter a reason for closing the court."); return; }
    setBusy(true); setError(""); setSuccess("");
    try {
      await adminRequest("/operations/blocks", "POST", {
        courtId: selection.courtId, date: selection.date,
        startsAt: apiTime(selection.slots[0].startsAt),
        endsAt: apiTime(selection.slots.at(-1)!.endsAt), reason: reason.trim(),
      });
      setSuccess("Court time blocked."); setReason(""); setSelection(null);
      setStage("slots"); setReloadKey(v => v + 1); await blocks.reload();
    } catch (cause) { setError(extractError(cause)); }
    finally { setBusy(false); }
  }
  async function remove(id: number) {
    if (busy || !window.confirm("Remove this block and make the time available again?")) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      await adminRequest("/operations/blocks/" + id + "/remove", "POST", {});
      setSuccess("Court block removed."); await blocks.reload();
      setSelection(null); setReloadKey(v => v + 1);
    } catch (cause) { setError(extractError(cause)); }
    finally { setBusy(false); }
  }
  return <section aria-label="Court maintenance blocks">
    <SectionHeader eyebrow="Schedule / Court closure" title="Block Court"
      description="Select available court time, then enter the reason for maintenance or a closure.
        Existing bookings are never replaced."/>
    {error && <Notice>{error}</Notice>}
    {success && <Notice kind="success">{success}</Notice>}
    {!canManage && <AccessMessage need="MANAGER"/>}
    {canManage && (stage === "slots" ? <>
      <AdminSlotPicker venue={venue} date={date} onDateChange={changeDate}
        selection={selection} onSelect={setSelection} reloadKey={reloadKey}/>
      {selection && selection.slots.length > 0 && <div className="admin-step-actions">
        <button type="button" className="button-primary" onClick={() => {
          setError(""); setStage("reason"); window.scrollTo({ top: 0, behavior: "smooth" });
        }}>Continue to reason →</button>
        <button type="button" className="text-button" onClick={() => setSelection(null)}>Clear selection</button>
      </div>}
    </> : selection ? <div className="admin-form-panel card-surface admin-booking-details">
      <button type="button" className="admin-detail-back"
        onClick={() => { setError(""); setStage("slots"); }}>← Back to court and time</button>
      <h3>Block these slots</h3>
      <p><strong>{selection.courtName}</strong> · {prettyDate(selection.date)} · {
        timeLabel(selection.slots[0].startsAt)} – {timeLabel(selection.slots.at(-1)!.endsAt)}</p>
      <form className="admin-form" onSubmit={create}>
        <label>Reason for closure
          <input required minLength={3} maxLength={300}
            placeholder="Maintenance, cleaning or private event"
            value={reason} onChange={e => setReason(e.target.value)}/>
        </label>
        <p className="admin-hint">The block takes effect immediately and cannot overlap an active reservation.
          Removing a block later will release these time slots.</p>
        <button className="button-primary" type="submit" disabled={busy || reason.trim().length < 3}>
          {busy ? "Saving…" : "Confirm court block"}</button>
      </form>
    </div> : <Empty text="Select court slots first." />)}
    <div className="admin-panel card-surface">
      <div className="admin-panel-heading"><h3>Blocks on selected date</h3>
        <span className="micro-label">{date}</span></div>
      {(blocks.error || courts.error) && <Notice>{blocks.error || courts.error}</Notice>}
      {blocks.loading ? <p role="status">Loading court blocks…</p>
        : blocks.data.length === 0 ? <Empty text="No court blocks for this date."/>
        : blocks.data.map(b => <div className="admin-list-row" key={b.id}>
          <div><strong>{courts.data.find(c => c.id === b.courtId)?.courtName || "Court " + b.courtId}</strong>
            <small>{instantLabel(b.startsAtUtc, venue.timezone)} – {instantLabel(b.endsAtUtc, venue.timezone)}</small>
            <small>{b.reason}</small></div>
          <div className="admin-row-actions">
            <span className={"admin-status status-" + b.status.toLowerCase()}>
              {b.status.replaceAll("_", " ")}</span>
            {canManage && b.status === "BLOCKED" && <button className="admin-danger-link"
              type="button" disabled={busy} onClick={() => void remove(b.id)}>Remove</button>}
          </div>
        </div>)}
    </div>
  </section>;
}
