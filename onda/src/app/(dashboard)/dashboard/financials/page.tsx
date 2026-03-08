"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { HostPlan } from "@/lib/financials";
import FinancialsClient from "@/components/financials/FinancialsClient";
import type { FinancialsBooking } from "@/lib/financials";
import type { RetreatWithEarnings } from "@/lib/financials";

export default function FinancialsPage() {
  const [bookings, setBookings] = useState<FinancialsBooking[]>([]);
  const [retreats, setRetreats] = useState<RetreatWithEarnings[]>([]);
  const [hostPlan, setHostPlan] = useState<HostPlan>("free");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    })();
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !user) return;
    let mounted = true;
    (async () => {
      const { data: retreatsData } = await supabase
        .from("retreats")
        .select("id, name, start_date, end_date, capacity")
        .eq("host_id", user.id)
        .order("start_date", { ascending: false });
      const retreatsRows = retreatsData ?? [];
      const retreatIds = retreatsRows.map((r) => r.id);

      let bookingsData: Record<string, unknown>[] = [];
      if (retreatIds.length > 0) {
        const res = await supabase
          .from("bookings")
          .select("id, retreat_id, retreat_name, guest_name, total_cents, status, booked_at, stripe_fee_cents, stripe_payment_id, payment_type, payment_status")
          .in("retreat_id", retreatIds)
          .order("booked_at", { ascending: false });
        bookingsData = (res.data ?? []) as Record<string, unknown>[];
      }

      let plan: HostPlan = "free";
      try {
        const { data: planRow } = await supabase
          .from("host_subscriptions")
          .select("plan")
          .eq("host_id", user.id)
          .maybeSingle();
        plan = (planRow as { plan?: HostPlan } | null)?.plan ?? "free";
      } catch {
        plan = "free";
      }

      const retreatMap = new Map(retreatsRows.map((r) => [r.id, r]));
      const bookingsList: FinancialsBooking[] = bookingsData.map((b) => ({
        id: String(b.id),
        retreatId: String(b.retreat_id),
        retreatName: String(b.retreat_name ?? ""),
        retreatStartDate: String(retreatMap.get(b.retreat_id as string)?.start_date ?? ""),
        retreatEndDate: String(retreatMap.get(b.retreat_id as string)?.end_date ?? ""),
        guestName: String(b.guest_name ?? ""),
        totalCents: Number(b.total_cents) || 0,
        status: (b.status as FinancialsBooking["status"]) ?? "pending",
        bookedAt: String(b.booked_at ?? ""),
        stripeFeeCents: typeof b.stripe_fee_cents === "number" ? b.stripe_fee_cents : null,
        stripePaymentId: b.stripe_payment_id != null ? String(b.stripe_payment_id) : null,
        paymentType: (b.payment_type as FinancialsBooking["paymentType"]) ?? "deposit",
        paymentStatus: (b.payment_status as FinancialsBooking["paymentStatus"]) ?? "pending",
      }));

      const platformRate = plan === "free" ? 0.1 : plan === "pro" ? 0.05 : 0.03;
      const retreatsList: RetreatWithEarnings[] = retreatsRows.map((r) => {
        const rid = r.id;
        const retreatBookings = bookingsList.filter((b) => b.retreatId === rid && b.status !== "cancelled");
        const grossCents = retreatBookings.reduce((s, b) => s + b.totalCents, 0);
        const platformFeeCents = Math.round(grossCents * platformRate);
        const stripeFeeCents = retreatBookings.reduce(
          (s, b) => s + (b.stripeFeeCents ?? Math.round(b.totalCents * 0.029) + 30),
          0
        );
        const netCents = grossCents - platformFeeCents - stripeFeeCents;
        const startDate = String(r.start_date ?? "");
        const endDate = String(r.end_date ?? "");
        const now = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);
        let status: "upcoming" | "in_progress" | "completed" = "completed";
        if (now < start) status = "upcoming";
        else if (now >= start && now <= end) status = "in_progress";
        return {
          id: rid,
          name: String(r.name ?? ""),
          startDate,
          endDate,
          capacity: Number(r.capacity) ?? 0,
          confirmedCount: retreatBookings.filter((b) => b.status === "confirmed").length,
          grossCents,
          platformFeeCents,
          stripeFeeCents,
          netCents,
          status,
        };
      });

      if (!mounted) return;
      setBookings(bookingsList);
      setRetreats(retreatsList);
      setHostPlan(plan);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [user]);

  if (!supabase) {
    return (
      <div className="mx-auto max-w-[1100px] py-12 text-warm-gray">
        Financials are not configured.
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-[1100px] py-12 text-warm-gray">
        Loading financials…
      </div>
    );
  }

  return (
    <FinancialsClient
      bookings={bookings}
      retreats={retreats}
      hostPlan={hostPlan}
    />
  );
}
