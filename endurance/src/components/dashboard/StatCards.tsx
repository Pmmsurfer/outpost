"use client";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export interface StatCardsProps {
  bookedConfirmed: number;
  bookedCapacity: number;
  totalRevenueCents: number;
  pendingCount: number;
  activeRetreatsCount: number;
}

export function StatCards({
  bookedConfirmed,
  bookedCapacity,
  totalRevenueCents,
  pendingCount,
  activeRetreatsCount,
}: StatCardsProps) {
  return (
    <div
      className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}
    >
      <div className="rounded-xl border border-onda-border bg-card-bg p-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
          Booked
        </p>
        <p className="font-serif text-[28px] text-ink">
          {bookedConfirmed} / {bookedCapacity}
        </p>
      </div>
      <div className="rounded-xl border border-onda-border bg-card-bg p-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
          Total revenue
        </p>
        <p className="font-serif text-[28px] text-sage">
          {formatCurrency(totalRevenueCents)}
        </p>
      </div>
      <div className="rounded-xl border border-onda-border bg-card-bg p-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
          Pending
        </p>
        <p className={`font-serif text-[28px] ${pendingCount > 0 ? "text-clay" : "text-ink"}`}>
          {pendingCount}
        </p>
        {pendingCount > 0 && (
          <p className="mt-0.5 text-xs text-warm-gray">needs review</p>
        )}
      </div>
      <div className="rounded-xl border border-onda-border bg-card-bg p-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
          Active retreats
        </p>
        <p className="font-serif text-[28px] text-ink">{activeRetreatsCount}</p>
      </div>
    </div>
  );
}
