/* eslint-disable @next/next/no-img-element -- original developer-owned static hero asset */
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
    <div className="app-shell reserve-site" style={brandStyle(venue)}>
      <div className="page-shell">
        <VenueHeader venue={venue}/>
        <main>
          <section className="player-hero" aria-labelledby="hero-title">
            <div className="hero-copy">
              <p className="hero-kicker">YOUR COURT. YOUR TIME. YOUR GAME.</p>
              <h1 id="hero-title">Book your next <em>pickleball court.</em></h1>
              <p>Check live court availability, reserve your preferred time, and send payment proof for venue verification. Simple from start to game time.</p>
              <div className="hero-actions">
                <a className="hero-action" href="#availability-title">Book a Court <span aria-hidden="true">↗</span></a>
                <a className="hero-action-secondary" href="#how-it-works">How It Works</a>
              </div>
              <span className="hero-assurance">Online reservations · Clear schedules · No waiting in line</span>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <img src="/venue/hero-paddle.svg" width={820} height={570} alt=""/>
            </div>
          </section>
          <div className="trust-strip" aria-label="Booking benefits">
            <span><strong aria-hidden="true">▦</strong> Live availability</span>
            <span><strong aria-hidden="true">✓</strong> Easy reservations</span>
            <span><strong aria-hidden="true">▤</strong> Payment proof review</span>
            <span><strong aria-hidden="true">✦</strong> Mobile-friendly</span>
          </div>
          <section className="court-showcase" aria-labelledby="our-courts-title">
            <div className="showcase-header">
              <div><p className="eyebrow">Get to know the venue</p>
                <h2 id="our-courts-title">Our Courts</h2>
                <p>Take a look at the real indoor courts before your next game.</p>
              </div>
              <a href="#availability-title" className="showcase-link">Check available times <span aria-hidden="true">↗</span></a>
            </div>
            {publicDetails.photos.length > 0
              ? <VenueGallery photos={publicDetails.photos}/>
              : <div className="court-art" aria-label="Illustration of a pickleball court" role="img">
                  <div className="court-line court-line-a"/>
                  <div className="court-line court-line-b"/>
                  <span className="court-art-label">YOUR NEXT MATCH STARTS HERE</span>
                  <span className="court-ball"/>
                </div>}
          </section>
          <div className="section-divider">
            <span>01 / RESERVE</span>
            <span>Real-time availability · Server-confirmed booking</span>
          </div>
          <AvailabilityGrid venue={venue} connected={connected}/>
          <section className="steps-section" aria-labelledby="how-it-works">
            <div><p className="eyebrow">It&apos;s easy to get started</p>
              <h2 id="how-it-works">Three steps to game time.</h2></div>
            <div className="steps-grid">
              <article><span>01</span><h3>Choose your court</h3><p>Pick a date and available time from the venue&apos;s live schedule.</p></article>
              <article><span>02</span><h3>Reserve your slot</h3><p>Enter your details and place a temporary hold at the server-calculated rate.</p></article>
              <article><span>03</span><h3>Submit payment proof</h3><p>Upload a receipt if applicable. Your booking is confirmed only after the venue reviews it.</p></article>
            </div>
          </section>
          <VenueContactSection contact={publicDetails.contact}/>
        </main>
        <footer className="site-footer">
          <span>{venue.venueName} · Court reservations</span>
          <span>Bookings and payment claims require venue confirmation.</span>
        </footer>
      </div>
    </div>
  );
}
