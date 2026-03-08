"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/financials";
import type { FinancialsBooking } from "@/lib/financials";
import type { RetreatWithEarnings } from "@/lib/financials";
import type { HostPlan } from "@/lib/financials";
import { getPlatformFeeCents, getStripeFeeCents } from "@/lib/financials";
import type { DateRangeKey } from "@/lib/financials";

const PER_PAGE = 20;
const STRIPE_DASHBOARD_URL = "https://dashboard.stripe.com/payments";

export interface TransactionLedgerProps {
  bookings: FinancialsBooking[];
  retreats: RetreatWithEarnings[];
  hostPlan: HostPlan;
  dateRange: DateRangeKey;
  className?: string;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function PaymentTypeBadge({ type }: { type: FinancialsBooking["paymentType"] }) {
  const labels = { deposit: "Deposit", balance: "Balance payment", refund: "Refund" };
  return <span className="text-ink">{labels[type]}</span>;
}

function PaymentStatusBadge({ status }: { status: FinancialsBooking["paymentStatus"] }) {
  const styles = {
    paid: "bg-status-signed text-sage",
    pending: "bg-status-pending text-clay",
    refunded: "bg-warm-gray/15 text-warm-gray",
  };
  const labels = { paid: "Paid", pending: "Pending", refunded: "Refunded" };
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function TransactionLedger({
  bookings,
  retreats,
  hostPlan,
  className = "",
}: TransactionLedgerProps) {
  const [search, setSearch] = useState("");
  const [retreatFilter, setRetreatFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "deposit" | "balance" | "refund">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending" | "refunded">("all");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let list = [...bookings];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((b) => b.guestName.toLowerCase().includes(q));
    }
    if (retreatFilter) list = list.filter((b) => b.retreatId === retreatFilter);
    if (typeFilter !== "all") list = list.filter((b) => b.paymentType === typeFilter);
    if (statusFilter !== "all") list = list.filter((b) => b.paymentStatus === statusFilter);
    return list;
  }, [bookings, search, retreatFilter, typeFilter, statusFilter]);

  const paginated = useMemo(() => {
    const start = page * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  function exportCsv() {
    const headers = [
      "Date",
      "Guest name",
      "Retreat",
      "Type",
      "Gross amount",
      "Platform fee",
      "Stripe fee",
      "Net amount",
      "Status",
      "Stripe payment ID",
    ];
    const rows = filtered.map((b) => {
      const pf = getPlatformFeeCents(b.totalCents, hostPlan);
      const sf = b.stripeFeeCents ?? getStripeFeeCents(b.totalCents);
      const net = b.totalCents - pf - sf;
      return [
        formatDate(b.bookedAt),
        b.guestName,
        b.retreatName,
        b.paymentType,
        (b.totalCents / 100).toFixed(2),
        (pf / 100).toFixed(2),
        (sf / 100).toFixed(2),
        (net / 100).toFixed(2),
        b.paymentStatus,
        b.stripePaymentId ?? "",
      ];
    });
    const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(String).map(escape).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className={`rounded-2xl border border-onda-border bg-card-bg overflow-hidden ${className}`}>
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:p-6 border-b border-onda-border">
        <div>
          <h2 className="font-serif text-lg sm:text-xl text-ink">All transactions</h2>
          <p className="mt-1 text-sm text-warm-gray">Every booking payment in detail</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg border-2 border-onda-border bg-transparent px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink min-h-[44px] sm:min-h-0 flex items-center justify-center"
        >
          Export CSV
        </button>
      </div>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 border-b border-onda-border bg-table-header">
        <input
          type="text"
          placeholder="Search by guest name"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="w-full min-h-[44px] sm:min-h-0 sm:w-auto rounded-lg border border-onda-border bg-white px-3 py-2 text-sm text-ink placeholder:text-warm-gray focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
        />
        <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:gap-3">
          <select
            value={retreatFilter}
            onChange={(e) => { setRetreatFilter(e.target.value); setPage(0); }}
            className="min-h-[44px] w-full min-w-0 rounded-lg border border-onda-border bg-white px-3 py-2 text-sm text-ink focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20 sm:min-h-0 sm:min-w-[180px]"
          >
            <option value="">All retreats</option>
            {retreats.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value as typeof typeFilter); setPage(0); }}
            className="min-h-[44px] w-full min-w-0 rounded-lg border border-onda-border bg-white px-3 py-2 text-sm text-ink focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20 sm:min-h-0"
          >
            <option value="all">All types</option>
            <option value="deposit">Deposit</option>
            <option value="balance">Balance</option>
            <option value="refund">Refund</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(0); }}
            className="min-h-[44px] w-full min-w-0 rounded-lg border border-onda-border bg-white px-3 py-2 text-sm text-ink focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20 sm:min-h-0"
          >
            <option value="all">All statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-onda-border bg-table-header">
              <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">Date</th>
              <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">Guest</th>
              <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">Retreat</th>
              <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">Type</th>
              <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">Gross</th>
              <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">Platform fee</th>
              <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">Stripe fee</th>
              <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">Net</th>
              <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">Status</th>
              <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">Stripe ID</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-10 text-center text-warm-gray">
                  No transactions match your filters.
                </td>
              </tr>
            ) : (
              paginated.map((b) => {
                const pf = getPlatformFeeCents(b.totalCents, hostPlan);
                const sf = b.stripeFeeCents ?? getStripeFeeCents(b.totalCents);
                const net = b.totalCents - pf - sf;
                return (
                  <tr key={b.id} className="border-b border-onda-border last:border-b-0 hover:bg-[rgba(74,103,65,0.02)]">
                    <td className="px-6 py-4 text-warm-gray">{formatDate(b.bookedAt)}</td>
                    <td className="px-6 py-4 font-medium text-ink">{b.guestName || "—"}</td>
                    <td className="px-6 py-4 text-ink">{b.retreatName}</td>
                    <td className="px-6 py-4"><PaymentTypeBadge type={b.paymentType} /></td>
                    <td className="px-6 py-4 text-ink">{formatCurrency(b.totalCents)}</td>
                    <td className="px-6 py-4 text-clay">−{formatCurrency(pf)}</td>
                    <td className="px-6 py-4 text-clay">−{formatCurrency(sf)}</td>
                    <td className="px-6 py-4 text-sage">{formatCurrency(net)}</td>
                    <td className="px-6 py-4"><PaymentStatusBadge status={b.paymentStatus} /></td>
                    <td className="px-6 py-4">
                      {b.stripePaymentId ? (
                        <a
                          href={`${STRIPE_DASHBOARD_URL}/${b.stripePaymentId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-warm-gray hover:text-sage hover:underline"
                        >
                          {b.stripePaymentId.slice(0, 12)}…
                        </a>
                      ) : (
                        <span className="text-xs text-warm-gray">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 border-t border-onda-border px-4 py-3 sm:px-6">
          <p className="text-sm text-warm-gray order-2 sm:order-1">
            Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-2 order-1 sm:order-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="min-h-[44px] flex-1 sm:flex-none rounded-lg border border-onda-border bg-white px-3 py-2 text-sm font-medium text-ink disabled:opacity-50 hover:border-ink"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="min-h-[44px] flex-1 sm:flex-none rounded-lg border border-onda-border bg-white px-3 py-2 text-sm font-medium text-ink disabled:opacity-50 hover:border-ink"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
