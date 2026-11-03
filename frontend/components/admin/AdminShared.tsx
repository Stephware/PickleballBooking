"use client";

import { useCallback, useEffect, useState } from "react";
import { adminRequest, extractError } from "@/lib/admin-client";
import type { StaffProfile } from "@/types/admin";

export function useAdminResource<T>(url: string, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await adminRequest<T>(url)); }
    catch (cause) { setError(extractError(cause)); }
    finally { setLoading(false); }
  }, [url]);
  useEffect(() => { void reload(); }, [reload]);
  return { data, setData, loading, error, setError, reload };
}

export function SectionHeader({ eyebrow, title, description, action }: {
  eyebrow: string; title: string; description?: string; action?: React.ReactNode;
}) {
  return <header className="admin-section-header">
    <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>
      {description && <p className="muted">{description}</p>}</div>
    {action && <div className="admin-header-action">{action}</div>}
  </header>;
}
export function Notice({ kind = "error", children }: {
  kind?: "error" | "success" | "info"; children: React.ReactNode;
}) {
  return <p className={"admin-notice notice-" + kind}
    role={kind === "error" ? "alert" : "status"}>{children}</p>;
}
export function Empty({ text = "Nothing to show yet." }: { text?: string }) {
  return <div className="admin-empty">{text}</div>;
}
export function Loading({ text = "Loading…" }: { text?: string }) {
  return <p className="admin-loading" role="status">{text}</p>;
}
export function AccessMessage({ need }: { need: "OWNER" | "MANAGER" }) {
  return <Notice kind="info">This section requires {need === "OWNER"
    ? "Owner" : "Owner or Manager"} permissions.</Notice>;
}
export function BusyButton({ busy, children, className = "button-primary", disabled = false }: {
  busy: boolean; children: React.ReactNode; className?: string; disabled?: boolean;
}) {
  return <button type="submit" className={className}
    disabled={busy || disabled} aria-busy={busy}>
    {busy ? "Saving…" : children}
  </button>;
}

export function StaffBadge({ user }: { user: StaffProfile }) {
  return <span className="admin-role-badge">{user.role.toLowerCase()}</span>;
}
