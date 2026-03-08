"use client";

import { formatCurrency } from "@/lib/financials";

export interface FinancialsStatCardsProps {
  stats: {
    grossCents: number;
    platformFeeCents: number;
    stripeFeeCents: number;
    netCents: number;
  };
}

export function FinancialsStatCards({ stats }: FinancialsStatCardsProps) {
  return (
    <div
      className="mb-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}
    >
      <div className="rounded-xl border border-onda-border bg-card-bg p-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
          Gross revenue
        </p>
        <p className="font-serif text-[28px] text-ink">
          {formatCurrency(stats.grossCents)}
        </p>
      </div>
      <div className="rounded-xl border border-onda-border bg-card-bg p-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
          Platform fees
        </p>
        <p className="font-serif text-[28px] text-clay">
          −{formatCurrency(stats.platformFeeCents)}
        </p>
        <p className="mt-0.5 text-xs text-warm-gray">Outpost commission</p>
      </div>
      <div className="rounded-xl border border-onda-border bg-card-bg p-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
          Stripe fees
        </p>
        <p className="font-serif text-[28px] text-clay">
          −{formatCurrency(stats.stripeFeeCents)}
        </p>
        <p className="mt-0.5 text-xs text-warm-gray">2.9% + $0.30 per txn</p>
      </div>
      <div className="rounded-xl border border-onda-border bg-card-bg p-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
          Net earnings
        </p>
        <p className="font-serif text-[28px] text-sage">
          {formatCurrency(stats.netCents)}
        </p>
      </div>
    </div>
  );
}
