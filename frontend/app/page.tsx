/* eslint-disable @next/next/no-img-element -- venue-provided court photography */
import { AvailabilityGrid } from "@/components/booking/AvailabilityGrid";
import { VenueHeader } from "@/components/ui/VenueHeader";
import { VenueGallery } from "@/components/ui/VenueGallery";
import { VenueContactSection } from "@/components/ui/VenueContact";
import { getServerVenue } from "@/lib/server-api";
import { getVenuePublicDetails } from "@/lib/venue-public-server";
import { reserveBrandStyle } from "@/lib/reserve-brand";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ venue, connected }, publicDetails] = await Promise.all([
    getServerVenue(), Promise.resolve(getVenuePublicDetails()),
  ]);
  const hasContact = Boolean(publicDetails.contact.phoneHref || publicDetails.contact.facebookUrl);
  const heroPhoto = publicDetails.photos[0];

  return <div className="app-shell reserve-theme" style={reserveBrandStyle(venue)}>
    <div className="page-shell">
      <VenueHeader venue={venue} hasContact={hasContact}/>
      <main>
        <section className="player-hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="hero-kicker">READY WHEN YOU ARE <span className="hero-kicker-line"/></p>
            <h1 id="hero-title">Book Your<br/><em>Pickleball Court.</em></h1>
            <p>Check live availability, reserve your time, and get back to
              playing. Everything you need for your next game, all in one place.</p>
            <div className="hero-cta-row">
              <a className="hero-action hero-primary" href="#availability-title">
                Book a Court <span aria-hidden="true">↗</span>
              </a>
              <a className="hero-action hero-secondary" href="#how-it-works">
                How It Works
              </a>
            </div>
            <p className="hero-smallprint">No player account needed · Payments verified by the venue</p>
          </div>
          <div className="hero-photo-wrap">
            {heroPhoto ? <img className="hero-photo" src={heroPhoto.src}
              alt={heroPhoto.alt} width={1200} height={1000}
              fetchPriority="high"/> :
              <div className="court-art" aria-hidden="true">
                <div className="court-line court-line-a"/>
                <div className="court-line court-line-b"/>
                <span className="court-art-label">YOUR NEXT GAME STARTS HERE</span>
                <span className="court-ball"/>
              </div>}
            <div className="hero-photo-caption">
              <span className="hero-caption-dot"/>
              <span>Real venue courts</span>
              <span className="hero-caption-arrow" aria-hidden="true">↗</span>
            </div>
          </div>
        </section>

        <div className="reserve-trust-strip" aria-label="Booking benefits">
          <span><strong aria-hidden="true">▣</strong> Live Court Availability</span>
          <span><strong aria-hidden="true">◉</strong> Secure Receipt Review</span>
          <span><strong aria-hidden="true">✳</strong> Easy Online Booking</span>
          <span><strong aria-hidden="true">☏</strong> Direct Venue Support</span>
        </div>

        {publicDetails.photos.length > 0 && <section className="court-showcase"
          id="courts" aria-labelledby="courts-heading">
          <div className="court-showcase-intro">
            <div>
              <p className="eyebrow">TAKE A LOOK AROUND</p>
              <h2 id="courts-heading">Our Courts</h2>
              <p className="muted">Explore the actual venue before booking your next session.</p>
            </div>
            <a className="showcase-link" href="#availability-title">Check availability
              <span aria-hidden="true">↗</span></a>
          </div>
          <VenueGallery photos={publicDetails.photos}/>
        </section>}

        <div className="section-divider">
          <span>01 / BOOK A COURT</span>
          <span>Live availability · Venue-local times</span>
        </div>
        <AvailabilityGrid venue={venue} connected={connected}/>

        <section className="steps-section" aria-labelledby="how-it-works">
          <div><p className="eyebrow">STRAIGHT TO THE COURT</p>
            <h2 id="how-it-works">Three easy steps to game time.</h2></div>
          <div className="steps-grid">
            <article><span>01</span><h3>Find your court</h3>
              <p>Select a date, court and available time that works for you.</p></article>
            <article><span>02</span><h3>Reserve your slot</h3>
              <p>Enter your details to place a temporary hold on your court.</p></article>
            <article><span>03</span><h3>Submit payment proof</h3>
              <p>Upload your receipt. The venue reviews your payment before confirmation.</p></article>
          </div>
        </section>
        <VenueContactSection contact={publicDetails.contact}/>
      </main>
      <footer className="site-footer">
        <span>{venue.venueName} · Court reservations</span>
        <span>Booking and payment remain subject to venue confirmation.</span>
      </footer>
    </div>
  </div>;
}
