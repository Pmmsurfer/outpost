"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  discoverActivityLabels,
  mapSupabaseRetreatToDiscoverRetreat,
  type DiscoverRetreat,
  type DiscoverActivity,
} from "@/lib/discover";
import type { SupabaseRetreatRow } from "@/lib/discover";
import { supabase } from "@/lib/supabase";

type SortOption = "featured" | "price-low" | "price-high" | "rating";

/** Explore card extends discover with host and spots for display only. */
type ExploreRetreat = DiscoverRetreat & {
  hostFirstName?: string;
  hostFullName?: string;
  spotsLeft?: number;
};

const whenLabels: Record<string, string> = {
  "": "When",
  weekend: "This weekend",
  week: "Next 7 days",
  month: "Next 30 days",
  quarter: "Next 3 months",
};

const durationLabels: Record<string, string> = {
  "": "Duration",
  weekend: "Weekend",
  week: "5–7 days",
  long: "8+ days",
};

const priceLabels: Record<string, string> = {
  "": "Price",
  under1k: "Under $1k",
  "1k-2k": "$1k–$2k",
  "2k-3k": "$2k–$3k",
  "3k": "$3k+",
};

const guestsLabels: Record<string, string> = {
  "": "Who",
  solo: "Solo",
  small: "2–4",
  medium: "5–8",
  large: "9+",
};

function priceInRange(price: number, range: string): boolean {
  if (!range) return true;
  if (range === "under1k") return price < 1000;
  if (range === "1k-2k") return price >= 1000 && price < 2000;
  if (range === "2k-3k") return price >= 2000 && price < 3000;
  if (range === "3k") return price >= 3000;
  return true;
}

function durationMatch(retreat: DiscoverRetreat, value: string): boolean {
  if (!value) return true;
  return retreat.duration === value;
}

function firstWord(fullName: string | null | undefined): string {
  if (!fullName || !fullName.trim()) return "";
  return fullName.trim().split(/\s+/)[0] ?? "";
}

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [when, setWhen] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [guests, setGuests] = useState("");
  const [activity, setActivity] = useState<DiscoverActivity | "">("");
  const [sort, setSort] = useState<SortOption>("featured");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [retreats, setRetreats] = useState<ExploreRetreat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setError("Database not configured");
      return;
    }
    let mounted = true;
    (async () => {
      const { data: retreatsData, error: retreatErr } = await supabase
        .from("retreats")
        .select("id, name, location_city, location_country, activity_type, start_date, end_date, price, capacity, status, cover_image_url, host_id")
        .eq("status", "published");

      if (!mounted) return;
      setLoading(false);
      if (retreatErr) {
        setError(retreatErr.message);
        return;
      }
      const rows = (retreatsData ?? []) as (SupabaseRetreatRow & { host_id?: string })[];
      const list = rows.map(mapSupabaseRetreatToDiscoverRetreat) as ExploreRetreat[];

      const hostIds = Array.from(new Set(rows.map((r) => r.host_id).filter(Boolean))) as string[];
      const retreatIds = rows.map((r) => r.id);

      let profileByHostId: Record<string, string> = {};
      let profileFullNameByHostId: Record<string, string> = {};
      if (hostIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", hostIds);
        const profiles = (profilesData ?? []) as { id: string; full_name: string | null }[];
        profileByHostId = Object.fromEntries(
          profiles.map((p) => [p.id, firstWord(p.full_name)])
        );
        profileFullNameByHostId = Object.fromEntries(
          profiles.map((p) => [p.id, (p.full_name ?? "").trim()])
        );
      }

      let bookedByRetreatId: Record<string, number> = {};
      if (retreatIds.length > 0) {
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select("retreat_id")
          .in("retreat_id", retreatIds)
          .in("status", ["confirmed", "pending"]);
        const bookings = (bookingsData ?? []) as { retreat_id: string }[];
        bookedByRetreatId = bookings.reduce<Record<string, number>>((acc, b) => {
          acc[b.retreat_id] = (acc[b.retreat_id] ?? 0) + 1;
          return acc;
        }, {});
      }

      rows.forEach((row, i) => {
        const cap = row.capacity != null ? Number(row.capacity) : 0;
        const booked = bookedByRetreatId[row.id] ?? 0;
        const spotsLeft = Math.max(0, cap - booked);
        list[i].hostFirstName = row.host_id ? profileByHostId[row.host_id] ?? "" : "";
        list[i].hostFullName = row.host_id ? profileFullNameByHostId[row.host_id] ?? "" : "";
        list[i].spotsLeft = cap > 0 ? spotsLeft : undefined;
      });

      setRetreats(list);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    function close() {
      setOpenDropdown(null);
    }
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const filtered = useMemo(() => {
    let list = retreats.filter((r) => {
      if (activity && r.activity !== activity) return false;
      if (!durationMatch(r, duration)) return false;
      if (!priceInRange(r.price, price)) return false;
      if (guests && r.guests !== guests) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !r.title.toLowerCase().includes(q) &&
          !r.location.toLowerCase().includes(q) &&
          !discoverActivityLabels[r.activity].toLowerCase().includes(q) &&
          !(r.hostFullName && r.hostFullName.toLowerCase().includes(q))
        ) {
          return false;
        }
      }
      return true;
    });

    if (sort === "price-low") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "price-high") list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);

    return list;
  }, [retreats, search, when, duration, price, guests, activity, sort]);

  const getRetreatHref = (r: DiscoverRetreat) => `/retreat/${r.id}`;

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      {/* Nav — design system: cream bg, border, ink wordmark, sage CTA */}
      <nav
        className="sticky top-0 z-[200] flex flex-wrap items-center gap-3 border-b px-4 py-3 sm:gap-4 sm:px-6 sm:py-3.5 md:px-8"
        style={{ background: "#F5F0E8", borderBottomWidth: 1, borderBottomColor: "#D8D2C4" }}
      >
        <Link
          href="/"
          className="font-serif text-[22px] tracking-tight"
          style={{ color: "#1A1A14" }}
        >
          Outpos<span className="text-sage">t</span>
        </Link>
        <div className="flex min-w-0 flex-1 items-center rounded-full border border-transparent bg-white/80 py-2.5 px-4 transition-all focus-within:border-[#D8D2C4] focus-within:bg-white focus-within:shadow-md hover:bg-white hover:shadow-md sm:min-w-[140px] sm:py-3 sm:px-5">
          <span className="mr-3 text-warm-gray">📍</span>
          <input
            type="text"
            placeholder="Search destinations, activities, or hosts"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border-none bg-transparent text-sm text-ink outline-none placeholder:text-warm-gray"
          />
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-sm font-medium hover:opacity-80"
            style={{ color: "#1A1A14" }}
          >
            For hosts
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 sm:px-5 sm:py-2.5 min-h-[44px] flex items-center justify-center"
            style={{ backgroundColor: "#4A6741" }}
          >
            List your retreat
          </Link>
        </div>
      </nav>

      {/* Filter bar — unchanged */}
      <div className="relative sticky top-[53px] z-[150] border-b border-onda-border bg-white px-4 sm:top-[57px] sm:px-6 md:px-8">
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto py-3 scrollbar-none [-webkit-overflow-scrolling:touch]">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === "when" ? null : "when"); }}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 ${
              when ? "border-ink bg-ink text-white hover:bg-ink/90" : "border-onda-border bg-transparent text-ink hover:border-warm-gray hover:bg-[#FAFAF8]"
            }`}
          >
            {whenLabels[when] || "When"} <span className="opacity-80">▼</span>
          </button>
          <div className="h-6 w-px shrink-0 bg-onda-border" />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === "duration" ? null : "duration"); }}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 ${
              duration ? "border-ink bg-ink text-white" : "border-onda-border bg-transparent text-ink hover:border-warm-gray hover:bg-[#FAFAF8]"
            }`}
          >
            {durationLabels[duration] || "Duration"} <span className="opacity-80">▼</span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === "price" ? null : "price"); }}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 ${
              price ? "border-ink bg-ink text-white" : "border-onda-border bg-transparent text-ink hover:border-warm-gray hover:bg-[#FAFAF8]"
            }`}
          >
            {priceLabels[price] || "Price"} <span className="opacity-80">▼</span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === "guests" ? null : "guests"); }}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 ${
              guests ? "border-ink bg-ink text-white" : "border-onda-border bg-transparent text-ink hover:border-warm-gray hover:bg-[#FAFAF8]"
            }`}
          >
            {guestsLabels[guests] || "Who"} <span className="opacity-80">▼</span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === "activity" ? null : "activity"); }}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 ${
              activity ? "border-ink bg-ink text-white" : "border-onda-border bg-transparent text-ink hover:border-warm-gray hover:bg-[#FAFAF8]"
            }`}
          >
            {activity ? discoverActivityLabels[activity] : "Activity"} <span className="opacity-80">▼</span>
          </button>
          <div className="h-6 w-px shrink-0 bg-onda-border" />
          <div className="ml-auto flex items-center gap-4">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="rounded-lg border border-onda-border bg-white py-2 pl-4 pr-10 text-sm text-ink focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
            >
              <option value="featured">Sort: Recommended</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="rating">Top rated</option>
            </select>
            <span className="text-sm text-warm-gray">
              {filtered.length} retreat{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Dropdowns */}
        {openDropdown === "when" && (
          <div className="absolute left-4 right-4 top-full z-[300] mt-1 max-w-xs rounded-xl border border-onda-border bg-white py-3 shadow-lg sm:left-8 sm:right-8" onClick={(e) => e.stopPropagation()}>
            {(["", "weekend", "week", "month", "quarter"] as const).map((v) => (
              <label key={v || "any"} className="flex cursor-pointer items-center gap-3 px-5 py-3 hover:bg-[#F7F7F5]">
                <input type="radio" name="when" checked={when === v} onChange={() => { setWhen(v); setOpenDropdown(null); }} className="accent-sage" />
                <span className="text-sm">{whenLabels[v]}</span>
              </label>
            ))}
          </div>
        )}
        {openDropdown === "duration" && (
          <div className="absolute left-4 top-full z-[300] mt-1 min-w-[200px] rounded-xl border border-onda-border bg-white py-3 shadow-lg sm:left-8" onClick={(e) => e.stopPropagation()}>
            {(["", "weekend", "week", "long"] as const).map((v) => (
              <label key={v || "any"} className="flex cursor-pointer items-center gap-3 px-5 py-3 hover:bg-[#F7F7F5]">
                <input type="radio" name="duration" checked={duration === v} onChange={() => { setDuration(v); setOpenDropdown(null); }} className="accent-sage" />
                <span className="text-sm">{durationLabels[v]}</span>
              </label>
            ))}
          </div>
        )}
        {openDropdown === "price" && (
          <div className="absolute left-4 top-full z-[300] mt-1 min-w-[200px] rounded-xl border border-onda-border bg-white py-3 shadow-lg sm:left-8" onClick={(e) => e.stopPropagation()}>
            {(["", "under1k", "1k-2k", "2k-3k", "3k"] as const).map((v) => (
              <label key={v || "any"} className="flex cursor-pointer items-center gap-3 px-5 py-3 hover:bg-[#F7F7F5]">
                <input type="radio" name="price" checked={price === v} onChange={() => { setPrice(v); setOpenDropdown(null); }} className="accent-sage" />
                <span className="text-sm">{priceLabels[v]}</span>
              </label>
            ))}
          </div>
        )}
        {openDropdown === "guests" && (
          <div className="absolute left-4 top-full z-[300] mt-1 min-w-[200px] rounded-xl border border-onda-border bg-white py-3 shadow-lg sm:left-8" onClick={(e) => e.stopPropagation()}>
            {(["", "solo", "small", "medium", "large"] as const).map((v) => (
              <label key={v || "any"} className="flex cursor-pointer items-center gap-3 px-5 py-3 hover:bg-[#F7F7F5]">
                <input type="radio" name="guests" checked={guests === v} onChange={() => { setGuests(v); setOpenDropdown(null); }} className="accent-sage" />
                <span className="text-sm">{guestsLabels[v]}</span>
              </label>
            ))}
          </div>
        )}
        {openDropdown === "activity" && (
          <div className="absolute left-4 top-full z-[300] mt-1 min-w-[220px] rounded-xl border border-onda-border bg-white py-3 shadow-lg sm:left-8" onClick={(e) => e.stopPropagation()}>
            {(["yoga", "surf", "hiking", "writing", "wellness", "adventure"] as const).map((v) => (
              <label key={v} className="flex cursor-pointer items-center gap-3 px-5 py-3 hover:bg-[#F7F7F5]">
                <input type="radio" name="activity" checked={activity === v} onChange={() => { setActivity(v); setOpenDropdown(null); }} className="accent-sage" />
                <span className="text-sm">{discoverActivityLabels[v]}</span>
              </label>
            ))}
            <label className="flex cursor-pointer items-center gap-3 px-5 py-3 hover:bg-[#F7F7F5]">
              <input type="radio" name="activity" checked={activity === ""} onChange={() => { setActivity(""); setOpenDropdown(null); }} className="accent-sage" />
              <span className="text-sm">All activities</span>
            </label>
          </div>
        )}
      </div>

      {/* Main */}
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-4 pb-10 sm:px-6 sm:py-6 sm:pb-12 md:px-8">
        {error && (
          <div className="py-16 text-center text-warm-gray">
            {error}
          </div>
        )}
        {loading && !error && (
          <div className="py-16 text-center text-warm-gray">
            Loading retreats…
          </div>
        )}
        {!loading && !error && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {filtered.map((r) => {
              const soldOut = r.spotsLeft !== undefined && r.spotsLeft <= 0;
              const showSpotsBadge = r.spotsLeft !== undefined && r.spotsLeft > 0 && r.spotsLeft < 5;
              return (
                <Link
                  key={r.id}
                  href={getRetreatHref(r)}
                  className="block overflow-hidden rounded-2xl border border-transparent bg-white text-left no-underline text-inherit cursor-pointer transition-[box-shadow,transform] duration-200 ease-in-out hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5"
                >
                  <div
                    className={`relative flex h-[200px] shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-sage to-sage-light text-5xl ${soldOut ? "[filter:grayscale(0.3)]" : ""}`}
                  >
                    {r.coverImageUrl ? (
                      <img src={r.coverImageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      r.emoji
                    )}
                    {showSpotsBadge && (
                      <span
                        className="absolute right-2 top-2 rounded-md px-2 py-1 text-xs font-medium text-white"
                        style={{ backgroundColor: "#C4793A" }}
                      >
                        {r.spotsLeft} spots left
                      </span>
                    )}
                    {soldOut && (
                      <span
                        className="absolute right-2 top-2 rounded-md bg-[#8A8478] px-2 py-1 text-xs font-medium text-white"
                      >
                        Sold out
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-sage">
                        {discoverActivityLabels[r.activity]}
                      </span>
                      {r.reviews > 0 && (
                        <span className="text-[13px] font-medium text-ink">
                          {r.rating} <span className="font-normal text-warm-gray">· {r.reviews} reviews</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-lg font-normal leading-snug text-ink">{r.title}</h3>
                    {r.hostFirstName && (
                      <p className="mt-0.5 text-[13px]" style={{ color: "#8A8478" }}>
                        with {r.hostFirstName}
                      </p>
                    )}
                    <div className="mt-1.5 text-sm text-warm-gray">{r.location}</div>
                    <div className="mt-2.5 flex flex-wrap gap-2.5 text-[13px] text-warm-gray">
                      <span>{r.days} days</span>
                      <span>{r.meta}</span>
                    </div>
                    <div className="mt-3 text-[15px] font-semibold text-ink">
                      ${r.price.toLocaleString()} <span className="font-normal text-warm-gray">per person</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="py-16 text-center text-warm-gray">
            No retreats match your filters. Try changing your selection.
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-onda-border bg-white px-4 py-5 sm:px-6 md:px-8">
        <Link href="/" className="font-serif text-lg text-ink">
          Outpos<span className="text-sage">t</span>
        </Link>
        <div className="flex gap-6">
          <Link href="/dashboard" className="text-[13px] text-warm-gray hover:text-ink">
            For hosts
          </Link>
          <a href="#" className="text-[13px] text-warm-gray hover:text-ink">Privacy</a>
          <a href="#" className="text-[13px] text-warm-gray hover:text-ink">Terms</a>
        </div>
        <span className="text-xs text-warm-gray">© 2026 Outpost</span>
      </footer>
    </div>
  );
}
