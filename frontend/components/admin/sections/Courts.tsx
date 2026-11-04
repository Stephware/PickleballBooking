"use client";

import { useState } from "react";
import { adminRequest, extractError, hasManagerRights } from "@/lib/admin-client";
import { money } from "@/lib/player";
import type { CourtAdmin, StaffProfile } from "@/types/admin";
import type { Venue } from "@/types/player";
import { AccessMessage, Empty, Notice, SectionHeader, useAdminResource } from "@/components/admin/AdminShared";

type CourtForm = {
  courtName: string; description: string; baseHourlyRate: string;
  isActive: boolean;
};
const blank: CourtForm = {
  courtName: "", description: "", baseHourlyRate: "",
  isActive: true,
};
function fromCourt(court: CourtAdmin): CourtForm {
  return { courtName: court.courtName, description: court.description || "",
    baseHourlyRate: String(court.baseHourlyRate),
    isActive: court.isActive };
}

export function AdminCourts({ user, venue }: { user: StaffProfile; venue: Venue }) {
  const courts = useAdminResource<CourtAdmin[]>("/courts", []);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CourtForm>(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const canManage = hasManagerRights(user);
  function edit(c?: CourtAdmin) {
    setOpen(true); setError(""); setMessage("");
    setEditingId(c?.id ?? null); setForm(c ? fromCourt(c) : blank);
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!canManage || busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const payload = {
        courtName: form.courtName.trim(),
        description: form.description.trim() || null,
        baseHourlyRate: Number(form.baseHourlyRate),
        isActive: form.isActive,
      };
      if (!Number.isFinite(payload.baseHourlyRate) || payload.baseHourlyRate < 0)
        throw new Error("Enter a valid non-negative court rate.");
      await adminRequest(
        editingId === null ? "/courts" : "/courts/" + editingId,
        editingId === null ? "POST" : "PUT", payload);
      setOpen(false); setMessage(editingId === null ? "Court created." : "Court updated.");
      await courts.reload();
    } catch (cause) { setError(extractError(cause)); }
    finally { setBusy(false); }
  }
  return <>
    <SectionHeader eyebrow="Court configuration" title="Courts"
      description="Set court names, hourly base prices and availability. New courts appear last automatically."
      action={canManage ? <button type="button" className="button-primary" onClick={() => edit()}>
        + Add court</button> : undefined} />
    {(error || courts.error) && <Notice>{error || courts.error}</Notice>}
    {message && <Notice kind="success">{message}</Notice>}
    {!canManage && <AccessMessage need="MANAGER" />}
    {open && canManage && <div className="admin-form-panel card-surface">
      <button type="button" className="admin-detail-back" onClick={() => setOpen(false)}>
        ← Back to courts</button>
      <h3>{editingId === null ? "New court" : "Edit court"}</h3>
      <form className="admin-form" onSubmit={save}>
        <div className="admin-form-grid">
          <label>Court name<input required maxLength={100} value={form.courtName}
            onChange={e => setForm({ ...form, courtName: e.target.value })} /></label>
          <label>Base hourly rate (PHP)<input required type="number" min="0" step="0.01"
            value={form.baseHourlyRate} placeholder="Enter rate"
            onChange={e => setForm({ ...form, baseHourlyRate: e.target.value })} /></label>
          <label className="admin-toggle"><input type="checkbox" checked={form.isActive}
            onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Active court</label>
          <label className="admin-full">Description<textarea maxLength={1000} rows={2}
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
        </div>
        <p className="admin-hint">Deactivating a court with future reservations will be rejected by the API.</p>
        <button className="button-primary" disabled={busy || form.baseHourlyRate === ""}
          type="submit">{busy ? "Saving…" : editingId === null ? "Create court" : "Save court"}</button>
      </form>
    </div>}
    <div className="admin-cards-grid">
      {courts.loading ? <p role="status">Loading courts…</p>
        : courts.data.length === 0 ? <Empty text="No courts configured yet." />
        : courts.data.map(c => <article key={c.id} className="admin-court-card card-surface">
          <div className="admin-card-top">
            <span className={"admin-status " + (c.isActive ? "status-confirmed" : "status-cancelled")}>
              {c.isActive ? "Active" : "Inactive"}</span></div>
          <h3>{c.courtName}</h3>
          <p className="muted">{c.description || "No additional description."}</p>
          <div className="admin-card-footer"><strong>{money(c.baseHourlyRate, venue.currency)} <small>/ hour</small></strong>
            {canManage && <button className="button-outline admin-small-button"
              type="button" onClick={() => edit(c)}>Edit</button>}</div>
        </article>)}
    </div>
  </>;
}
