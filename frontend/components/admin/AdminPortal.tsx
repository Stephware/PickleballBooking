"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminRequest, extractError, hasOwnerRights } from "@/lib/admin-client";
import { brandStyle } from "@/lib/player";
import type { AdminSectionId, StaffProfile } from "@/types/admin";
import type { Venue } from "@/types/player";
import { AdminOverview } from "@/components/admin/sections/Overview";
import { AdminBookings } from "@/components/admin/sections/Bookings";
import { AdminPayments } from "@/components/admin/sections/Payments";
import { AdminManual } from "@/components/admin/sections/Manual";
import { AdminBlocks } from "@/components/admin/sections/Blocks";
import { AdminCourts } from "@/components/admin/sections/Courts";
import { AdminPricing } from "@/components/admin/sections/Pricing";
import { AdminHours } from "@/components/admin/sections/Hours";
import { AdminVenue } from "@/components/admin/sections/Venue";
import { AdminStaff } from "@/components/admin/sections/Staff";
import { AdminAccount } from "@/components/admin/sections/Account";
import { Notice, StaffBadge } from "@/components/admin/AdminShared";

const navigation: { section: AdminSectionId; title: string; group: string }[] = [
  { section: "overview", title: "Overview", group: "WORKSPACE" },
  { section: "bookings", title: "Reservations", group: "WORKSPACE" },
  { section: "payments", title: "Payment reviews", group: "WORKSPACE" },
  { section: "manual", title: "New staff booking", group: "OPERATIONS" },
  { section: "blocks", title: "Court blocks", group: "OPERATIONS" },
  { section: "courts", title: "Courts", group: "MANAGEMENT" },
  { section: "pricing", title: "Pricing rules", group: "MANAGEMENT" },
  { section: "hours", title: "Opening hours", group: "MANAGEMENT" },
  { section: "venue", title: "Venue settings", group: "MANAGEMENT" },
  { section: "staff", title: "Team accounts", group: "MANAGEMENT" },
  { section: "account", title: "My account", group: "ACCOUNT" },
];

function currentSection(): AdminSectionId {
  if (typeof window === "undefined") return "overview";
  const id = window.location.hash.replace("#", "");
  return navigation.find((n) => n.section === id)?.section ?? "overview";
}

export function AdminPortal({ venue }: { venue: Venue }) {
  const [user, setUser] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<AdminSectionId>(() => currentSection());
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onHash = () => setSection(currentSection());
    const onExpired = () => {
      setUser(null);
      setNotice("Your staff session has expired. Please sign in again.");
    };
    window.addEventListener("hashchange", onHash);
    window.addEventListener("pb-admin-session-expired", onExpired);
    adminRequest<StaffProfile>("/session").then(setUser)
      .catch(() => setUser(null)).finally(() => setLoading(false));
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("pb-admin-session-expired", onExpired);
    };
  }, []);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

  function navigate(id: AdminSectionId) {
    setSection(id); setMenuOpen(false); setNotice("");
    window.history.replaceState(null, "", "/admin#" + id);
  }
  const isOwner = user ? hasOwnerRights(user) : false;
  const visible = navigation.filter((n) => n.section !== "staff" || isOwner);
  const title = navigation.find((n) => n.section === section)?.title ?? "Overview";

  return <div className="admin-app" style={brandStyle(venue)}>
    {loading ? <main className="admin-auth-cover"><p role="status">Checking staff access…</p></main>
      : !user ? <main className="admin-auth-cover">
        <div className="admin-auth-card card-surface">
          <div className="admin-auth-mark">P</div>
          <p className="eyebrow">Staff workspace</p>
          <h1>Welcome back.</h1>
          <p className="muted">Sign in with the staff account issued by your venue owner.</p>
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
        <aside className={"admin-sidebar" + (menuOpen ? " sidebar-open" : "")}>
          <div className="admin-logo">
            <span className="admin-logo-mark">{venue.venueName.charAt(0).toUpperCase()}</span>
            <div><strong>{venue.venueName}</strong><small>Venue operations</small></div>
          </div>
          <nav aria-label="Staff navigation" className="admin-nav">
            {visible.map((item, i) => <div key={item.section}>
              {(i === 0 || visible[i - 1].group !== item.group) &&
                <p className="admin-nav-group">{item.group}</p>}
              <button type="button" className={"admin-nav-item" +
                (section === item.section ? " active" : "")}
                onClick={() => navigate(item.section)} aria-current={
                  section === item.section ? "page" : undefined
                }>{item.title}{section === item.section && <span aria-hidden="true">↗</span>}</button>
            </div>)}
          </nav>
          <div className="admin-sidebar-bottom">
            <Link href="/" className="admin-back-link">← Player site</Link>
            <button type="button" className="admin-signout" onClick={logout}
              disabled={busy}>Sign out</button>
          </div>
        </aside>
        {menuOpen && <button type="button" className="admin-menu-scrim"
          aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
        <div className="admin-main">
          <header className="admin-topbar">
            <div className="admin-page-intro">
              <button type="button" className="admin-menu-button"
                aria-label="Open navigation" aria-expanded={menuOpen}
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
            {section === "bookings" && <AdminBookings user={user} venue={venue} />}
            {section === "payments" && <AdminPayments user={user} />}
            {section === "manual" && <AdminManual user={user} venue={venue} />}
            {section === "blocks" && <AdminBlocks user={user} venue={venue} />}
            {section === "courts" && <AdminCourts user={user} venue={venue} />}
            {section === "pricing" && <AdminPricing user={user} />}
            {section === "hours" && <AdminHours user={user} />}
            {section === "venue" && <AdminVenue user={user} />}
            {section === "staff" && isOwner && <AdminStaff />}
            {section === "account" && <AdminAccount onPasswordChanged={() => {
              setUser(null); setNotice("Password changed. Sign in with your new password.");
            }} />}
          </main>
        </div>
      </div>}
  </div>;
}
