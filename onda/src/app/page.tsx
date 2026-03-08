"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  discoverActivityLabels,
  mapSupabaseRetreatToDiscoverRetreat,
  type DiscoverRetreat,
  type DiscoverActivity,
} from "@/lib/discover";
import { supabase } from "@/lib/supabase";

type SortOption = "featured" | "price-low" | "price-high" | "rating";

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

export default function DiscoverPage() {
  const [search, setSearch] = useState("");
  const [when, setWhen] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [guests, setGuests] = useState("");
  const [activity, setActivity] = useState<DiscoverActivity | "">("");
  const [sort, setSort] = useState<SortOption>("featured");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [retreats, setRetreats] = useState<DiscoverRetreat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setError("Database not configured");
      return;
    }
    supabase
      .from("retreats")
      .select("id, name, location_city, location_country, activity_type, start_date, end_date, price, capacity, status, cover_image_url")
      .eq("status", "published")
      .then(({ data, error: err }) => {
        setLoading(false);
        if (err) {
          setError(err.message);
          return;
        }
        setRetreats((data ?? []).map(mapSupabaseRetreatToDiscoverRetreat));
      });
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
          !discoverActivityLabels[r.activity].toLowerCase().includes(q)
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
      {/* Nav */}
      <nav className="sticky top-0 z-[200] flex flex-wrap items-center gap-6 border-b border-onda-border bg-white px-8 py-3.5">
        <Link href="/" className="font-serif text-[22px] tracking-tight text-ink">
          Outpos<span className="text-sage">t</span>
        </Link>
        <div className="flex min-w-[180px] max-w-[420px] flex-1 items-center rounded-full border border-transparent bg-[#F7F7F5] py-3 px-5 transition-all focus-within:border-onda-border focus-within:bg-white focus-within:shadow-md hover:bg-white hover:shadow-md">
          <span className="mr-3 text-warm-gray">📍</span>
          <input
            type="text"
            placeholder="Search destinations"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border-none bg-transparent text-sm text-ink outline-none placeholder:text-warm-gray"
          />
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm font-medium text-ink hover:text-sage">
            For hosts
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage"
          >
            List your retreat
          </Link>
        </div>
      </nav>

      {/* Filter bar */}
      <div className="relative sticky top-[57px] z-[150] border-b border-onda-border bg-white px-8">
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto py-3 scrollbar-none">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === "when" ? null : "when"); }}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${
              when ? "border-ink bg-ink text-white hover:bg-ink/90" : "border-onda-border bg-transparent text-ink hover:border-warm-gray hover:bg-[#FAFAF8]"
            }`}
          >
            {whenLabels[when] || "When"} <span className="opacity-80">▼</span>
          </button>
          <div className="h-6 w-px shrink-0 bg-onda-border" />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === "duration" ? null : "duration"); }}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${
              duration ? "border-ink bg-ink text-white" : "border-onda-border bg-transparent text-ink hover:border-warm-gray hover:bg-[#FAFAF8]"
            }`}
          >
            {durationLabels[duration] || "Duration"} <span className="opacity-80">▼</span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === "price" ? null : "price"); }}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${
              price ? "border-ink bg-ink text-white" : "border-onda-border bg-transparent text-ink hover:border-warm-gray hover:bg-[#FAFAF8]"
            }`}
          >
            {priceLabels[price] || "Price"} <span className="opacity-80">▼</span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === "guests" ? null : "guests"); }}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${
              guests ? "border-ink bg-ink text-white" : "border-onda-border bg-transparent text-ink hover:border-warm-gray hover:bg-[#FAFAF8]"
            }`}
          >
            {guestsLabels[guests] || "Who"} <span className="opacity-80">▼</span>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === "activity" ? null : "activity"); }}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${
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
          <div className="absolute left-8 right-8 top-full z-[300] mt-1 max-w-xs rounded-xl border border-onda-border bg-white py-3 shadow-lg" onClick={(e) => e.stopPropagation()}>
            {(["", "weekend", "week", "month", "quarter"] as const).map((v) => (
              <label key={v || "any"} className="flex cursor-pointer items-center gap-3 px-5 py-3 hover:bg-[#F7F7F5]">
                <input type="radio" name="when" checked={when === v} onChange={() => { setWhen(v); setOpenDropdown(null); }} className="accent-sage" />
                <span className="text-sm">{whenLabels[v]}</span>
              </label>
            ))}
          </div>
        )}
        {openDropdown === "duration" && (
          <div className="absolute left-8 top-full z-[300] mt-1 min-w-[200px] rounded-xl border border-onda-border bg-white py-3 shadow-lg" onClick={(e) => e.stopPropagation()}>
            {(["", "weekend", "week", "long"] as const).map((v) => (
              <label key={v || "any"} className="flex cursor-pointer items-center gap-3 px-5 py-3 hover:bg-[#F7F7F5]">
                <input type="radio" name="duration" checked={duration === v} onChange={() => { setDuration(v); setOpenDropdown(null); }} className="accent-sage" />
                <span className="text-sm">{durationLabels[v]}</span>
              </label>
            ))}
          </div>
        )}
        {openDropdown === "price" && (
          <div className="absolute left-8 top-full z-[300] mt-1 min-w-[200px] rounded-xl border border-onda-border bg-white py-3 shadow-lg" onClick={(e) => e.stopPropagation()}>
            {(["", "under1k", "1k-2k", "2k-3k", "3k"] as const).map((v) => (
              <label key={v || "any"} className="flex cursor-pointer items-center gap-3 px-5 py-3 hover:bg-[#F7F7F5]">
                <input type="radio" name="price" checked={price === v} onChange={() => { setPrice(v); setOpenDropdown(null); }} className="accent-sage" />
                <span className="text-sm">{priceLabels[v]}</span>
              </label>
            ))}
          </div>
        )}
        {openDropdown === "guests" && (
          <div className="absolute left-8 top-full z-[300] mt-1 min-w-[200px] rounded-xl border border-onda-border bg-white py-3 shadow-lg" onClick={(e) => e.stopPropagation()}>
            {(["", "solo", "small", "medium", "large"] as const).map((v) => (
              <label key={v || "any"} className="flex cursor-pointer items-center gap-3 px-5 py-3 hover:bg-[#F7F7F5]">
                <input type="radio" name="guests" checked={guests === v} onChange={() => { setGuests(v); setOpenDropdown(null); }} className="accent-sage" />
                <span className="text-sm">{guestsLabels[v]}</span>
              </label>
            ))}
          </div>
        )}
        {openDropdown === "activity" && (
          <div className="absolute left-8 top-full z-[300] mt-1 min-w-[220px] rounded-xl border border-onda-border bg-white py-3 shadow-lg" onClick={(e) => e.stopPropagation()}>
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
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-8 py-6 pb-12">
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
          {filtered.map((r) => (
            <Link
              key={r.id}
              href={getRetreatHref(r)}
              className="block overflow-hidden rounded-2xl border border-transparent bg-white text-left no-underline text-inherit transition-all hover:-translate-y-0.5 hover:border-onda-border hover:shadow-lg"
            >
              <div className="flex h-[200px] shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-sage to-sage-light text-5xl">
                {r.coverImageUrl ? (
                  <img src={r.coverImageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  r.emoji
                )}
              </div>
              <div className="p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-sage">
                    {discoverActivityLabels[r.activity]}
                  </span>
                  <span className="text-[13px] font-medium text-ink">
                    {r.rating} <span className="font-normal text-warm-gray">· {r.reviews} reviews</span>
                  </span>
                </div>
                <h3 className="font-serif text-lg font-normal leading-snug text-ink">{r.title}</h3>
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
          ))}
        </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="py-16 text-center text-warm-gray">
            No retreats match your filters. Try changing your selection.
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-onda-border bg-white px-8 py-5">
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
