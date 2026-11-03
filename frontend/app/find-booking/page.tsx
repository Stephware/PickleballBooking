import type { Metadata } from "next";
import { FindBookingForm } from "@/components/booking/FindBookingForm";
import { VenueHeader } from "@/components/ui/VenueHeader";
import { getServerVenue } from "@/lib/server-api";
import { brandStyle } from "@/lib/player";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Find your booking",
  robots: { index: false, follow: false },
};

export default async function FindBookingPage() {
  const { venue } = await getServerVenue();
  const style = brandStyle(venue);
  return (
    <div className="app-shell" style={style}>
      <div className="page-shell">
        <VenueHeader venue={venue} />
        <main className="subpage-main">
          <FindBookingForm />
        </main>
        <footer className="site-footer"><span>{venue.venueName}</span>
          <span>Your reservation details stay private.</span></footer>
      </div>
    </div>
  );
}
