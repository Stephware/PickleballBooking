"use client";

import { useState } from "react";
import { adminRequest, apiTime, extractError, hasManagerRights, weekdayNames } from "@/lib/admin-client";
import { timeLabel } from "@/lib/player";
import type { CourtAdmin, PricingRuleAdmin, StaffProfile } from "@/types/admin";
import { AccessMessage, Empty, Notice, SectionHeader, useAdminResource } from "@/components/admin/AdminShared";

type RuleForm = {
  ruleName: string; courtId: string; dayOfWeek: string; startsAt: string;
  endsAt: string; hourlyRate: string; priority: string; isActive: boolean;
};
const blank: RuleForm = {
  ruleName: "", courtId: "", dayOfWeek: "", startsAt: "08:00", endsAt: "22:00",
  hourlyRate: "", priority: "0", isActive: true,
};
function fromRule(r: PricingRuleAdmin): RuleForm {
  return { ruleName: r.ruleName, courtId: r.courtId?.toString() || "",
    dayOfWeek: r.dayOfWeek === null ? "" : String(r.dayOfWeek),
    startsAt: r.startsAt.slice(0, 5), endsAt: r.endsAt.slice(0, 5),
    hourlyRate: String(r.hourlyRate), priority: String(r.priority), isActive: r.isActive };
}
export function AdminPricing({ user }: { user: StaffProfile }) {
  const rules = useAdminResource<PricingRuleAdmin[]>("/pricing/rules", []);
  const courts = useAdminResource<CourtAdmin[]>("/courts", []);
  const [form, setForm] = useState<RuleForm>(blank);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const canManage = hasManagerRights(user);
  function edit(rule?: PricingRuleAdmin) {
    setEditingId(rule?.id ?? null); setForm(rule ? fromRule(rule) : blank);
    setOpen(true); setError(""); setMessage("");
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!canManage || busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await adminRequest(editingId === null ? "/pricing/rules" : "/pricing/rules/" + editingId,
        editingId === null ? "POST" : "PUT", {
          ruleName: form.ruleName.trim(), courtId: form.courtId ? Number(form.courtId) : null,
          dayOfWeek: form.dayOfWeek === "" ? null : Number(form.dayOfWeek),
          startsAt: apiTime(form.startsAt), endsAt: apiTime(form.endsAt),
          hourlyRate: Number(form.hourlyRate), priority: Number(form.priority),
          isActive: form.isActive,
        });
      setOpen(false); setMessage("Pricing rule saved."); await rules.reload();
    } catch (cause) { setError(extractError(cause)); }
    finally { setBusy(false); }
  }
  async function deactivate(rule: PricingRuleAdmin) {
    if (!window.confirm("Deactivate " + rule.ruleName + "? Future quotes may change.")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await adminRequest<void>("/pricing/rules/" + rule.id + "/deactivate", "PATCH", {});
      setMessage("Rule deactivated."); await rules.reload();
    } catch (cause) { setError(extractError(cause)); }
    finally { setBusy(false); }
  }
  return <>
    <SectionHeader eyebrow="Court rates" title="Pricing rules"
      description="Manage peak/off-peak and day-specific rates. Court rules override venue-wide rules."
      action={canManage ? <button type="button" className="button-primary"
        onClick={() => edit()}>+ Add pricing rule</button> : undefined} />
    {(error || rules.error) && <Notice>{error || rules.error}</Notice>}
    {message && <Notice kind="success">{message}</Notice>}
    {!canManage && <AccessMessage need="MANAGER" />}
    {open && canManage && <div className="admin-form-panel card-surface">
      <button type="button" className="admin-detail-back" onClick={() => setOpen(false)}>
        ← Back to pricing</button>
      <h3>{editingId === null ? "New rate rule" : "Edit rate rule"}</h3>
      <form className="admin-form" onSubmit={save}>
        <div className="admin-form-grid">
          <label>Rule name<input required minLength={1} maxLength={120} value={form.ruleName}
            onChange={e => setForm({ ...form, ruleName: e.target.value })} /></label>
          <label>Applies to court<select value={form.courtId}
            onChange={e => setForm({ ...form, courtId: e.target.value })}>
            <option value="">All courts</option>
            {courts.data.map(c => <option value={c.id} key={c.id}>{c.courtName}</option>)}
          </select></label>
          <label>Day<select value={form.dayOfWeek}
            onChange={e => setForm({ ...form, dayOfWeek: e.target.value })}>
            <option value="">Every day</option>
            {weekdayNames.map((d, index) => <option key={d} value={index}>{d}</option>)}
          </select></label>
          <label>Hourly rate<input required type="number" min="0" step=".01"
            placeholder="Enter rate" value={form.hourlyRate}
            onChange={e => setForm({ ...form, hourlyRate: e.target.value })} /></label>
          <label>Starts at<input required type="time" value={form.startsAt}
            onChange={e => setForm({ ...form, startsAt: e.target.value })} /></label>
          <label>Ends at<input required type="time" value={form.endsAt}
            onChange={e => setForm({ ...form, endsAt: e.target.value })} /></label>
          <label>Priority<input required type="number" step="1" value={form.priority}
            onChange={e => setForm({ ...form, priority: e.target.value })} /></label>
          <label className="admin-toggle"><input type="checkbox" checked={form.isActive}
            onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Active rule</label>
        </div>
        <p className="admin-hint">Higher priority wins within the same scope.
          Pricing updates affect future quotes, not historical booking totals.</p>
        <button className="button-primary" type="submit"
          disabled={busy || form.hourlyRate === "" || form.startsAt >= form.endsAt}>
          {busy ? "Saving…" : "Save pricing rule"}</button>
      </form>
    </div>}
    {rules.loading ? <p role="status">Loading pricing rules…</p>
      : rules.data.length === 0 ? <Empty text="No custom pricing rules. Courts use their base rate." />
      : <div className="admin-table-wrap card-surface"><table className="admin-table">
        <thead><tr><th>Rule</th><th>Applies to</th><th>Day</th>
          <th>Time</th><th>Rate/hr</th><th>Priority</th><th>Status / Action</th></tr></thead>
        <tbody>{rules.data.map(r => <tr key={r.id}>
          <td><strong>{r.ruleName}</strong></td>
          <td>{r.courtId === null ? "All courts"
            : courts.data.find(c => c.id === r.courtId)?.courtName || "Court " + r.courtId}</td>
          <td>{r.dayOfWeek === null ? "Every day" : weekdayNames[r.dayOfWeek]}</td>
          <td>{timeLabel(r.startsAt)} – {timeLabel(r.endsAt)}</td>
          <td>{r.hourlyRate.toFixed(2)}</td><td>{r.priority}</td>
          <td><span className={"admin-status " + (r.isActive ? "status-confirmed" : "status-cancelled")}>
            {r.isActive ? "Active" : "Inactive"}</span>
            {canManage && <div className="admin-inline-actions">
              <button className="text-button" type="button" onClick={() => edit(r)}>Edit</button>
              {r.isActive && <button className="admin-danger-link" type="button"
                disabled={busy} onClick={() => void deactivate(r)}>Deactivate</button>}
            </div>}</td>
        </tr>)}</tbody></table></div>}
  </>;
}
