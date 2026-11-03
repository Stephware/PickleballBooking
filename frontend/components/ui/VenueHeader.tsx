/* eslint-disable @next/next/no-img-element -- venue-approved branding image */
import Link from "next/link";
import type { Venue } from "@/types/player";

const pages = [
  { href: "/", label: "Home" },
  { href: "/#availability-title", label: "Book a Court" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#contact", label: "Contact" },
] as const;

export function VenueHeader({ venue }: { venue: Venue }) {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label={venue.venueName + " home"}>
        <span className="brand-mark" aria-hidden="true">
          {venue.logoUrl
            ? <img src={venue.logoUrl} alt="" width={48} height={48} />
            : <span>{venue.venueName.trim().slice(0, 1).toUpperCase()}</span>}
        </span>
        <span className="brand-text">
          <strong>{venue.venueName}</strong><small>COURT RESERVATIONS</small>
        </span>
      </Link>
      <nav className="site-desktop-nav" aria-label="Primary navigation">
        {pages.map(page => <Link key={page.href} href={page.href}>{page.label}</Link>)}
        <Link href="/find-booking">Find Booking</Link>
      </nav>
      <Link className="site-book-cta" href="/#availability-title">Book Now <span aria-hidden="true">↗</span></Link>
      <details className="site-mobile-nav">
        <summary aria-label="Open site menu"><span aria-hidden="true">☰</span> Menu</summary>
        <nav aria-label="Mobile navigation">
          {pages.map(page => <Link key={page.href} href={page.href}>{page.label}</Link>)}
          <Link href="/find-booking">Find Booking</Link>
        </nav>
      </details>
    </header>
  );
}
