import type { Metadata } from "next";
import { AdminPortal } from "@/components/admin/AdminPortal";
import { getServerVenue } from "@/lib/server-api";
import "./admin.css";
import "./reserve-admin.css";
import "./venue-admin-themes.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Staff dashboard",
  robots: { index: false, follow: false, nocache: true },
};
export default async function AdminPage() {
  const { venue, template } = await getServerVenue();
  return <AdminPortal venue={venue} template={template} />;
}
