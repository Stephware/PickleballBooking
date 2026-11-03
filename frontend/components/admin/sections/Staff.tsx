"use client";

import { useState } from "react";
import { adminRequest, extractError } from "@/lib/admin-client";
import type { StaffProfile } from "@/types/admin";
import { Empty, Notice, SectionHeader, useAdminResource } from "@/components/admin/AdminShared";

export function AdminStaff() {
  const staff = useAdminResource<StaffProfile[]>("/staff", []);
  const [form, setForm] = useState({
    fullName: "", email: "", password: "", role: "STAFF",
  });
  const [resetId, setResetId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      await adminRequest("/staff", "POST", {
        ...form, email: form.email.trim(), fullName: form.fullName.trim(),
      });
      setForm({ fullName: "", email: "", password: "", role: "STAFF" });
      setMessage("Staff account created."); await staff.reload();
    } catch (cause) { setError(extractError(cause)); }
    finally { setBusy(false); }
  }
  async function active(person: StaffProfile) {
    if (!window.confirm((person.isActive ? "Deactivate " : "Activate ") + person.fullName + "?")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await adminRequest("/staff/" + person.id + "/active", "PATCH", {
        isActive: !person.isActive,
      });
      setMessage("Staff account updated."); await staff.reload();
    } catch (cause) { setError(extractError(cause)); }
    finally { setBusy(false); }
  }
  async function reset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (resetId === null) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await adminRequest("/staff/" + resetId + "/reset-password", "POST", { newPassword });
      setResetId(null); setNewPassword(""); setMessage("Password reset. The previous login is invalidated.");
    } catch (cause) { setError(extractError(cause)); }
    finally { setBusy(false); }
  }

  return <>
    <SectionHeader eyebrow="Owner access" title="Team accounts"
      description="Create staff users, assign roles and manage access securely." />
    {(error || staff.error) && <Notice>{error || staff.error}</Notice>}
    {message && <Notice kind="success">{message}</Notice>}
    <div className="admin-two-column">
      <section className="admin-form-panel card-surface"><h3>Add team member</h3>
        <form className="admin-form" onSubmit={create}>
          <label>Full name<input required maxLength={150} value={form.fullName}
            onChange={e => setForm({ ...form, fullName: e.target.value })} /></label>
          <label>Email<input type="email" required maxLength={254} autoComplete="off"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
          <label>Role<select value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}>
            <option value="STAFF">Staff</option>
            <option value="MANAGER">Manager</option>
          </select></label>
          <label>Temporary password<input type="password" required minLength={12} maxLength={128}
            autoComplete="new-password" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })} /></label>
          <button type="submit" className="button-primary" disabled={busy}>
            {busy ? "Saving…" : "Create account"}</button>
        </form>
      </section>
      <section className="admin-panel card-surface">
        <h3>Staff directory</h3>
        {staff.loading ? <p role="status">Loading staff…</p>
          : staff.data.length === 0 ? <Empty text="No staff accounts." />
          : staff.data.map(person => <div key={person.id} className="admin-list-row">
            <div><strong>{person.fullName}</strong><small>{person.email}</small>
              <small>{person.role} · {person.isActive ? "Active" : "Inactive"}</small></div>
            <div className="admin-inline-actions">
              <button type="button" className="text-button" onClick={() => {
                setResetId(person.id); setNewPassword("");
              }}>Reset</button>
              <button type="button" className="admin-danger-link" disabled={busy}
                onClick={() => void active(person)}>
                {person.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>)}
      </section>
    </div>
    {resetId !== null && <section className="admin-form-panel card-surface">
      <div className="admin-panel-heading"><h3>Reset staff password</h3>
        <button className="text-button" type="button"
          onClick={() => { setResetId(null); setNewPassword(""); }}>Close</button></div>
      <form className="admin-form" onSubmit={reset}>
        <label>New password<input type="password" required minLength={12} maxLength={128}
          autoComplete="new-password" value={newPassword}
          onChange={e => setNewPassword(e.target.value)} /></label>
        <button className="button-primary" type="submit" disabled={busy}>Reset password</button>
      </form>
    </section>}
    <p className="admin-hint">Only Owners may manage staff accounts. Roles and active status are
      rechecked on every backend request; passwords are never stored in the frontend.</p>
  </>;
}
