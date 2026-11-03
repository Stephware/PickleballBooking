"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminRequest, extractError } from "@/lib/admin-client";
import type { StaffProfile } from "@/types/admin";

export function useAdminResource<T>(url: string, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const requestVersion = useRef(0);

  // An old date/tab response must never overwrite the current selection.
  // This function doesn't synchronously set React state: the first fetch is
  // safely started by an effect, while explicit refresh is a user action.
  const fetchData = useCallback(() => {
    const version = ++requestVersion.current;
    return adminRequest<T>(url)
      .then(value => {
        if (version === requestVersion.current) {
          setData(value); setError("");
        }
      })
      .catch(cause => {
        if (version === requestVersion.current) setError(extractError(cause));
      })
      .finally(() => {
        if (version === requestVersion.current) {
          setLoadedUrl(url); setRefreshing(false);
        }
      });
  }, [url]);

  const invalidate = useCallback(() => { ++requestVersion.current; }, []);
  useEffect(() => {
    void fetchData();
    return invalidate;
  }, [fetchData, invalidate]);

  const reload = useCallback(() => {
    setRefreshing(true); setError("");
    return fetchData();
  }, [fetchData]);

  // A URL change is immediately considered loading, even before the effect
  // starts the new fetch. Old errors/data aren't presented as current.
  return { data, setData, loading: loadedUrl !== url || refreshing,
    error: loadedUrl === url ? error : "", setError, reload };
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
