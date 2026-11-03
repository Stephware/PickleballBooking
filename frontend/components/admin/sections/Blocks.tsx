"use client";

import { useState } from "react";
import { adminRequest, apiTime, extractError, hasManagerRights, todayForVenue } from "@/lib/admin-client";
import { instantLabel } from "@/lib/player";
import type { CourtAdmin, CourtBlockAdmin, StaffProfile } from "@/types/admin";
import type { Venue } from "@/types/player";
import { Empty, Notice, SectionHeader, useAdminResource } from "@/components/admin/AdminShared";

export function AdminBlocks({ user, venue }: { user: StaffProfile; venue: Venue }) {
  const [date, setDate] = useState(() => todayForVenue(venue.timezone));
  const [courtId, setCourtId] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const blocks = useAdminResource<CourtBlockAdmin[]>("/operations/blocks?date=" + date, []);
  const courts = useAdminResource<CourtAdmin[]>("/courts", []);
  const canManage = hasManagerRights(user);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!canManage || busy) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      await adminRequest("/operations/blocks", "POST", {
        courtId: Number(courtId), date, startsAt: apiTime(start), endsAt: apiTime(end), reason: reason.trim(),
      });
      setSuccess("Court block added."); setReason("");
      await blocks.reload();
    } catch (cause) { setError(extractError(cause)); }
    finally { setBusy(false); }
  }
  async function remove(id: number) {
    if (!window.confirm("Remove this court block and release its time?")) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      await adminRequest("/operations/blocks/" + id + "/remove", "POST", {});
      setSuccess("Court block removed."); await blocks.reload();
    } catch (cause) { setError(extractError(cause)); }
    finally { setBusy(false); }
  }
  return <>
    <SectionHeader eyebrow="Court maintenance" title="Court blocks"
      description="Keep maintenance or closures out of the bookable schedule." />
    <div className="admin-toolbar"><label>Date<input type="date" value={date}
      onChange={e => setDate(e.target.value)} /></label></div>
    {(error || blocks.error) && <Notice>{error || blocks.error}</Notice>}
    {success && <Notice kind="success">{success}</Notice>}
    {canManage && <div className="admin-form-panel card-surface">
      <h3>Add a maintenance block</h3>
      <form className="admin-form" onSubmit={create}>
        <div className="admin-form-grid">
          <label>Court<select required value={courtId} onChange={e => setCourtId(e.target.value)}>
            <option value="">Select court</option>
            {courts.data.filter(c => c.isActive).map(c => <option value={c.id} key={c.id}>{c.courtName}</option>)}
          </select></label>
          <label>Start time<input required type="time" value={start} onChange={e => setStart(e.target.value)} /></label>
          <label>End time<input required type="time" value={end} onChange={e => setEnd(e.target.value)} /></label>
          <label className="admin-full">Reason<input required minLength={3} maxLength={300}
            placeholder="Maintenance or private event" value={reason}
            onChange={e => setReason(e.target.value)} /></label>
        </div>
        <button className="button-primary" disabled={busy || !courtId || start >= end}
          type="submit">{busy ? "Saving…" : "Block court time"}</button>
      </form>
      <p className="admin-hint">Use complete venue time slots and ensure the court is free.
        Existing bookings cannot be overwritten.</p>
    </div>}
    <div className="admin-panel card-surface">
      <h3>Blocks on selected date</h3>
      {blocks.loading ? <p role="status">Loading blocks…</p>
        : blocks.data.length === 0 ? <Empty text="No maintenance blocks on this date." />
        : blocks.data.map(b => <div className="admin-list-row" key={b.id}>
          <div><strong>{courts.data.find(c => c.id === b.courtId)?.courtName || "Court " + b.courtId}</strong>
            <small>{instantLabel(b.startsAtUtc, venue.timezone)} – {instantLabel(b.endsAtUtc, venue.timezone)}</small>
            <small>{b.reason}</small></div>
          <div className="admin-row-actions"><span className={"admin-status status-" + b.status.toLowerCase()}>{b.status}</span>
            {canManage && b.status === "BLOCKED" && <button className="admin-danger-link"
              type="button" disabled={busy} onClick={() => void remove(b.id)}>Remove</button>}</div>
        </div>)}
    </div>
  </>;
}
