"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/financials";
import type { RetreatWithEarnings } from "@/lib/financials";

export interface RetreatEarningsTableProps {
  retreats: RetreatWithEarnings[];
  className?: string;
}

function formatRetreatDates(start: string, end: string): string {
  if (!start || !end) return "—";
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function StatusBadge({ status }: { status: RetreatWithEarnings["status"] }) {
  const styles = {
    upcoming: "bg-status-pending text-clay",
    in_progress: "bg-sage/20 text-sage",
    completed: "bg-warm-gray/15 text-warm-gray",
  };
  const labels = {
    upcoming: "Upcoming",
    in_progress: "In progress",
    completed: "Completed",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function RetreatEarningsTable({ retreats, className = "" }: RetreatEarningsTableProps) {
  if (retreats.length === 0) {
    return (
      <section className={`rounded-2xl border border-onda-border bg-card-bg p-8 ${className}`}>
        <h2 className="font-serif text-xl text-ink">Earnings by retreat</h2>
        <p className="mt-4 text-warm-gray">No retreats with bookings in this period.</p>
      </section>
    );
  }

  return (
    <section className={`rounded-2xl border border-onda-border bg-card-bg overflow-hidden ${className}`}>
      <h2 className="font-serif text-xl text-ink p-6 pb-0">Earnings by retreat</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-onda-border bg-table-header">
              <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                Retreat
              </th>
              <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                Bookings
              </th>
              <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                Gross revenue
              </th>
              <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                Platform fee
              </th>
              <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                Stripe fees
              </th>
              <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                Net earnings
              </th>
              <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {retreats.map((r) => (
              <tr key={r.id} className="border-b border-onda-border last:border-b-0 hover:bg-[rgba(74,103,65,0.02)]">
                <td className="px-6 py-4">
                  <Link
                    href={`/dashboard/retreats/${r.id}`}
                    className="font-medium text-ink hover:text-sage hover:underline"
                  >
                    {r.name}
                  </Link>
                  <p className="mt-0.5 text-[13px] text-warm-gray">
                    {formatRetreatDates(r.startDate, r.endDate)}
                  </p>
                </td>
                <td className="px-6 py-4 text-ink">
                  {r.confirmedCount} / {r.capacity || "—"}
                </td>
                <td className="px-6 py-4 font-medium text-ink">
                  {formatCurrency(r.grossCents)}
                </td>
                <td className="px-6 py-4 text-clay">
                  −{formatCurrency(r.platformFeeCents)}
                </td>
                <td className="px-6 py-4 text-clay">
                  −{formatCurrency(r.stripeFeeCents)}
                </td>
                <td className="px-6 py-4 font-medium text-sage">
                  {formatCurrency(r.netCents)}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
