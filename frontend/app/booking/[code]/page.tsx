import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingStatus } from "@/components/booking/BookingStatus";
import { VenueHeader } from "@/components/ui/VenueHeader";
import { getServerVenue } from "@/lib/server-api";
import { getVenuePublicDetails } from "@/lib/venue-public-server";
import { brandStyle } from "@/lib/player";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your booking",
  robots: { index: false, follow: false },
};

export default async function BookingPage({ params }: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!/^PB-[0-9A-F]{16}$/.test(code)) notFound();
  const { venue } = await getServerVenue();
  const publicDetails = getVenuePublicDetails();
  const style = brandStyle(venue);
  return (
    <div className="app-shell" style={style}>
      <div className="page-shell">
        <VenueHeader venue={venue} />
        <main className="subpage-main">
          <BookingStatus code={code} venue={venue} publicDetails={publicDetails} />
        </main>
        <footer className="site-footer"><span>{venue.venueName}</span>
          <span>Keep payment receipts and references private.</span></footer>
      </div>
    </div>
  );
}
