import Link from "next/link";
import { getRetreatDetailFromSupabase } from "@/lib/retreatDetails";
import type { Retreat } from "@/lib/bookings";
import type { AccommodationType, ActivityOption } from "@/lib/retreats";
import BookRetreatClient from "./BookRetreatClient";

async function getRoomTypesAndActivities(retreatId: string): Promise<{
  roomTypes: AccommodationType[];
  activityOptions: ActivityOption[];
}> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { roomTypes: [], activityOptions: [] };
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key);
  const [roomRes, activityRes] = await Promise.all([
    supabase.from("retreat_room_types").select("id, retreat_id, name, capacity, booked_count, price_cents").eq("retreat_id", retreatId).order("price_cents"),
    supabase.from("retreat_activity_options").select("id, retreat_id, label").eq("retreat_id", retreatId).order("sort_order"),
  ]);
  const roomTypes: AccommodationType[] = (roomRes.data ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id),
    retreatId: String(r.retreat_id),
    name: String(r.name),
    capacity: Number(r.capacity) || 0,
    bookedCount: Number(r.booked_count) || 0,
    priceCents: Number(r.price_cents) || 0,
    soldOut: (Number(r.booked_count) || 0) >= (Number(r.capacity) || 0),
  }));
  const activityOptions: ActivityOption[] = (activityRes.data ?? []).map((a: Record<string, unknown>) => ({
    id: String(a.id),
    retreatId: String(a.retreat_id),
    label: String(a.label),
  }));
  return { roomTypes, activityOptions };
}

export default async function BookRetreatPage({
  params,
}: {
  params: Promise<{ retreatId: string }>;
}) {
  const { retreatId } = await params;
  const detail = await getRetreatDetailFromSupabase(retreatId);

  if (!detail) {
    return (
      <div className="min-h-screen bg-cream px-6 py-12">
        <p className="text-warm-gray">Retreat not found.</p>
        <Link href="/" className="mt-4 inline-block font-semibold text-sage hover:underline">
          ← Discover retreats
        </Link>
      </div>
    );
  }

  const retreat: Retreat = {
    id: detail.id,
    name: detail.title,
    startDate: detail.startDate ?? "",
    endDate: detail.endDate ?? "",
    depositCents: detail.depositCents,
    balanceDueDaysBeforeStart: detail.balanceDueDaysBeforeStart,
  };

  const { roomTypes, activityOptions } = await getRoomTypesAndActivities(retreatId);

  return (
    <BookRetreatClient
      retreatId={retreatId}
      detail={detail}
      retreat={retreat}
      roomTypes={roomTypes}
      activityOptions={activityOptions}
    />
  );
}
