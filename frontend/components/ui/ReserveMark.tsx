/* eslint-disable @next/next/no-img-element -- developer-approved public venue logos */
import type { Venue } from "@/types/player";

export function ReserveMark({ venue, className = "" }: {
  venue: Pick<Venue, "logoUrl" | "venueName">; className?: string;
}) {
  return <span className={"reserve-logo " + className} aria-hidden="true">
    {venue.logoUrl
      ? <img src={venue.logoUrl} alt="" width={150} height={150}/>
      : <span className="venue-mark-letter">{venue.venueName.trim().charAt(0).toUpperCase()}</span>}
  </span>;
}
