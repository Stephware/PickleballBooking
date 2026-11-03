"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookingForm } from "@/components/booking/BookingForm";
import {
  addDays, canExtend, dateInZone, money, prettyDate, slotMeta, timeLabel,
} from "@/lib/player";
import type { AvailabilityDay, SelectedRange, Slot, SlotStatus, Venue } from "@/types/player";

const legend: SlotStatus[] = [
  "AVAILABLE", "OCCUPIED", "PENDING", "ELAPSED", "BLOCKED", "UNAVAILABLE",
];
export function AvailabilityGrid({ venue, connected }: {
  venue: Venue; connected: boolean;
}) {
  const today = useMemo(() => dateInZone(venue.timezone), [venue.timezone]);
  const [date, setDate] = useState(today);
  const [day, setDay] = useState<AvailabilityDay | null>(null);
  const [loading, setLoading] = useState(connected);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [selection, setSelection] = useState<SelectedRange | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [mobileCourtId, setMobileCourtId] = useState<number | null>(null);

  const reload = useCallback(() => {
    setSelection(null);
    setFormVisible(false);
    setLoading(true);
    setError("");
    setDay(null);
    setRefresh((v) => v + 1);
  }, []);

  useEffect(() => {
    if (!connected) return;
    const controller = new AbortController();
    fetch("/api/player/availability?date=" + encodeURIComponent(date), {
      signal: controller.signal, cache: "no-store",
    }).then(async (response) => {
      const body = await response.json() as AvailabilityDay & { error?: string };
      if (!response.ok) throw new Error(body.error || "Availability is unavailable.");
      return body;
    }).then((value) => {
      if (!controller.signal.aborted) setDay(value);
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted)
        setError(reason instanceof Error ? reason.message : "Could not load courts.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [connected, date, refresh]);

  // Focus the newly opened form, not a timer-dependent point on the page.
  useEffect(() => {
    if (!formVisible) return;
    const frame = window.requestAnimationFrame(() => {
      const heading = document.getElementById("booking-title");
      heading?.focus({ preventScroll: true });
      document.getElementById("booking-details")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto" : "smooth", block: "start",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [formVisible]);

  function moveDate(value: string) {
    setDate(value);
    setSelection(null);
    setFormVisible(false);
    setLoading(true);
    setError("");
    setDay(null);
  }
  function choose(courtId: number, courtName: string, slot: Slot) {
    if (slot.status !== "AVAILABLE") return;
    setFormVisible(false);
    setSelection((previous) => {
      const slots = previous?.courtId === courtId && previous.date === date
        ? canExtend(previous.slots, slot) : [slot];
      if (!slots) return previous;
      return { courtId, courtName, date, timezone: venue.timezone,
        currency: day?.currency || venue.currency, slots };
    });
  }
  const courtList = day?.courts ?? [];
  const firstCourt = courtList[0];
  const rows = firstCourt?.slots ?? [];
  const mobileCourt = courtList.find(c => c.courtId === mobileCourtId) ?? firstCourt;
  const selectedPrice = selection?.slots.reduce((sum, slot) => sum + slot.totalPrice, 0) ?? 0;

  return (
    <section className="availability-section" aria-labelledby="availability-title">
      <div className="section-top">
        <div>
          <p className="eyebrow">Find your next game</p>
          <h2 id="availability-title" tabIndex={-1}>Choose your court.</h2>
          <p className="muted">Live availability from the venue · times in {venue.timezone.replace("_", " ")}</p>
        </div>
        <button className="button-outline refresh-button" type="button"
          onClick={reload} disabled={!connected || loading}>
          <span aria-hidden="true">↻</span> Refresh
        </button>
      </div>

      <div className="reserve-booking-progress" aria-label="Booking steps">
        <span className={!formVisible ? "current" : "complete"}>
          <b>1</b> Select
        </span>
        <span className={formVisible ? "current" : ""}>
          <b>2</b> Details
        </span>
        <span><b>3</b> Payment</span>
      </div>
      <div className="date-toolbar card-surface">
        <div className="date-control">
          <button type="button" aria-label="Previous day" className="icon-button"
            disabled={!connected || date <= today} onClick={() => moveDate(addDays(date, -1))}>‹</button>
          <label className="date-label">
            <span>Playing on</span>
            <input aria-label="Select booking date" type="date" value={date} min={today}
              max={addDays(today, 365)} disabled={!connected}
              onChange={(e) => { if (e.target.value) moveDate(e.target.value); }} />
          </label>
          <button type="button" aria-label="Next day" className="icon-button"
            disabled={!connected || date >= addDays(today, 365)}
            onClick={() => moveDate(addDays(date, 1))}>›</button>
        </div>
        <span className="date-display">{prettyDate(date)}</span>
      </div>

      <div className="status-legend" aria-label="Court availability status legend">
        {legend.map((status) => (
          <span className="legend-item" key={status}>
            <span aria-hidden="true" className={"status-dot status-" + status.toLowerCase()} />
            {slotMeta[status].short}
          </span>
        ))}
      </div>
      {!connected && (
        <div className="alert info" role="status">
          The booking system is temporarily offline. Please check again later.
          No reservations can be placed right now.
        </div>
      )}
      {loading && <div className="grid-placeholder card-surface" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" /> Loading court availability…
      </div>}
      {!loading && error && <div className="alert error" role="alert">
        {error} <button type="button" className="inline-link" onClick={reload}>Try again</button>
      </div>}
      {!loading && !error && day?.isClosed &&
        <div className="empty-card"><h3>Courts are closed this day</h3>
          <p>Select another date to see available sessions.</p></div>}
      {!loading && !error && day && !day.isClosed && courtList.length === 0 &&
        <div className="empty-card"><h3>No courts listed yet</h3>
          <p>The venue hasn&apos;t published any active courts.</p></div>}
      {!loading && !error && day && !day.isClosed && courtList.length > 0 && rows.length === 0 &&
        <div className="empty-card"><h3>No bookable sessions for this date</h3>
          <p>Choose another date or check the venue&apos;s operating hours.</p></div>}
      {!loading && !error && day && !day.isClosed && rows.length > 0 && mobileCourt && (
        <div className="reserve-mobile-picker" aria-label="Choose a court and time">
          <div className="reserve-mobile-label">Select Court</div>
          <div className="reserve-court-choices" role="group" aria-label="Choose a court">
            {courtList.map(court => <button key={court.courtId} type="button"
              className={"reserve-court-choice" +
                (mobileCourt.courtId === court.courtId ? " chosen" : "")}
              aria-pressed={mobileCourt.courtId === court.courtId}
              onClick={() => {
                setMobileCourtId(court.courtId);
                setFormVisible(false);
                if (selection?.courtId !== court.courtId) setSelection(null);
              }}>
              <strong>{court.courtName}</strong>
              <small>{mobileCourt.courtId === court.courtId ? "Selected" : "View times"}</small>
            </button>)}
          </div>
          <div className="reserve-mobile-label">Select Time</div>
          <div className="reserve-time-choices">
            {mobileCourt.slots.map(slot => {
              const selected = selection?.courtId === mobileCourt.courtId &&
                selection.slots.some(s => s.startsAtUtc === slot.startsAtUtc);
              return <button key={slot.startsAtUtc} type="button"
                className={"slot-cell reserve-time-choice slot-" + slot.status.toLowerCase() +
                  (selected ? " selected" : "")}
                disabled={slot.status !== "AVAILABLE"} aria-pressed={Boolean(selected)}
                aria-label={mobileCourt.courtName + ", " + timeLabel(slot.startsAt) +
                  " to " + timeLabel(slot.endsAt) + ", " + slotMeta[slot.status].label +
                  (slot.status === "AVAILABLE" ? ", " + money(slot.totalPrice, day.currency) : "")}
                onClick={() => choose(mobileCourt.courtId, mobileCourt.courtName, slot)}>
                <span className="slot-state">{timeLabel(slot.startsAt)}</span>
                <small>{selected ? "Selected" : slotMeta[slot.status].short}</small>
              </button>;
            })}
          </div>
          <p className="reserve-time-hint">Select one or more consecutive open times.
            Your total appears below.</p>
        </div>
      )}
      {!loading && !error && day && !day.isClosed && rows.length > 0 && (
        <div className="schedule-wrap card-surface" role="region" aria-label="Court and time schedule"
          tabIndex={0}>
          <div className="schedule-grid" style={{
            gridTemplateColumns: "118px repeat(" + courtList.length + ", minmax(154px, 1fr))",
          }}>
            <div className="schedule-heading time-heading">Time</div>
            {courtList.map((court) => (
              <div className="schedule-heading court-heading" key={court.courtId}>
                <span className="court-number">Court</span>
                <strong>{court.courtName}</strong>
              </div>
            ))}
            {rows.map((row, i) => (
              <div className="schedule-row" key={row.startsAtUtc} style={{ display: "contents" }}>
                <div className="schedule-time">
                  <strong>{timeLabel(row.startsAt)}</strong>
                  <span>{day.slotMinutes} min</span>
                </div>
                {courtList.map((court) => {
                  const slot = court.slots[i];
                  if (!slot) return <div className="slot-fallback" key={court.courtId} />;
                  const selected = selection?.courtId === court.courtId &&
                    selection.slots.some((s) => s.startsAtUtc === slot.startsAtUtc);
                  const status = slot.status;
                  return (
                    <button key={court.courtId} type="button"
                      disabled={status !== "AVAILABLE"} aria-pressed={Boolean(selected)}
                      aria-label={court.courtName + ", " + timeLabel(slot.startsAt) +
                        " to " + timeLabel(slot.endsAt) + ", " + slotMeta[status].label +
                        (status === "AVAILABLE" ? ", " + money(slot.totalPrice, day.currency) : "")}
                      className={"slot-cell slot-" + status.toLowerCase() +
                        (selected ? " selected" : "")}
                      onClick={() => choose(court.courtId, court.courtName, slot)}>
                      <span className="slot-state">{slotMeta[status].short}</span>
                      {status === "AVAILABLE" && <strong>{money(slot.totalPrice, day.currency)}</strong>}
                      {selected && <span className="selected-check" aria-hidden="true">✓</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="schedule-footnote">Select one open slot, then adjacent open slots on the same court
        (up to 8). Availability and prices are checked again when you hold your court.</p>
      {selection && selection.slots.length > 0 && (
        <div className="selection-area" aria-live="polite">
          <div className="selection-bar card-surface">
            <div className="selection-copy">
              <span className="micro-label">Your selection</span>
              <strong>{selection.courtName} · {timeLabel(selection.slots[0].startsAt)} – {timeLabel(selection.slots.at(-1)!.endsAt)}</strong>
              <span className="muted">{selection.slots.length} slot{selection.slots.length !== 1 ? "s" : ""} · {prettyDate(date)}</span>
            </div>
            <div className="selection-actions">
              <strong className="selection-total">{money(selectedPrice, selection.currency)}</strong>
              <button type="button" className="button-primary"
                onClick={() => setFormVisible(true)}>
                Continue <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
          {formVisible && <BookingForm key={selection.courtId + ":" +
            selection.slots.map((s) => s.startsAtUtc).join(",")} selection={selection}
              onBack={() => {
                setFormVisible(false);
                document.getElementById("availability-title")?.focus();
              }} />}
        </div>
      )}
    </section>
  );
}
