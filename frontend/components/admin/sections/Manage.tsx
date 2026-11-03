"use client";

import { useState } from "react";
import { AdminCourts } from "@/components/admin/sections/Courts";
import { AdminPricing } from "@/components/admin/sections/Pricing";
import { AdminHours } from "@/components/admin/sections/Hours";
import type { StaffProfile } from "@/types/admin";
import type { Venue } from "@/types/player";

type ManageTab = "courts" | "pricing" | "hours";

export function AdminManage({ user, venue }: { user: StaffProfile; venue: Venue }) {
  const [tab, setTab] = useState<ManageTab>("courts");
  return <div className="admin-workflow">
    <nav className="admin-workflow-tabs" aria-label="Manage venue operations">
      {([{ id: "courts", name: "Courts" }, { id: "pricing", name: "Pricing" },
        { id: "hours", name: "Opening Hours" }] as const).map(item =>
        <button key={item.id} type="button" className={tab === item.id ? "active" : ""}
          aria-current={tab === item.id ? "page" : undefined}
          onClick={() => setTab(item.id)}>{item.name}</button>)}
    </nav>
    {tab === "courts" && <AdminCourts user={user} venue={venue}/>}
    {tab === "pricing" && <AdminPricing user={user}/>}
    {tab === "hours" && <AdminHours user={user}/>}
  </div>;
}
