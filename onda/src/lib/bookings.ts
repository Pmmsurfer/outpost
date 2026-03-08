export type BookingStatus = "confirmed" | "pending" | "cancelled";
export type WaiverStatus = "signed" | "pending";

export interface Retreat {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  /** Deposit in cents (e.g. 50000 = $500). Optional. */
  depositCents?: number;
  /** Invoice remainder this many days before start (e.g. 60). Optional. */
  balanceDueDaysBeforeStart?: number;
}

/** Retreat with fields needed for list/cards (from Supabase). */
export interface RetreatListItem extends Retreat {
  status: "draft" | "published";
  location: string;
  pricePerPerson: number | null;
  capacity: number;
  bookedCount: number;
}

/** Map a Supabase retreats row to RetreatListItem. */
export function mapSupabaseRetreatToListItem(row: Record<string, unknown> | null): RetreatListItem | null {
  if (!row || typeof row.id !== "string" || typeof row.name !== "string") return null;
  const startDate = row.start_date != null ? String(row.start_date) : "";
  const endDate = row.end_date != null ? String(row.end_date) : "";
  const status = row.status === "published" ? "published" : "draft";
  const city = row.location_city != null ? String(row.location_city) : "";
  const country = row.location_country != null ? String(row.location_country) : "";
  const location = [city, country].filter(Boolean).join(", ") || "—";
  const price = typeof row.price === "number" ? row.price : null;
  const capacity = typeof row.capacity === "number" ? row.capacity : 0;
  const depositAmount = typeof row.deposit_amount === "number" ? row.deposit_amount : null;
  const depositCents = depositAmount != null ? Math.round(depositAmount * 100) : undefined;
  const balanceDueDays = typeof row.balance_due_days === "number" ? row.balance_due_days : undefined;
  return {
    id: row.id as string,
    name: row.name as string,
    startDate,
    endDate,
    depositCents: depositCents ?? undefined,
    balanceDueDaysBeforeStart: balanceDueDays,
    status,
    location,
    pricePerPerson: price,
    capacity,
    bookedCount: 0,
  };
}

/** Map Supabase retreat row to Retreat (for Share/detail). */
export function mapSupabaseRetreatToRetreat(row: Record<string, unknown> | null): (Retreat & { location?: string; capacity?: number }) | null {
  const item = mapSupabaseRetreatToListItem(row);
  if (!item) return null;
  return {
    id: item.id,
    name: item.name,
    startDate: item.startDate,
    endDate: item.endDate,
    depositCents: item.depositCents,
    balanceDueDaysBeforeStart: item.balanceDueDaysBeforeStart,
    location: item.location,
    capacity: item.capacity,
  };
}

export interface Booking {
  id: string;
  guestName: string;
  guestEmail: string;
  retreatId: string;
  retreatName: string;
  retreatStartDate: string;
  retreatEndDate: string;
  totalCents: number;
  status: BookingStatus;
  waiverStatus: WaiverStatus;
  bookedAt: string;
  /** Accommodation type id if retreat has room types. */
  accommodationTypeId?: string;
  /** Deposit amount charged. */
  depositCents?: number;
  /** Balance due (total - deposit). */
  balanceDueCents?: number;
  /** Activity option ids guest selected. */
  activityIds?: string[];
  /** Roommate / "room with" request. */
  roommateRequest?: string;
  /** Custom field id -> value. */
  customFieldValues?: Record<string, string>;
  /** Consent id -> true if agreed. */
  consentAnswers?: Record<string, boolean>;
  /** Free-text notes / special requests. */
  notes?: string;
  /** Host-only private notes (e.g. for Supabase bookings.host_notes). */
  host_notes?: string;
}

/** Use Supabase retreats table; no mock data. */
export const mockRetreats: Retreat[] = [];

/** Use Supabase bookings table when available; no mock data. */
export const mockBookings: Booking[] = [];
