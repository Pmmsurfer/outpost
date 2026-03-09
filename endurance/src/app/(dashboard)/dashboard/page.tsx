"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import type { UpcomingRetreatData } from "@/components/dashboard/UpcomingRetreatBanner";
import type { GuestRow } from "@/components/dashboard/GuestTable";

function buildUpcomingFromRetreats(rows: Record<string, unknown>[]): UpcomingRetreatData | null {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = rows
    .filter((r) => r.start_date != null && String(r.start_date) >= today)
    .sort((a, b) => String(a.start_date).localeCompare(String(b.start_date)))[0];
  if (!upcoming || typeof upcoming.id !== "string" || typeof upcoming.name !== "string") return null;
  const startDate = String(upcoming.start_date);
  const endDate = upcoming.end_date != null ? String(upcoming.end_date) : startDate;
  const city = upcoming.location_city != null ? String(upcoming.location_city) : "";
  const country = upcoming.location_country != null ? String(upcoming.location_country) : "";
  const location = [city, country].filter(Boolean).join(", ") || "—";
  const capacity = typeof upcoming.capacity === "number" ? upcoming.capacity : 0;
  return {
    id: upcoming.id as string,
    title: upcoming.name as string,
    location,
    startDate,
    endDate,
    spotsFilled: 0,
    capacity,
    publicListingHref: `/retreat/${upcoming.id}`,
  };
}

export default function DashboardPage() {
  const [upcomingRetreat, setUpcomingRetreat] = useState<UpcomingRetreatData | null>(null);
  const [activeRetreatsCount, setActiveRetreatsCount] = useState(0);
  const [bookedConfirmed, setBookedConfirmed] = useState(0);
  const [bookedCapacity, setBookedCapacity] = useState(0);
  const [totalRevenueCents, setTotalRevenueCents] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [allBookings, setAllBookings] = useState<GuestRow[]>([]);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!user) return;
      const { data: retreatsData, error: retreatsError } = await supabase
        .from("retreats")
        .select("id, name, start_date, end_date, location_city, location_country, capacity")
        .eq("host_id", user.id)
        .order("start_date", { ascending: true });
      if (!mounted) return;
      if (retreatsError) return;
      const rows = (retreatsData || []) as Record<string, unknown>[];
      setUpcomingRetreat(buildUpcomingFromRetreats(rows));
      setActiveRetreatsCount(rows.length);
      const totalCap = rows.reduce((sum, r) => sum + (typeof r.capacity === "number" ? r.capacity : 0), 0);
      setBookedCapacity(totalCap);

      const retreatIds = rows.map((r) => r.id).filter((id): id is string => typeof id === "string");
      if (retreatIds.length > 0) {
        try {
          const { data: bookingsData } = await supabase
            .from("bookings")
            .select("id, retreat_id, guest_email, guest_name, retreat_name, total_cents, status, waiver_signed, booked_at")
            .in("retreat_id", retreatIds);
          if (!mounted) return;
          if (bookingsData != null) {
            const bookings = bookingsData as Record<string, unknown>[];
            const confirmed = bookings.filter((b) => b.status === "confirmed").length;
            const pending = bookings.filter((b) => b.status === "pending").length;
            const revenue = bookings
              .filter((b) => b.status !== "cancelled")
              .reduce((sum, b) => sum + (typeof b.total_cents === "number" ? b.total_cents : 0), 0);
            setBookedConfirmed(confirmed);
            setPendingCount(pending);
            setTotalRevenueCents(revenue);
            const guestRows: GuestRow[] = bookings
              .sort((a, b) => new Date(String(b.booked_at)).getTime() - new Date(String(a.booked_at)).getTime())
              .map((b) => ({
                id: String(b.id),
                retreatId: String(b.retreat_id ?? ""),
                guestName: String(b.guest_name ?? ""),
                guestEmail: String(b.guest_email ?? ""),
                retreatName: String(b.retreat_name ?? ""),
                totalCents: typeof b.total_cents === "number" ? b.total_cents : 0,
                status: (b.status as GuestRow["status"]) ?? "pending",
                waiverSigned: b.waiver_signed === true,
                bookedAt: String(b.booked_at ?? ""),
              }));
            setAllBookings(guestRows);
          }
        } catch {
          // No bookings table or error
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <DashboardClient
      upcomingRetreat={upcomingRetreat}
      bookedConfirmed={bookedConfirmed}
      bookedCapacity={bookedCapacity}
      totalRevenueCents={totalRevenueCents}
      pendingCount={pendingCount}
      activeRetreatsCount={activeRetreatsCount}
      allBookings={allBookings}
    />
  );
}
