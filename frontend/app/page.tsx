import { AvailabilityGrid } from "@/components/booking/AvailabilityGrid";
import { VenueHeader } from "@/components/ui/VenueHeader";
import { VenueGallery } from "@/components/ui/VenueGallery";
import { VenueContactSection } from "@/components/ui/VenueContact";
import { getServerVenue } from "@/lib/server-api";
import { getVenuePublicDetails } from "@/lib/venue-public-server";
import { brandStyle } from "@/lib/player";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ venue, connected }, publicDetails] = await Promise.all([
    getServerVenue(), Promise.resolve(getVenuePublicDetails()),
  ]);
  return (
    <div className="app-shell" style={brandStyle(venue)}>
      <div className="page-shell">
        <VenueHeader venue={venue} />
        <main>
          <section className="player-hero" aria-labelledby="hero-title">
            <div className="hero-copy">
              <p className="hero-kicker"><span className="live-dot" aria-hidden="true" /> THE COURT IS CALLING</p>
              <h1 id="hero-title">Less waiting.<br /><em>More playing.</em></h1>
              <p>Pick a court, choose your time, and get back to what matters —
                the next great rally.</p>
              <a className="hero-action" href="#availability-title">Find an open court
                <span aria-hidden="true">↘</span></a>
            </div>
            {publicDetails.photos.length > 0
              ? <VenueGallery photos={publicDetails.photos}/>
              : <div className="court-art" aria-hidden="true">
              <div className="court-line court-line-a" />
              <div className="court-line court-line-b" />
              <span className="court-art-label">YOUR NEXT MATCH STARTS HERE</span>
              <span className="court-ball" />
            </div>}
          </section>
          <div className="section-divider">
            <span>01 / RESERVE</span>
            <span>Real-time court schedule</span>
          </div>
          <AvailabilityGrid venue={venue} connected={connected} />
          <section className="steps-section" aria-labelledby="how-it-works">
            <div><p className="eyebrow">Simple from start to finish</p>
              <h2 id="how-it-works">Three steps to game time.</h2></div>
            <div className="steps-grid">
              <article><span>01</span><h3>Find your slot</h3><p>See open courts and live rates at a glance.</p></article>
              <article><span>02</span><h3>Hold your court</h3><p>Enter your details to hold a time temporarily.</p></article>
              <article><span>03</span><h3>Submit proof</h3><p>Upload a receipt; the venue verifies it before confirmation.</p></article>
            </div>
          </section>
          <VenueContactSection contact={publicDetails.contact}/>
        </main>
        <footer className="site-footer">
          <span>{venue.venueName} · Court reservations</span>
          <span>Availability is subject to final booking confirmation.</span>
        </footer>
      </div>
    </div>
  );
}
