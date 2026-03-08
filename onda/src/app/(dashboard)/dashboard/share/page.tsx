"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { mapSupabaseRetreatToRetreat } from "@/lib/bookings";
import { ShareClient, type RetreatForShare } from "@/components/share/ShareClient";

export default function SharePage() {
  const [retreats, setRetreats] = useState<RetreatForShare[]>([]);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted || !user) return;
      const { data, error } = await supabase
        .from("retreats")
        .select("id, name, start_date, end_date, status, location_city, location_country, price, capacity, deposit_amount, balance_due_days, cover_image_url")
        .eq("host_id", user.id)
        .eq("status", "published")
        .order("start_date", { ascending: true });
      if (!mounted) return;
      if (error) return;
      const list = (data || []).map((row) => {
        const r = mapSupabaseRetreatToRetreat(row as Record<string, unknown>);
        if (!r) return null;
        const raw = row as Record<string, unknown>;
        const coverImageUrl = raw.cover_image_url != null && raw.cover_image_url !== "" ? String(raw.cover_image_url) : null;
        return { ...r, coverImageUrl } as RetreatForShare;
      }).filter((r): r is RetreatForShare => r != null);
      setRetreats(list);
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="max-w-[860px]">
      <h1 className="font-serif text-[28px] tracking-tight text-ink">Share & Promote</h1>
      <p className="mt-2 text-warm-gray">Everything you need to fill your retreats</p>

      {retreats.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-onda-border bg-card-bg p-12 text-center">
          <p className="text-warm-gray">Publish a retreat first to start sharing</p>
          <Link
            href="/dashboard/retreats/new"
            className="mt-4 inline-block rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sage-light"
          >
            Create retreat →
          </Link>
        </div>
      ) : (
        <ShareClient retreats={retreats} />
      )}
    </div>
  );
}
