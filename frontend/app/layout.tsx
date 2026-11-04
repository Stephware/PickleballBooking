import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getServerVenue } from "@/lib/server-api";
import "./globals.css";
import "./reserve-brand.css";
import "./venue-themes.css";

// Use the resolved venue identity for tabs/search previews and all booking pages.
// For the bundled Reserve deployment, this is "Pickleball Reserve"; alternate
// per-venue deployments retain their own backend names with BRAND_MODE=api.
export async function generateMetadata(): Promise<Metadata> {
  const { venue } = await getServerVenue();
  const venueName = venue.venueName.trim() || "Court Booking";
  return {
    title: { default: venueName, template: `%s · ${venueName}` },
    description: `Find available courts and book your next pickleball game at ${venueName}.`,
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
