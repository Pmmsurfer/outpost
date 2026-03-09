import { createClient } from "@supabase/supabase-js";
import {
  mockDiscoverRetreats,
  discoverActivityLabels,
  type DiscoverRetreat,
} from "@/lib/discover";
import { mockRetreats } from "@/lib/bookings";
import { mockAccommodationTypes } from "@/lib/retreats";

export interface RetreatDetailHost {
  id: string;
  fullName: string;
  slug: string;
  avatarUrl?: string | null;
  tagline?: string | null;
}

export interface RetreatDetail {
  id: string;
  bookId?: string; // host retreat id for booking
  title: string;
  location: string;
  locationDescription?: string;
  activity: string;
  activityLabel: string;
  duration: string;
  days: number;
  priceFrom: number;
  priceNote?: string;
  guests: string;
  rating: number;
  reviews: number;
  meta: string;
  emoji: string;
  startDate?: string;
  endDate?: string;
  depositCents?: number;
  balanceDueDaysBeforeStart?: number;
  description: string;
  shortDescription?: string;
  whatIncluded: string[];
  whatNotIncluded?: string[];
  skillLevel?: string;
  highlights: { title: string; body: string }[];
  typicalDay?: string;
  accommodationNote?: string;
  roomTypes?: { name: string; price: number; soldOut?: boolean }[];
  faqs: { question: string; answer: string }[];
  depositPolicy?: string;
  cancellationPolicy?: string;
  contactEmail?: string;
  coverImageUrl?: string | null;
  galleryUrls?: string[];
  host?: RetreatDetailHost;
  spotsTotal: number;
  spotsRemaining: number;
}

/** No mock overrides; detail content comes from Supabase/retreat data. */
const detailOverrides: Record<string, Partial<RetreatDetail>> = {};

function buildDetailFromDiscover(d: DiscoverRetreat, overrides?: Partial<RetreatDetail>): RetreatDetail {
  const def = detailOverrides[d.id] || {};
  const priceNote = d.guests === "solo" ? "Solo traveler; shared room options may have lower rate." : undefined;
  const base: RetreatDetail = {
    id: d.id,
    bookId: d.bookId,
    title: d.title,
    location: d.location,
    activityLabel: discoverActivityLabels[d.activity],
    activity: d.activity,
    duration: d.duration,
    days: d.days,
    priceFrom: d.price,
    priceNote,
    guests: d.guests,
    rating: d.rating,
    reviews: d.reviews,
    meta: d.meta,
    emoji: d.emoji,
    description: "A retreat designed for connection, practice, and renewal.",
    whatIncluded: ["Accommodation", "Meals as listed", "Guided activities"],
    highlights: [],
    faqs: [],
    spotsTotal: 12,
    spotsRemaining: 8,
  };
  return { ...base, ...def, ...overrides } as RetreatDetail;
}

function buildDetailFromHostRetreat(retreatId: string): RetreatDetail | null {
  const r = mockRetreats.find((x) => x.id === retreatId);
  if (!r) return null;
  const rooms = mockAccommodationTypes.filter((a) => a.retreatId === retreatId);
  const def = detailOverrides[retreatId] || {};
  const base: RetreatDetail = {
    id: r.id,
    bookId: r.id,
    title: r.name,
    location: "Location TBA",
    activity: "surf",
    activityLabel: "Surf & ocean",
    duration: "week",
    days: 7,
    priceFrom: 1890,
    guests: "small",
    rating: 4.8,
    reviews: 31,
    meta: "Year-round",
    emoji: "🏄",
    startDate: r.startDate,
    endDate: r.endDate,
    depositCents: r.depositCents,
    balanceDueDaysBeforeStart: r.balanceDueDaysBeforeStart,
    description: "Join us for a week of surf, yoga, and community.",
    whatIncluded: ["Accommodation", "Meals", "Surf lessons", "Yoga"],
    highlights: [],
    roomTypes: rooms.map((a) => ({ name: a.name, price: a.priceCents / 100, soldOut: a.soldOut })),
    faqs: [],
    spotsTotal: 12,
    spotsRemaining: 8,
  };
  return { ...base, ...def } as RetreatDetail;
}

export function getRetreatDetail(retreatId: string): RetreatDetail | null {
  const discover = mockDiscoverRetreats.find((d) => d.id === retreatId);
  if (discover) return buildDetailFromDiscover(discover);
  return buildDetailFromHostRetreat(retreatId);
}

/** Supabase retreat row for detail page (subset of columns). */
interface SupabaseRetreatDetailRow {
  id: string;
  name: string;
  host_id?: string | null;
  location_city: string | null;
  location_country: string | null;
  activity_type: string;
  start_date: string | null;
  end_date: string | null;
  price: number | null;
  capacity: number | null;
  short_description: string | null;
  full_description: string | null;
  included: string[] | null;
  not_included?: string[] | null;
  skill_level?: string | null;
  highlights: string[] | { title?: string; body?: string }[] | null;
  faqs: { question: string; answer: string }[] | null;
  typical_day: string | null;
  accommodation_notes: string | null;
  deposit_amount: number | null;
  deposit_type: string | null;
  balance_due_days: number | null;
  cancellation_policy: string | null;
  contact_email: string | null;
  status?: string;
  cover_image_url?: string | null;
  gallery_urls?: string[] | null;
}

const ACTIVITY_TO_LABEL: Record<string, string> = {
  yoga: discoverActivityLabels.yoga,
  surf: discoverActivityLabels.surf,
  hiking: discoverActivityLabels.hiking,
  "multi-sport": discoverActivityLabels.adventure,
  other: discoverActivityLabels.wellness,
};

const ACTIVITY_EMOJI: Record<string, string> = {
  yoga: "🧘",
  surf: "🏄",
  hiking: "🥾",
  "multi-sport": "🗺️",
  other: "🌿",
};

function daysBetweenDetail(start: string, end: string): number {
  const a = new Date(start);
  const b = new Date(end);
  const diff = (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.round(diff)) + 1;
}

function durationString(days: number): string {
  if (days <= 3) return "weekend";
  if (days <= 7) return "week";
  return "long";
}

function guestsString(cap: number | null): string {
  if (cap == null || cap <= 1) return "solo";
  if (cap <= 4) return "small";
  if (cap <= 8) return "medium";
  return "large";
}

function mapRowToRetreatDetail(row: SupabaseRetreatDetailRow): RetreatDetail {
  const location = [row.location_city, row.location_country].filter(Boolean).join(", ") || "Location TBA";
  const start = row.start_date ?? "";
  const end = row.end_date ?? start;
  const days = start && end ? daysBetweenDetail(start, end) : 7;
  const activityLabel = ACTIVITY_TO_LABEL[row.activity_type] ?? "Yoga & mindfulness";
  const meta = start && end
    ? `${new Date(start).toLocaleDateString("en-US", { month: "short" })}–${new Date(end).toLocaleDateString("en-US", { month: "short" })}`
    : "Year-round";
  const whatIncluded = Array.isArray(row.included) ? row.included : [];
  const whatNotIncluded = Array.isArray(row.not_included) ? row.not_included : [];
  const highlightsRaw = Array.isArray(row.highlights) ? row.highlights : [];
  const highlights = highlightsRaw.map((h) =>
    typeof h === "string" ? { title: "", body: h } : { title: h?.title ?? "", body: h?.body ?? "" }
  );
  const faqs = Array.isArray(row.faqs) ? row.faqs : [];
  const capacity = row.capacity != null ? Number(row.capacity) : 0;
  const depositParts: string[] = [];
  if (row.deposit_amount != null && row.deposit_amount > 0) {
    if (row.deposit_type === "percent") {
      depositParts.push(`${row.deposit_amount}% deposit`);
    } else {
      depositParts.push(`$${Number(row.deposit_amount).toLocaleString()} deposit`);
    }
  }
  if (row.balance_due_days != null && row.balance_due_days > 0) {
    depositParts.push(`balance due ${row.balance_due_days} days before start`);
  }
  const depositPolicy = depositParts.length > 0 ? depositParts.join("; ") : undefined;
  const cancellationLabels: Record<string, string> = {
    flexible: "Full refund up to 24 hours before start.",
    moderate: "Moderate: partial refund up to 7 days before.",
    strict: "Strict: no refunds within 7 days of start.",
  };
  const cancellationPolicy = row.cancellation_policy ? cancellationLabels[row.cancellation_policy] ?? row.cancellation_policy : undefined;

  return {
    id: row.id,
    bookId: row.id,
    title: row.name,
    location,
    activity: row.activity_type,
    activityLabel,
    duration: durationString(days),
    days,
    priceFrom: row.price != null ? Number(row.price) : 0,
    guests: guestsString(row.capacity),
    rating: 4.5,
    reviews: 0,
    meta,
    emoji: ACTIVITY_EMOJI[row.activity_type] ?? "🧘",
    startDate: start || undefined,
    endDate: end || undefined,
    depositCents: row.deposit_amount != null ? Math.round(Number(row.deposit_amount) * 100) : undefined,
    balanceDueDaysBeforeStart: row.balance_due_days ?? undefined,
    description: row.full_description || row.short_description || "Retreat details.",
    shortDescription: row.short_description ?? undefined,
    whatIncluded,
    whatNotIncluded: whatNotIncluded.length > 0 ? whatNotIncluded : undefined,
    skillLevel: row.skill_level ?? undefined,
    highlights,
    typicalDay: row.typical_day ?? undefined,
    accommodationNote: row.accommodation_notes ?? undefined,
    faqs,
    depositPolicy,
    cancellationPolicy,
    contactEmail: row.contact_email ?? undefined,
    coverImageUrl: row.cover_image_url ?? undefined,
    galleryUrls: Array.isArray(row.gallery_urls) ? row.gallery_urls : [],
    spotsTotal: capacity,
    spotsRemaining: capacity, // updated in getRetreatDetailFromSupabase if booking count available
  };
}

/** Fetch published retreat by id from Supabase; returns null if not found or not published. */
export async function getRetreatDetailFromSupabase(retreatId: string): Promise<RetreatDetail | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("retreats")
    .select("*")
    .eq("id", retreatId)
    .single();
  if (error || !data) return null;
  const row = data as unknown as SupabaseRetreatDetailRow;
  if (row.status !== "published") return null;
  const detail = mapRowToRetreatDetail(row);

  const capacity = row.capacity != null ? Number(row.capacity) : 0;
  let bookedCount = 0;
  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("retreat_id", retreatId)
    .in("status", ["confirmed", "pending"]);
  if (typeof count === "number") bookedCount = count;
  detail.spotsRemaining = Math.max(0, capacity - bookedCount);

  if (row.host_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, slug, avatar_url, tagline")
      .eq("id", row.host_id)
      .single();
    if (profile) {
      const p = profile as Record<string, unknown>;
      detail.host = {
        id: p.id as string,
        fullName: (p.full_name as string) ?? "",
        slug: (p.slug as string) ?? "",
        avatarUrl: (p.avatar_url as string) ?? null,
        tagline: (p.tagline as string) ?? null,
      };
    }
  }
  return detail;
}
