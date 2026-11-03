"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { adminRequest, extractError } from "@/lib/admin-client";
import { reserveBrandStyle } from "@/lib/reserve-brand";
import { ReserveMark } from "@/components/ui/ReserveMark";
import type { AdminSectionId, StaffProfile } from "@/types/admin";
import type { Venue } from "@/types/player";
import { AdminOverview } from "@/components/admin/sections/Overview";
import { AdminSchedule } from "@/components/admin/sections/Schedule";
import { AdminPayments } from "@/components/admin/sections/Payments";
import { AdminManage } from "@/components/admin/sections/Manage";
import { AdminAccount } from "@/components/admin/sections/Account";
import { Notice, StaffBadge } from "@/components/admin/AdminShared";

/** Consistent line icons: sidebar and phone navigation share the same labels. */
function AdminNavIcon({ section }: { section: AdminSectionId }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return <svg {...common} aria-hidden="true" viewBox="0 0 24 24" width="19" height="19">
    {section === "overview" && <><path d="M3 10.5 12 3l9 7.5"/><path d="M5 10v11h14V10M10 21v-7h4v7"/></>}
    {section === "schedule" && <><rect x="3.5" y="5" width="17" height="15.5" rx="2"/>
      <path d="M7.5 3v4M16.5 3v4M3.5 10h17M8 14h3M8 17.5h3"/></>}
    {section === "payments" && <><rect x="2.5" y="5" width="19" height="14" rx="2"/>
      <path d="M2.5 10h19M7 15h4"/></>}
    {section === "manage" && <><path d="M4 7h16M4 17h16M4 12h16"/>
      <circle cx="8" cy="7" r="2" fill="currentColor" stroke="none"/>
      <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/>
      <circle cx="10" cy="17" r="2" fill="currentColor" stroke="none"/></>}
    {section === "account" && <><circle cx="12" cy="8" r="4"/><path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2"/></>}
  </svg>;
}

const navigation: { section: AdminSectionId; title: string; group: string }[] = [
  { section: "overview", title: "Today", group: "YOUR WORKSPACE" },
  { section: "schedule", title: "Schedule", group: "YOUR WORKSPACE" },
  { section: "payments", title: "Payments", group: "YOUR WORKSPACE" },
  { section: "manage", title: "Manage", group: "SETTINGS" },
  { section: "account", title: "My Account", group: "ACCOUNT" },
];

function currentSection(): AdminSectionId {
  if (typeof window === "undefined") return "overview";
  const id = window.location.hash.replace("#", "");
  // Preserve old bookmarks without exposing hidden venue/team administration.
  if (["bookings", "manual", "blocks"].includes(id)) return "schedule";
  if (["courts", "pricing", "hours"].includes(id)) return "manage";
  return navigation.find((n) => n.section === id)?.section ?? "overview";
}

export function AdminPortal({ venue }: { venue: Venue }) {
  const [user, setUser] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<AdminSectionId>(() => currentSection());
  const [scheduleMode, setScheduleMode] = useState<"list" | "booking" | "block">("list");
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const sidebar = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const panel = sidebar.current;
    const opener = menuButton.current;
    const controls = () => Array.from(panel?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])') ?? []);
    controls()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setMenuOpen(false); }
      if (event.key !== "Tab") return;
      const items = controls();
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus();
      }
    };
    const onResize = () => { if (window.innerWidth > 950) setMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      opener?.focus();
    };
  }, [menuOpen]);

  useEffect(() => {
    const onHash = () => {
      setSection(currentSection());
      setScheduleMode("list");
    };
    const onExpired = () => {
      setUser(null);
      setNotice("Your staff session has expired. Please sign in again.");
    };
    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onHash);
    window.addEventListener("pb-admin-session-expired", onExpired);
    adminRequest<StaffProfile>("/session").then(setUser)
      .catch(() => setUser(null)).finally(() => setLoading(false));
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onHash);
      window.removeEventListener("pb-admin-session-expired", onExpired);
    };
  }, []);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setNotice("");
    try {
      const profile = await adminRequest<StaffProfile>("/session", "POST",
        { email: email.trim(), password });
      setUser(profile); setPassword(""); setSection("overview");
      window.history.replaceState(null, "", "/admin#overview");
    } catch (error) {
      setNotice(extractError(error)); // Don't reveal credential details.
    } finally { setBusy(false); }
  }

  async function logout() {
    if (busy) return;
    setBusy(true); setNotice("");
    try {
      await adminRequest<void>("/session", "DELETE");
      setUser(null);
      window.history.replaceState(null, "", "/admin");
    } catch (error) { setNotice(extractError(error)); }
    finally { setBusy(false); }
  }

  function navigate(id: AdminSectionId, mode?: "booking" | "block") {
    setSection(id); setMenuOpen(false); setNotice("");
    if (id === "schedule") setScheduleMode(mode ?? "list");
    // New top-level screens participate in browser Back/Forward.
    if (window.location.hash !== "#" + id)
      window.history.pushState(null, "", "/admin#" + id);
  }
  const title = navigation.find((n) => n.section === section)?.title ?? "Today";

  return <div className="admin-app reserve-admin" style={reserveBrandStyle(venue)}>
    {loading ? <main className="admin-auth-cover"><p role="status">Checking staff access…</p></main>
      : !user ? <main className="admin-auth-cover">
        <div className="admin-auth-card card-surface">
          <div className="admin-auth-mark"><ReserveMark/></div>
          <p className="eyebrow">Staff workspace</p>
          <h1>Welcome back.</h1>
          <p className="muted">Sign in with your venue Owner account.</p>
          <form className="admin-form" onSubmit={login}>
            <label>Email address<input type="email" required autoComplete="username"
              value={email} maxLength={254} placeholder="you@venue.com"
              onChange={(e) => setEmail(e.target.value)} /></label>
            <label>Password<input type="password" required autoComplete="current-password"
              value={password} placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)} /></label>
            {notice && <Notice>{notice}</Notice>}
            <button className="button-primary" disabled={busy} type="submit">
              {busy ? "Signing in…" : "Sign in to dashboard"}
            </button>
          </form>
          <Link className="admin-back-link" href="/">← Back to player site</Link>
        </div>
      </main> :
      <div className="admin-layout">
        <aside ref={sidebar} id="admin-navigation"
          className={"admin-sidebar" + (menuOpen ? " sidebar-open" : "")}>
          <div className="admin-logo">
            <ReserveMark className="admin-logo-mark"/>
            <div><strong>{venue.venueName}</strong><small>Venue operations</small></div>
          </div>
          <nav aria-label="Staff navigation" className="admin-nav">
            {navigation.map((item, i) => <div key={item.section}>
              {(i === 0 || navigation[i - 1].group !== item.group) &&
                <p className="admin-nav-group">{item.group}</p>}
              <button type="button" className={"admin-nav-item" +
                (section === item.section ? " active" : "")}
                onClick={() => navigate(item.section)} aria-current={
                  section === item.section ? "page" : undefined
                }><AdminNavIcon section={item.section}/><span>{item.title}</span></button>
            </div>)}
          </nav>
          <div className="admin-sidebar-bottom">
            <Link href="/" className="admin-back-link">← Player site</Link>
            <button type="button" className="admin-signout" onClick={logout}
              disabled={busy}>Sign out</button>
          </div>
        </aside>
        {menuOpen && <button type="button" className="admin-menu-scrim"
          tabIndex={-1} aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
        <div className="admin-main" inert={menuOpen}>
          <header className="admin-topbar">
            <ReserveMark className="admin-mobile-mark"/>
            <div className="admin-page-intro">
              <button ref={menuButton} type="button" className="admin-menu-button"
                aria-label="Open navigation" aria-expanded={menuOpen} aria-controls="admin-navigation"
                onClick={() => setMenuOpen(!menuOpen)}>☰</button>
              <div><span className="micro-label">OPERATIONS / {title.toUpperCase()}</span>
                <strong>{title}</strong></div>
            </div>
            <div className="admin-user">
              <span className="admin-user-name">{user.fullName}</span>
              <StaffBadge user={user} />
            </div>
          </header>
          <main className="admin-content" id="admin-main">
            {notice && <Notice>{notice}</Notice>}
            {section === "overview" && <AdminOverview user={user} venue={venue} navigate={navigate} />}
            {section === "schedule" && <AdminSchedule user={user} venue={venue}
              mode={scheduleMode} onModeChange={setScheduleMode} />}
            {section === "payments" && <AdminPayments user={user} />}
            {section === "manage" && <AdminManage user={user} venue={venue} />}
            {section === "account" && <AdminAccount onPasswordChanged={() => {
              setUser(null); setNotice("Password changed. Sign in with your new password.");
            }} />}
          </main>
          <nav className="admin-bottom-nav" aria-label="Mobile quick navigation">
            {navigation.filter(item => item.section !== "account").map(item =>
              <button type="button" key={item.section}
                className={section === item.section ? "active" : ""}
                aria-current={section === item.section ? "page" : undefined}
                onClick={() => navigate(item.section)}>
                <AdminNavIcon section={item.section}/>
                <span>{item.title}</span>
              </button>)}
          </nav>
        </div>
      </div>}
  </div>;
}
