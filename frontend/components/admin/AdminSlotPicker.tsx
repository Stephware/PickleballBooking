"use client";

import { Fragment, useEffect, useState } from "react";
import { adminRequest, extractError, todayForVenue } from "@/lib/admin-client";
import { addDays, money, timeLabel, slotMeta } from "@/lib/player";
import { extendStaffSlots, selectionAmount } from "@/lib/admin-schedule";
import type { AvailabilityDay, Slot, Venue } from "@/types/player";
import { Empty, Loading, Notice } from "@/components/admin/AdminShared";

export type StaffSelection = {
  date: string; courtId: number; courtName: string; currency: string; slots: Slot[];
};

export function AdminSlotPicker({ venue, date, onDateChange, selection, onSelect,
  allowWalkInNow = false, reloadKey = 0 }: {
  venue: Venue; date: string; onDateChange: (date: string) => void;
  selection: StaffSelection | null; onSelect: (selection: StaffSelection | null) => void;
  allowWalkInNow?: boolean; reloadKey?: number;
}) {
  const [day, setDay] = useState<AvailabilityDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const [preferredCourt, setPreferredCourt] = useState<number | null>(null);
  const today = todayForVenue(venue.timezone);

  useEffect(() => {
    let active = true;
    adminRequest<AvailabilityDay>("/operations/availability?date=" + encodeURIComponent(date))
      .then(result => { if (active) { setDay(result); setError(""); } })
      .catch(reason => { if (active) { setDay(null); setError(extractError(reason)); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [date, version, reloadKey]);

  const current = day?.date === date ? day : null;
  const courts = current?.courts ?? [];
  const activeCourt = courts.find(c => c.courtId === preferredCourt) ?? courts[0];
  const rows = courts[0]?.slots ?? [];

  function changeDate(next: string) {
    if (!next) return;
    setLoading(true); setDay(null); setError("");
    onSelect(null); onDateChange(next);
  }
  function reload() {
    setLoading(true); setDay(null); setError(""); onSelect(null);
    setVersion(v => v + 1);
  }
  function pick(courtId: number, courtName: string, slot: Slot) {
    const mine = selection?.courtId === courtId && selection.date === date
      ? selection.slots : [];
    const slots = extendStaffSlots(mine, slot, allowWalkInNow);
    if (!slots) return;
    onSelect({ date, courtId, courtName, currency: current?.currency ?? venue.currency, slots });
  }

  function renderSlot(courtId: number, courtName: string, slot: Slot) {
    const selected = selection?.courtId === courtId &&
      selection.slots.some(s => s.startsAtUtc === slot.startsAtUtc);
    const permitted = slot.status === "AVAILABLE" ||
      (allowWalkInNow && slot.status === "WALK_IN_NOW");
    const short = slot.status === "WALK_IN_NOW" ? "Walk-in now" :
      slotMeta[slot.status]?.short ?? slot.status.replaceAll("_", " ");
    return <button type="button" key={courtId + "-" + slot.startsAtUtc}
      className={"admin-slot-cell admin-slot-" + slot.status.toLowerCase() +
        (selected ? " admin-slot-selected" : "")}
      disabled={!permitted} aria-pressed={Boolean(selected)}
      aria-label={courtName + ", " + timeLabel(slot.startsAt) + " to " +
        timeLabel(slot.endsAt) + ", " + short +
        (permitted ? ", " + money(slot.totalPrice, current?.currency ?? venue.currency) : "")}
      onClick={() => pick(courtId, courtName, slot)}>
      <span>{selected ? "✓ " : ""}{short}</span>
      {permitted && <strong>{money(slot.totalPrice, current?.currency ?? venue.currency)}</strong>}
    </button>;
  }

  return <section className="admin-slot-picker" aria-label="Select court and times">
    <div className="admin-picker-toolbar">
      <div className="admin-picker-date">
        <button type="button" className="admin-picker-arrow" aria-label="Previous day"
          disabled={date <= today} onClick={() => changeDate(addDays(date, -1))}>‹</button>
        <label>Date <input type="date" value={date} min={today} max={addDays(today, 365)}
          onChange={e => changeDate(e.target.value)} /></label>
        <button type="button" className="admin-picker-arrow" aria-label="Next day"
          disabled={date >= addDays(today, 365)}
          onClick={() => changeDate(addDays(date, 1))}>›</button>
      </div>
      <button type="button" className="button-outline" disabled={loading}
        onClick={reload}>↻ Refresh slots</button>
    </div>
    <p className="admin-hint">Select up to 8 consecutive available slots on one court.
      {allowWalkInNow && " A started slot is offered only for a walk-in during the first part of its session."}
      {" "}A held, pending, reserved or blocked time cannot be selected.</p>
    {error && <Notice>{error}</Notice>}
    {loading && <Loading text="Loading live court availability…"/>}
    {!loading && current?.isClosed && <Empty text="The venue is closed on this date. Choose another day."/>}
    {!loading && current && !current.isClosed && courts.length === 0 &&
      <Empty text="No active courts have been configured."/>}
    {!loading && current && !current.isClosed && courts.length > 0 && rows.length === 0 &&
      <Empty text="No complete court time slots on this date."/>}
    {!loading && current && !current.isClosed && rows.length > 0 && <>
      <div className="admin-court-tabs" aria-label="Choose a court for small screens">
        {courts.map(c => <button type="button" key={c.courtId}
          className={activeCourt?.courtId === c.courtId ? "active" : ""}
          aria-pressed={activeCourt?.courtId === c.courtId}
          onClick={() => { setPreferredCourt(c.courtId); onSelect(null); }}>{c.courtName}</button>)}
      </div>
      <div className="admin-slot-desktop card-surface" role="region"
        aria-label="Court by time schedule" tabIndex={0}>
        <div className="admin-slot-grid" style={{
          gridTemplateColumns: "105px repeat(" + courts.length + ", minmax(140px, 1fr))",
        }}>
          <div className="admin-slot-heading sticky-time">Time</div>
          {courts.map(c => <div className="admin-slot-heading" key={c.courtId}>
            {c.courtName}</div>)}
          {rows.map((row, i) => <Fragment key={row.startsAtUtc}>
            <div className="admin-slot-hour sticky-time">{timeLabel(row.startsAt)}</div>
            {courts.map(c => c.slots[i]
              ? renderSlot(c.courtId, c.courtName, c.slots[i])
              : <div key={c.courtId} className="admin-slot-missing"/>)}
          </Fragment>)}
        </div>
      </div>
      <div className="admin-slot-mobile" aria-label="Available slots for selected court">
        {activeCourt?.slots.map(s => <div key={s.startsAtUtc} className="admin-mobile-slot">
          <span className="admin-mobile-hour">{timeLabel(s.startsAt)}</span>
          {renderSlot(activeCourt.courtId, activeCourt.courtName, s)}
        </div>)}
      </div>
    </>}
    {selection && selection.slots.length > 0 && <div className="admin-picked-summary"
      role="status" aria-live="polite">
      <div>
        <span className="micro-label">Selected court and time</span>
        <strong>{selection.courtName} · {timeLabel(selection.slots[0].startsAt)} – {
          timeLabel(selection.slots.at(-1)!.endsAt)}</strong>
        <small>{selection.slots.length} time slot{selection.slots.length !== 1 ? "s" : ""}</small>
      </div>
      <strong>{money(selectionAmount(selection.slots), selection.currency)}</strong>
    </div>}
  </section>;
}
