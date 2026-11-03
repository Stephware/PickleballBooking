"use client";

import { useState } from "react";
import { adminRequest, extractError, hasOwnerRights } from "@/lib/admin-client";
import type { StaffProfile, VenueSettingsAdmin } from "@/types/admin";
import { AccessMessage, Loading, Notice, SectionHeader, useAdminResource } from "@/components/admin/AdminShared";

const fallback: VenueSettingsAdmin = {
  venueName: "", venueSlug: "", timezone: "Asia/Manila", currency: "PHP",
  logoUrl: null, primaryColor: "#176e4b", secondaryColor: "#f2f7f4",
  slotMinutes: 60, holdMinutes: 10,
  bookingAdvanceDays: 30, minimumNoticeMinutes: 30,
};

export function AdminVenue({ user }: { user: StaffProfile }) {
  const response = useAdminResource<VenueSettingsAdmin>("/venue", fallback);
  const [draft, setForm] = useState<VenueSettingsAdmin | null>(null);
  const form = draft ?? response.data;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const canManage = hasOwnerRights(user);
  function change<K extends keyof VenueSettingsAdmin>(key: K, value: VenueSettingsAdmin[K]) {
    setForm({ ...form, [key]: value }); setMessage("");
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!canManage || busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await adminRequest("/venue", "PUT", form);
      setMessage("Venue settings saved. Reload the site to see updated branding.");
      await response.reload(); setForm(null);
    } catch (cause) { setError(extractError(cause)); }
    finally { setBusy(false); }
  }
  return <>
    <SectionHeader eyebrow="White-label configuration" title="Venue settings"
      description="Edit branding, timezone and booking policies for this venue's separate deployment." />
    {!canManage && <AccessMessage need="OWNER" />}
    {(error || response.error) && <Notice>{error || response.error}</Notice>}
    {message && <Notice kind="success">{message}</Notice>}
    {response.loading ? <Loading /> : <form className="admin-form-panel card-surface admin-form" onSubmit={save}>
      <div className="admin-form-grid">
        <label>Venue name<input required maxLength={150} disabled={!canManage}
          value={form.venueName} onChange={e => change("venueName", e.target.value)} /></label>
        <label>Venue slug<input required maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*"
          disabled={!canManage} value={form.venueSlug}
          onChange={e => change("venueSlug", e.target.value)} /></label>
        <label>Timezone<input required maxLength={64} disabled={!canManage}
          value={form.timezone} onChange={e => change("timezone", e.target.value)} /></label>
        <label>Currency<input required maxLength={3} pattern="[A-Z]{3}" disabled={!canManage}
          value={form.currency} onChange={e => change("currency", e.target.value.toUpperCase())} /></label>
        <label className="admin-full">Logo URL (HTTPS only)<input type="url" maxLength={2048}
          placeholder="https://your-venue.com/logo.png" pattern="https://.*" disabled={!canManage}
          value={form.logoUrl ?? ""} onChange={e => change("logoUrl", e.target.value || null)} /></label>
        <label>Primary color<input type="color" disabled={!canManage}
          value={form.primaryColor} onChange={e => change("primaryColor", e.target.value)} /></label>
        <label>Secondary color<input type="color" disabled={!canManage}
          value={form.secondaryColor} onChange={e => change("secondaryColor", e.target.value)} /></label>
        <label>Slot minutes<select disabled={!canManage}
          value={form.slotMinutes} onChange={e => change("slotMinutes", Number(e.target.value))}>
          {[30, 60, 90, 120].map(v => <option key={v} value={v}>{v} minutes</option>)}
        </select></label>
        <label>Payment proof deadline (minutes)<input type="number" min={1} max={120} step={1}
          disabled={!canManage} value={form.holdMinutes}
          onChange={e => change("holdMinutes", Number(e.target.value))} /></label>
        <label>Booking window (days)<input type="number" min={1} max={365} step={1}
          disabled={!canManage} value={form.bookingAdvanceDays}
          onChange={e => change("bookingAdvanceDays", Number(e.target.value))} /></label>
        <label>Minimum advance notice (minutes)<input type="number" min={0} step={1}
          disabled={!canManage} value={form.minimumNoticeMinutes}
          onChange={e => change("minimumNoticeMinutes", Number(e.target.value))} /></label>
      </div>
      <p className="admin-hint">Proof received within the payment deadline reserves
        the court until staff verifies, rejects, or manually resolves it. There is no
        automatic payment-review timeout. Changing timezone, slot duration or advance policies can alter future
        availability. Review existing reservations before saving. Real GCash/bank recipient
        settings are not available in the backend yet; do not put credentials in public fields.</p>
      {canManage && <button type="submit" className="button-primary" disabled={busy}>
        {busy ? "Saving…" : "Save venue settings"}</button>}
    </form>}
  </>;
}
