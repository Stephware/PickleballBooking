"use client";

import { useEffect, useState } from "react";
import { adminRequest, apiTime, extractError, hasManagerRights, weekdayNames } from "@/lib/admin-client";
import type { OperatingHourAdmin, StaffProfile } from "@/types/admin";
import { AccessMessage, Loading, Notice, SectionHeader, useAdminResource } from "@/components/admin/AdminShared";

const defaults: OperatingHourAdmin[] = weekdayNames.map((_, dayOfWeek) => ({
  dayOfWeek, isClosed: false, opensAt: "08:00", closesAt: "22:00",
}));

export function AdminHours({ user }: { user: StaffProfile }) {
  const response = useAdminResource<OperatingHourAdmin[]>("/venue/hours", []);
  const [hours, setHours] = useState<OperatingHourAdmin[]>(defaults);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const canManage = hasManagerRights(user);

  useEffect(() => {
    if (response.loading || response.error) return;
    setHours(defaults.map(d => {
      const existing = response.data.find(h => h.dayOfWeek === d.dayOfWeek);
      return existing ? {
        ...existing,
        opensAt: existing.opensAt?.slice(0, 5) ?? "08:00",
        closesAt: existing.closesAt?.slice(0, 5) ?? "22:00",
      } : { ...d, isClosed: true };
    }));
  }, [response.data, response.loading, response.error]);

  function change(day: number, key: keyof OperatingHourAdmin, value: boolean | string) {
    setHours(old => old.map(h => h.dayOfWeek === day ? { ...h, [key]: value } : h));
    setMessage("");
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!canManage || busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const invalid = hours.some(h => !h.isClosed && (!h.opensAt || !h.closesAt ||
        h.opensAt >= h.closesAt));
      if (invalid) throw new Error("Opening hours must end after opening time.");
      await adminRequest("/venue/hours", "PUT", {
        days: hours.map(h => ({
          dayOfWeek: h.dayOfWeek, isClosed: h.isClosed,
          opensAt: h.isClosed ? null : apiTime(h.opensAt ?? "08:00"),
          closesAt: h.isClosed ? null : apiTime(h.closesAt ?? "22:00"),
        })),
      });
      setMessage("Operating hours saved."); await response.reload();
    } catch (cause) { setError(extractError(cause)); }
    finally { setBusy(false); }
  }
  return <>
    <SectionHeader eyebrow="Weekly schedule" title="Opening hours"
      description="Set the weekly bookable hours for all courts. Overnight ranges are not supported." />
    {!canManage && <AccessMessage need="MANAGER" />}
    {(error || response.error) && <Notice>{error || response.error}</Notice>}
    {message && <Notice kind="success">{message}</Notice>}
    {response.loading ? <Loading /> : <form className="admin-form-panel card-surface admin-form" onSubmit={save}>
      <div className="admin-hours-list">
        {hours.map(h => <div className="admin-hour-row" key={h.dayOfWeek}>
          <strong>{weekdayNames[h.dayOfWeek]}</strong>
          <label className="admin-toggle"><input type="checkbox" checked={!h.isClosed}
            disabled={!canManage}
            onChange={e => change(h.dayOfWeek, "isClosed", !e.target.checked)} />
            Open</label>
          <label>From<input type="time" value={h.opensAt ?? "08:00"}
            disabled={h.isClosed || !canManage}
            onChange={e => change(h.dayOfWeek, "opensAt", e.target.value)} /></label>
          <label>Until<input type="time" value={h.closesAt ?? "22:00"}
            disabled={h.isClosed || !canManage}
            onChange={e => change(h.dayOfWeek, "closesAt", e.target.value)} /></label>
        </div>)}
      </div>
      <p className="admin-hint">Bookings are offered only in complete venue slot durations.
        Changes affect future availability and must be reviewed against existing reservations.</p>
      {canManage && <button className="button-primary" type="submit"
        disabled={busy}>{busy ? "Saving…" : "Save weekly hours"}</button>}
    </form>}
  </>;
}
