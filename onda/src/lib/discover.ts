/**
 * Retreat listing for the guest-facing discover/browse page.
 * Separate from host dashboard retreats (those are in lib/bookings).
 */
export type DiscoverActivity =
  | "yoga"
  | "surf"
  | "hiking"
  | "writing"
  | "wellness"
  | "adventure";

export type DiscoverDuration = "weekend" | "week" | "long";
export type DiscoverGuests = "solo" | "small" | "medium" | "large";

export interface DiscoverRetreat {
  id: string;
  title: string;
  location: string;
  activity: DiscoverActivity;
  duration: DiscoverDuration;
  price: number; // dollars per person
  guests: DiscoverGuests;
  rating: number;
  reviews: number;
  meta: string; // e.g. "Mar–Nov" or "Year-round"
  days: number;
  emoji: string;
  /** Optional: link to book (host retreat id) if this is a real listing */
  bookId?: string;
  /** Optional: cover image URL from Supabase */
  coverImageUrl?: string | null;
}

export const discoverActivityLabels: Record<DiscoverActivity, string> = {
  yoga: "Yoga & mindfulness",
  surf: "Surf & ocean",
  hiking: "Hiking & backpacking",
  writing: "Writing & creativity",
  wellness: "Wellness & spa",
  adventure: "Adventure & mixed",
};

/** Use published retreats from Supabase on discover page; no mock data. */
export const mockDiscoverRetreats: DiscoverRetreat[] = [];

/** Supabase retreat row (minimal shape for mapping). */
export interface SupabaseRetreatRow {
  id: string;
  name: string;
  location_city: string | null;
  location_country: string | null;
  activity_type: string;
  start_date: string | null;
  end_date: string | null;
  price: number | null;
  capacity: number | null;
  status?: string;
  cover_image_url?: string | null;
}

const ACTIVITY_TO_DISCOVER: Record<string, DiscoverActivity> = {
  yoga: "yoga",
  surf: "surf",
  hiking: "hiking",
  "multi-sport": "adventure",
  other: "wellness",
};

const ACTIVITY_EMOJI: Record<string, string> = {
  yoga: "🧘",
  surf: "🏄",
  hiking: "🥾",
  "multi-sport": "🗺️",
  other: "🌿",
  writing: "✍️",
  wellness: "🌿",
  adventure: "🗺️",
};

function daysBetween(start: string, end: string): number {
  const a = new Date(start);
  const b = new Date(end);
  const diff = (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.round(diff)) + 1;
}

function toDiscoverDuration(days: number): DiscoverDuration {
  if (days <= 3) return "weekend";
  if (days <= 7) return "week";
  return "long";
}

function toDiscoverGuests(capacity: number | null): DiscoverGuests {
  if (capacity == null || capacity <= 1) return "solo";
  if (capacity <= 4) return "small";
  if (capacity <= 8) return "medium";
  return "large";
}

export function mapSupabaseRetreatToDiscoverRetreat(row: SupabaseRetreatRow): DiscoverRetreat {
  const activity: DiscoverActivity = ACTIVITY_TO_DISCOVER[row.activity_type] ?? "yoga";
  const location = [row.location_city, row.location_country].filter(Boolean).join(", ") || "Location TBA";
  const start = row.start_date ?? "";
  const end = row.end_date ?? start;
  const days = start && end ? daysBetween(start, end) : 7;
  const duration = toDiscoverDuration(days);
  const meta = start && end
    ? `${new Date(start).toLocaleDateString("en-US", { month: "short" })}–${new Date(end).toLocaleDateString("en-US", { month: "short" })}`
    : "Year-round";
  const price = row.price != null ? Number(row.price) : 0;
  const guests = toDiscoverGuests(row.capacity);

  return {
    id: row.id,
    title: row.name,
    location,
    activity,
    duration,
    price,
    guests,
    rating: 4.5,
    reviews: 0,
    meta,
    days,
    emoji: ACTIVITY_EMOJI[row.activity_type] ?? ACTIVITY_EMOJI[activity] ?? "🧘",
    bookId: row.id,
    coverImageUrl: row.cover_image_url ?? null,
  };
}
