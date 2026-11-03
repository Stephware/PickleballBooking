/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Venue } from "@/types/player";

export function VenueHeader({ venue }: { venue: Venue }) {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label={venue.venueName + " home"}>
        <span className="brand-mark" aria-hidden="true">
          {venue.logoUrl
            ? <img src={venue.logoUrl} alt="" width={44} height={44} />
            : <span>{venue.venueName.trim().slice(0, 1).toUpperCase()}</span>}
        </span>
        <span className="brand-text"><strong>{venue.venueName}</strong><small>Court reservations</small></span>
      </Link>
      <nav aria-label="Primary navigation">
        <Link className="nav-link" href="/find-booking">Find my booking <span aria-hidden="true">↗</span></Link>
      </nav>
    </header>
  );
}
