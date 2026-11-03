"use client";

import { useState } from "react";
import { adminRequest, extractError } from "@/lib/admin-client";
import { Notice, SectionHeader } from "@/components/admin/AdminShared";

export function AdminAccount({ onPasswordChanged }: { onPasswordChanged: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (next !== confirm) { setError("New passwords do not match."); return; }
    setBusy(true); setError("");
    try {
      await adminRequest<void>("/auth/change-password", "POST", {
        currentPassword: current, newPassword: next,
      });
      setCurrent(""); setNext(""); setConfirm("");
      onPasswordChanged();
    } catch (cause) { setError(extractError(cause)); }
    finally { setBusy(false); }
  }
  return <>
    <SectionHeader eyebrow="Account security" title="Change password"
      description="Update your staff password. You will need to sign in again." />
    <div className="admin-form-panel card-surface admin-narrow">
      <form className="admin-form" onSubmit={submit}>
        <label>Current password<input type="password" required autoComplete="current-password"
          value={current} onChange={e => setCurrent(e.target.value)} /></label>
        <label>New password<input type="password" required minLength={12} maxLength={128}
          autoComplete="new-password" value={next} onChange={e => setNext(e.target.value)} /></label>
        <label>Confirm new password<input type="password" required minLength={12} maxLength={128}
          autoComplete="new-password" value={confirm}
          onChange={e => setConfirm(e.target.value)} /></label>
        {error && <Notice>{error}</Notice>}
        <button className="button-primary" type="submit" disabled={busy}>
          {busy ? "Updating…" : "Change password"}</button>
      </form>
    </div>
  </>;
}
