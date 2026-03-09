"use client";

import Link from "next/link";
import { UpcomingRetreatBanner, type UpcomingRetreatData } from "./UpcomingRetreatBanner";
import { StatCards } from "./StatCards";
import { GuestTable, type GuestRow } from "./GuestTable";

export interface DashboardClientProps {
  upcomingRetreat: UpcomingRetreatData | null;
  bookedConfirmed: number;
  bookedCapacity: number;
  totalRevenueCents: number;
  pendingCount: number;
  activeRetreatsCount: number;
  allBookings: GuestRow[];
}

export function DashboardClient({
  upcomingRetreat,
  bookedConfirmed,
  bookedCapacity,
  totalRevenueCents,
  pendingCount,
  activeRetreatsCount,
  allBookings,
}: DashboardClientProps) {
  return (
    <div className="flex flex-col">
      <UpcomingRetreatBanner retreat={upcomingRetreat} />

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] tracking-tight text-ink">Dashboard</h1>
          <p className="mt-2 text-warm-gray">Overview of your retreats and bookings.</p>
        </div>
      </div>

      <StatCards
        bookedConfirmed={bookedConfirmed}
        bookedCapacity={bookedCapacity}
        totalRevenueCents={totalRevenueCents}
        pendingCount={pendingCount}
        activeRetreatsCount={activeRetreatsCount}
      />

      <GuestTable bookings={allBookings} />

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/bookings"
          className="inline-flex items-center gap-2 rounded-lg border-2 border-onda-border bg-transparent px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink"
        >
          View all bookings →
        </Link>
        <Link
          href="/dashboard/retreats"
          className="inline-flex items-center gap-2 rounded-lg border-2 border-onda-border bg-transparent px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink"
        >
          My retreats →
        </Link>
      </div>
    </div>
  );
}
