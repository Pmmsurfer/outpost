"use client";

import { useMemo, useState } from "react";
import type { DateRangeKey } from "@/lib/financials";
import { getDateRangeBounds, getPlatformFeeCents, getStripeFeeCents, getNetCents } from "@/lib/financials";
import type { FinancialsBooking } from "@/lib/financials";
import type { RetreatWithEarnings } from "@/lib/financials";
import type { HostPlan } from "@/lib/financials";
import { FinancialsStatCards } from "./FinancialsStatCards";
import { EarningsChart } from "./EarningsChart";
import { RetreatEarningsTable } from "./RetreatEarningsTable";
import { TransactionLedger } from "./TransactionLedger";
import { PayoutSummary } from "./PayoutSummary";

const DATE_RANGE_OPTIONS: { key: DateRangeKey; label: string }[] = [
  { key: "this_month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "last_3_months", label: "Last 3 months" },
  { key: "last_12_months", label: "Last 12 months" },
  { key: "all_time", label: "All time" },
];

export interface FinancialsClientProps {
  bookings: FinancialsBooking[];
  retreats: RetreatWithEarnings[];
  hostPlan: HostPlan;
}

export default function FinancialsClient({
  bookings,
  retreats,
  hostPlan,
}: FinancialsClientProps) {
  const [dateRange, setDateRange] = useState<DateRangeKey>("this_month");

  const { filteredBookings, stats, retreatsInRange, monthlyData } = useMemo(() => {
    const { start, end } = getDateRangeBounds(dateRange);
    const startTime = start.getTime();
    const endTime = end.getTime();
    const filtered = bookings.filter((b) => {
      const t = new Date(b.bookedAt).getTime();
      return t >= startTime && t <= endTime;
    });
    const confirmed = filtered.filter((b) => b.status === "confirmed");
    const pending = filtered.filter((b) => b.status === "pending");
    const cancelled = filtered.filter((b) => b.status === "cancelled");
    const grossCents = confirmed.reduce((s, b) => s + b.totalCents, 0);
    const platformFeeCents = confirmed.reduce((s, b) => s + getPlatformFeeCents(b.totalCents, hostPlan), 0);
    const stripeFeeCents = confirmed.reduce(
      (s, b) => s + (b.stripeFeeCents ?? getStripeFeeCents(b.totalCents)),
      0
    );
    const netCents = getNetCents(grossCents, platformFeeCents, stripeFeeCents);

    const retreatMap = new Map(retreats.map((r) => [r.id, r]));
    const retreatsAgg: Record<string, { name: string; startDate: string; endDate: string; capacity: number; grossCents: number; platformFeeCents: number; stripeFeeCents: number; confirmedCount: number }> = {};
    filtered.filter((b) => b.status === "confirmed").forEach((b) => {
      if (!retreatsAgg[b.retreatId]) {
        const r = retreatMap.get(b.retreatId);
        retreatsAgg[b.retreatId] = {
          name: b.retreatName,
          startDate: b.retreatStartDate,
          endDate: b.retreatEndDate,
          capacity: r?.capacity ?? 0,
          grossCents: 0,
          platformFeeCents: 0,
          stripeFeeCents: 0,
          confirmedCount: 0,
        };
      }
      const agg = retreatsAgg[b.retreatId];
      agg.grossCents += b.totalCents;
      agg.platformFeeCents += getPlatformFeeCents(b.totalCents, hostPlan);
      agg.stripeFeeCents += b.stripeFeeCents ?? getStripeFeeCents(b.totalCents);
      agg.confirmedCount += 1;
    });
    const retreatsSorted: RetreatWithEarnings[] = Object.entries(retreatsAgg)
      .map(([id, agg]) => {
        const r = retreatMap.get(id);
        const startDate = r?.startDate ?? agg.startDate;
        const endDate = r?.endDate ?? agg.endDate;
        const now = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);
        let status: "upcoming" | "in_progress" | "completed" = "completed";
        if (now < start) status = "upcoming";
        else if (now >= start && now <= end) status = "in_progress";
        return {
          id,
          name: agg.name,
          startDate,
          endDate,
          capacity: agg.capacity,
          confirmedCount: agg.confirmedCount,
          grossCents: agg.grossCents,
          platformFeeCents: agg.platformFeeCents,
          stripeFeeCents: agg.stripeFeeCents,
          netCents: agg.grossCents - agg.platformFeeCents - agg.stripeFeeCents,
          status,
        };
      })
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    const byMonth = new Map<string, { gross: number; net: number }>();
    confirmed.forEach((b) => {
      const d = new Date(b.bookedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const existing = byMonth.get(key) ?? { gross: 0, net: 0 };
      const pf = getPlatformFeeCents(b.totalCents, hostPlan);
      const sf = b.stripeFeeCents ?? getStripeFeeCents(b.totalCents);
      existing.gross += b.totalCents;
      existing.net += b.totalCents - pf - sf;
      byMonth.set(key, existing);
    });
    const monthlyData = Array.from(byMonth.entries())
      .map(([month, v]) => ({ month, ...v }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      filteredBookings: filtered,
      stats: {
        grossCents,
        platformFeeCents,
        stripeFeeCents,
        netCents,
        confirmedCount: confirmed.length,
        pendingCount: pending.length,
        cancelledCount: cancelled.length,
      },
      retreatsInRange: retreatsSorted,
      monthlyData,
    };
  }, [bookings, retreats, dateRange, hostPlan]);

  return (
    <div className="mx-auto max-w-[1100px]">
      <header className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] tracking-tight text-ink">Financials</h1>
          <p className="mt-2 text-warm-gray">Your earnings and payouts</p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-full border border-onda-border bg-card-bg p-1">
          {DATE_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setDateRange(opt.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                dateRange === opt.key
                  ? "bg-sage text-white"
                  : "text-ink hover:bg-onda-border/30"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </header>

      <FinancialsStatCards stats={stats} />
      <p className="mb-10 text-sm text-warm-gray">
        Based on {stats.confirmedCount} confirmed bookings
        {stats.pendingCount > 0 && ` · ${stats.pendingCount} pending`}
        {stats.cancelledCount > 0 && ` · ${stats.cancelledCount} cancelled`}
      </p>

      <EarningsChart monthlyData={monthlyData} className="mb-10" />
      <RetreatEarningsTable retreats={retreatsInRange} className="mb-10" />
      <TransactionLedger
        bookings={filteredBookings}
        retreats={retreats}
        hostPlan={hostPlan}
        dateRange={dateRange}
        className="mb-10"
      />
      <PayoutSummary />
    </div>
  );
}
