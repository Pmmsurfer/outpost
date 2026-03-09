"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { mapSupabaseRetreatToListItem, type RetreatListItem } from "@/lib/bookings";

function formatRetreatDates(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function formatPrice(dollars: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(dollars);
}

function RetreatsContent() {
  const searchParams = useSearchParams();
  const created = searchParams.get("created") === "1";
  const [retreats, setRetreats] = useState<RetreatListItem[]>([]);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted || !user) return;
      const { data, error } = await supabase
        .from("retreats")
        .select("id, name, start_date, end_date, status, location_city, location_country, price, capacity, deposit_amount, balance_due_days")
        .eq("host_id", user.id)
        .order("start_date", { ascending: true });
      if (!mounted) return;
      if (error) return;
      const list = (data || [])
        .map((row) => mapSupabaseRetreatToListItem(row as Record<string, unknown>))
        .filter((r): r is RetreatListItem => r != null);
      setRetreats(list);
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="flex flex-col">
      {created && (
        <div className="mb-6 rounded-lg border border-sage/30 bg-status-signed px-4 py-3 text-sm font-medium text-sage">
          Retreat created. You can add accommodation types and activities from the retreat’s Manage page.
        </div>
      )}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] tracking-tight text-ink">My Retreats</h1>
          <p className="mt-2 text-warm-gray">Manage your retreat listings.</p>
        </div>
        <Link
          href="/dashboard/retreats/new"
          className="rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sage-light"
        >
          Create retreat
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {retreats.map((retreat) => {
          const { bookedCount, capacity, location, pricePerPerson, status } = retreat;
          const isFull = capacity > 0 && bookedCount >= capacity;

          return (
            <div
              key={retreat.id}
              className="relative flex flex-col overflow-hidden rounded-2xl border border-onda-border bg-card-bg"
            >
              {/* Status badge — top right */}
              <div className="absolute right-3 top-3">
                {isFull ? (
                  <span className="inline-block rounded-full bg-clay/15 px-2.5 py-1 text-xs font-semibold text-clay">
                    Full
                  </span>
                ) : status === "published" ? (
                  <span className="inline-block rounded-full bg-status-signed px-2.5 py-1 text-xs font-semibold text-sage">
                    Published
                  </span>
                ) : (
                  <span className="inline-block rounded-full bg-warm-gray/15 px-2.5 py-1 text-xs font-semibold text-warm-gray">
                    Draft
                  </span>
                )}
              </div>

              <div className="p-4 pr-24">
                <h2 className="font-serif text-lg text-ink">{retreat.name}</h2>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray">Location</p>
                    <p className="text-ink">{location}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray">Price</p>
                    <p className="text-ink">
                      {pricePerPerson != null ? `${formatPrice(pricePerPerson)} / person` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray">Dates</p>
                    <p className="text-ink">{formatRetreatDates(retreat.startDate, retreat.endDate)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-warm-gray">Capacity</p>
                    {isFull ? (
                      <span className="inline-block rounded-full bg-clay/15 px-2 py-0.5 text-xs font-semibold text-clay">
                        FULL
                      </span>
                    ) : (
                      <p className="font-medium text-sage">
                        {bookedCount} / {capacity} booked
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-2 border-t border-onda-border p-4">
                <Link
                  href={`/dashboard/retreats/${retreat.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sage-light"
                >
                  Manage
                </Link>
                <Link
                  href={`/dashboard/bookings?retreat=${retreat.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-onda-border bg-transparent px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink"
                >
                  View bookings
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {retreats.length === 0 && (
        <div className="mt-12 rounded-2xl border border-onda-border bg-card-bg p-12 text-center">
          <p className="text-warm-gray">You don’t have any retreats yet.</p>
          <Link
            href="/dashboard/retreats/new"
            className="mt-4 inline-block rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sage-light"
          >
            Create your first retreat
          </Link>
        </div>
      )}
    </div>
  );
}

export default function RetreatsPage() {
  return (
    <Suspense fallback={null}>
      <RetreatsContent />
    </Suspense>
  );
}
