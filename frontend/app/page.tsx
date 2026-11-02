import Link from "next/link";

const plannedFeatures = [
  { title: "Court availability", description: "View courts and time slots in one clear schedule." },
  { title: "Simple reservations", description: "Book online without waiting for a reply." },
  { title: "Venue management", description: "Keep walk-ins and online bookings in one place." },
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <header className="site-header">
        <Link href="/" className="wordmark" aria-label="PickleballBooking home">
          <span className="mark" aria-hidden="true">P</span>
          <span>PickleballBooking</span>
        </Link>
        <span className="phase-pill">Foundation · Phase 1</span>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">A better booking experience for every court</p>
        <h1 id="hero-title">Less messaging.<br />More playing.</h1>
        <p className="hero-description">
          A booking system designed for independently branded pickleball venues.
          The player and owner experiences are under development.
        </p>
        <p className="development-note" role="status">
          This is a development placeholder. Reservations are not open yet.
        </p>
      </section>

      <section className="features" aria-label="Planned features">
        {plannedFeatures.map((feature) => (
          <article key={feature.title} className="feature-card">
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>
      <footer className="site-footer">Built as one adaptable platform for individual pickleball venues.</footer>
    </main>
  );
}
