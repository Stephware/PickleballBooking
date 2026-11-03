import Link from "next/link";
import type { Venue } from "@/types/player";
import { ReserveMark } from "@/components/ui/ReserveMark";

export function VenueHeader({ venue, hasContact = false }: {
  venue: Venue; hasContact?: boolean;
}) {
  return <header className="site-header reserve-header">
    <Link className="wordmark" href="/" aria-label={venue.venueName + " home"}>
      <ReserveMark className="brand-mark"/>
      <span className="brand-text">
        <strong>{venue.venueName}</strong>
        <small>COURT RESERVATION SYSTEM</small>
      </span>
    </Link>
    <nav className="reserve-header-nav" aria-label="Primary navigation">
      <Link className="header-nav-home" href="/">Home</Link>
      <Link className="header-nav-how" href="/#how-it-works">How It Works</Link>
      {hasContact && <Link className="header-nav-contact" href="/#contact">Contact</Link>}
      <Link className="nav-link header-find-booking" href="/find-booking">Find my booking</Link>
      <Link className="header-book-now" href="/#availability-title">Book Now</Link>
    </nav>
  </header>;
}
