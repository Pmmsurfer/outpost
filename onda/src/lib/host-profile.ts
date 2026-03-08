/**
 * Host profile for public profile page and settings.
 * Mirrors Supabase profiles table + extended columns.
 */
export interface HostProfile {
  id: string;
  full_name: string;
  slug: string;
  short_bio: string | null;
  long_bio: string | null;
  avatar_url: string | null;
  specialties: string[];
  certifications: string[];
  instagram_handle: string | null;
  website_url: string | null;
  /** Set by app from retreats/bookings/reviews */
  retreats_hosted?: number;
  total_guests?: number;
  total_reviews?: number;
}

export interface HostReview {
  id: string;
  host_id: string;
  guest_id: string;
  guest_first_name: string;
  guest_last_initial: string;
  retreat_id: string;
  retreat_name: string;
  rating: number;
  review_text: string;
  is_public: boolean;
  created_at: string;
}

/** Retreat with optional status for public listing (published + start_date > today). */
export interface RetreatForHost {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "published" | "draft";
  location?: string;
  pricePerPerson?: number | null;
}

/** No mock data; use fetchHostBySlugFromSupabase. */
export const mockHostProfile: HostProfile | null = null;
export const mockHostReviews: HostReview[] = [];

/** Use Supabase retreats for host; no mock data. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getUpcomingRetreatsForHost(_hostId: string): RetreatForHost[] {
  return [];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getPastRetreatsForHost(_hostId: string): RetreatForHost[] {
  return [];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getPublicReviewsForHost(_hostId: string): HostReview[] {
  return [];
}

/** No mock fallback; use fetchHostBySlugFromSupabase only. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getHostBySlug(_slug: string): HostProfile | null {
  return null;
}

/** Fetch host profile by slug from Supabase. Returns null if not found or Supabase not configured. */
export async function fetchHostBySlugFromSupabase(slug: string): Promise<HostProfile | null> {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, slug, short_bio, long_bio, avatar_url, specialties, certifications, instagram_handle, website_url")
    .eq("slug", slug)
    .single();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    full_name: (row.full_name as string) ?? "",
    slug: (row.slug as string) ?? slug,
    short_bio: (row.short_bio as string) ?? null,
    long_bio: (row.long_bio as string) ?? null,
    avatar_url: (row.avatar_url as string) ?? null,
    specialties: Array.isArray(row.specialties) ? (row.specialties as string[]) : [],
    certifications: Array.isArray(row.certifications) ? (row.certifications as string[]) : [],
    instagram_handle: (row.instagram_handle as string) ?? null,
    website_url: (row.website_url as string) ?? null,
  };
}
