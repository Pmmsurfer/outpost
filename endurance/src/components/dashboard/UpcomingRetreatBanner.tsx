"use client";

import Link from "next/link";
import { differenceInDays, startOfToday } from "date-fns";

export interface UpcomingRetreatData {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  spotsFilled: number;
  capacity: number;
  /** Public listing URL (e.g. /retreat/d2) */
  publicListingHref?: string;
}

interface UpcomingRetreatBannerProps {
  retreat: UpcomingRetreatData | null;
}

export function UpcomingRetreatBanner({ retreat }: UpcomingRetreatBannerProps) {
  if (!retreat) {
    return (
      <div
        className="mb-8 w-full rounded-2xl px-6 py-10 text-center"
        style={{ background: "#1A1A14" }}
      >
        <p className="font-serif text-xl text-white/90">
          No upcoming retreats — ready to create one?
        </p>
        <Link
          href="/dashboard/retreats/new"
          className="mt-5 inline-block rounded-lg bg-sage px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-sage-light"
        >
          Create retreat →
        </Link>
      </div>
    );
  }

  const today = startOfToday();
  const start = new Date(retreat.startDate);
  const daysUntil = differenceInDays(start, today);
  const startsInText = daysUntil <= 0 ? "Started" : daysUntil === 1 ? "Starts tomorrow" : `Starts in ${daysUntil} days`;
  const fillPct = retreat.capacity > 0 ? (retreat.spotsFilled / retreat.capacity) * 100 : 0;

  return (
    <div
      className="mb-8 w-full rounded-2xl px-6 py-8"
      style={{ background: "#1A1A14" }}
    >
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-6">
        <div>
          <h2 className="font-serif text-2xl text-white">{retreat.title}</h2>
          <p className="mt-1 text-sm text-white/70">{retreat.location}</p>
          <p className="mt-1 text-sm text-white/70">
            {new Date(retreat.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
          <p className="mt-2 text-sm font-medium text-sage">{startsInText}</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-2 w-32 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-sage"
                style={{ width: `${Math.min(100, fillPct)}%` }}
              />
            </div>
            <span className="text-sm text-white/90">
              {retreat.spotsFilled} / {retreat.capacity} booked
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/dashboard/retreats/${retreat.id}`}
            className="rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sage-light"
          >
            Manage retreat →
          </Link>
          <a
            href={`mailto:?subject=Retreat: ${encodeURIComponent(retreat.title)}`}
            className="rounded-lg border border-sage bg-transparent px-5 py-2.5 text-sm font-semibold text-sage transition-colors hover:bg-sage/20"
          >
            Email all guests →
          </a>
          {retreat.publicListingHref && (
            <Link
              href={retreat.publicListingHref}
              className="rounded-lg border border-sage bg-transparent px-5 py-2.5 text-sm font-semibold text-sage transition-colors hover:bg-sage/20"
            >
              View public listing →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
