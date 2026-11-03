import type { VenueContact } from "@/lib/venue-public";

export function VenueContactLinks({ contact, compact = false }: {
  contact: VenueContact; compact?: boolean;
}) {
  if (!contact.phoneHref && !contact.facebookUrl) return null;
  return <div className={compact ? "contact-actions contact-compact" : "contact-actions"}>
    {contact.phoneHref && <a className="button-outline" href={contact.phoneHref}>
      Call {contact.phoneLabel}
    </a>}
    {contact.facebookUrl && <a className="button-outline" href={contact.facebookUrl}
      target="_blank" rel="noopener noreferrer">
      Message on Facebook <span aria-hidden="true">↗</span>
    </a>}
  </div>;
}
export function VenueContactSection({ contact }: { contact: VenueContact }) {
  const published = Boolean(contact.phoneHref || contact.facebookUrl);
  return <section className="contact-section" id="contact" aria-labelledby="contact-heading">
    <div>
      <p className="eyebrow">Questions before you play?</p>
      <h2 id="contact-heading">Talk to the venue.</h2>
      <p className="muted">For court questions, booking help or payment confirmation, reach the venue directly.</p>
    </div>
    {published ? <VenueContactLinks contact={contact}/> :
      <p className="muted contact-fallback">Contact the venue staff in person for booking or payment assistance. Verified online contact details are not published yet.</p>}
  </section>;
}
