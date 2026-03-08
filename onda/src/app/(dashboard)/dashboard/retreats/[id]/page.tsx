"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { mockRetreats, mockBookings, type Retreat } from "@/lib/bookings";
import {
  mockAccommodationTypes,
  mockActivityOptions,
} from "@/lib/retreats";
import { supabase } from "@/lib/supabase";

function formatRetreatDates(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function getRetreatStatus(): "published" | "draft" {
  return "published";
}

function isRetreatFull(retreatId: string): boolean {
  const types = mockAccommodationTypes.filter((a) => a.retreatId === retreatId);
  return types.length > 0 && types.every((a) => a.soldOut);
}

function getCountdown(startDate: string, endDate: string): { text: string; className?: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  if (today < start) {
    const days = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { text: `Starts in ${days} day${days === 1 ? "" : "s"}`, className: "text-warm-gray" };
  }
  if (today <= end) return { text: "In progress", className: "text-warm-gray" };
  return { text: "Completed", className: "text-warm-gray" };
}

interface WaitlistEntry {
  id: string;
  retreatId: string;
  name: string;
  email: string;
  addedAt: string;
}
const mockWaitlistEntries: WaitlistEntry[] = [];

/** Map Supabase retreat row to Retreat shape (camelCase dates, deposit in cents). */
function mapSupabaseRetreat(row: Record<string, unknown> | null): Retreat | null {
  if (!row || typeof row.id !== "string" || typeof row.name !== "string") return null;
  const startDate = row.start_date != null ? String(row.start_date) : "";
  const endDate = row.end_date != null ? String(row.end_date) : "";
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
  };
}

export default function RetreatDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const updated = searchParams.get("updated") === "1";
  const id = params.id as string;
  const [supabaseRetreat, setSupabaseRetreat] = useState<Retreat | null>(null);
  const [loadingSupabase, setLoadingSupabase] = useState(true);

  const retreatFromMock = mockRetreats.find((r) => r.id === id);
  const retreat = retreatFromMock ?? supabaseRetreat;

  useEffect(() => {
    if (retreatFromMock || !id) {
      setLoadingSupabase(false);
      return;
    }
    if (!supabase) {
      setLoadingSupabase(false);
      return;
    }
    let mounted = true;
    supabase
      .from("retreats")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (!mounted) return;
        setLoadingSupabase(false);
        if (!error && data) setSupabaseRetreat(mapSupabaseRetreat(data as Record<string, unknown>));
      });
    return () => { mounted = false; };
  }, [id, retreatFromMock]);

  const allBookingsForRetreat = mockBookings.filter((b) => b.retreatId === id);
  const guests = allBookingsForRetreat.filter((b) => b.status !== "cancelled");
  const accommodationTypes = mockAccommodationTypes.filter((a) => a.retreatId === id);
  const activities = mockActivityOptions.filter((a) => a.retreatId === id);
  const waitlist = mockWaitlistEntries.filter((w) => w.retreatId === id);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  const status = retreat ? getRetreatStatus() : "published";
  const full = retreat ? isRetreatFull(retreat.id) : false;
  const countdown = retreat ? getCountdown(retreat.startDate, retreat.endDate) : null;

  const totalRevenueCents = allBookingsForRetreat.filter((b) => b.status === "confirmed").reduce((sum, b) => sum + b.totalCents, 0);
  const confirmedCount = allBookingsForRetreat.filter((b) => b.status === "confirmed").length;
  const pendingCount = allBookingsForRetreat.filter((b) => b.status === "pending").length;
  const cancelledCount = allBookingsForRetreat.filter((b) => b.status === "cancelled").length;

  if (loadingSupabase && !retreat) {
    return (
      <div>
        <p className="text-warm-gray">Loading retreat…</p>
        <Link href="/dashboard/retreats" className="mt-4 inline-block font-semibold text-sage hover:underline">
          ← Back to My Retreats
        </Link>
      </div>
    );
  }

  if (!retreat) {
    return (
      <div>
        <p className="text-warm-gray">Retreat not found.</p>
        <Link href="/dashboard/retreats" className="mt-4 inline-block font-semibold text-sage hover:underline">
          ← Back to My Retreats
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Link
        href="/dashboard/retreats"
        className="mb-6 inline-block text-sm font-semibold text-sage hover:underline"
      >
        ← My Retreats
      </Link>
      {updated && (
        <div className="mb-6 rounded-lg border border-sage/30 bg-status-signed px-4 py-3 text-sm font-medium text-sage">
          Retreat updated.
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-[28px] tracking-tight text-ink">{retreat.name}</h1>
        {full ? (
          <span className="rounded-full bg-clay/15 px-3 py-1 text-xs font-semibold text-clay">Full</span>
        ) : status === "published" ? (
          <span className="rounded-full bg-[#4A6741] px-3 py-1 text-xs font-semibold text-white">Published</span>
        ) : (
          <span className="rounded-full bg-[#8A8478] px-3 py-1 text-xs font-semibold text-white">Draft</span>
        )}
      </div>
      <p className="mt-2 text-warm-gray">
        {formatRetreatDates(retreat.startDate, retreat.endDate)}
      </p>
      {countdown && (
        <p className={`mt-1 text-sm ${countdown.className ?? ""}`}>{countdown.text}</p>
      )}

      {retreat.depositCents != null && (
        <p className="mt-2 text-sm text-warm-gray">
          Deposit {formatCurrency(retreat.depositCents)} · Balance due {retreat.balanceDueDaysBeforeStart} days before start
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-warm-gray">
        <span>Total revenue: {formatCurrency(totalRevenueCents)}</span>
        <span aria-hidden>·</span>
        <span>{confirmedCount} confirmed</span>
        <span aria-hidden>·</span>
        <span className={pendingCount > 0 ? "text-clay" : ""}>{pendingCount} pending</span>
        {cancelledCount > 0 && (
          <>
            <span aria-hidden>·</span>
            <span>{cancelledCount} cancelled</span>
          </>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/dashboard/retreats/${retreat.id}/edit`}
          className="inline-flex items-center gap-2 rounded-lg border-2 border-onda-border bg-transparent px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink"
        >
          Edit retreat →
        </Link>
        <Link
          href={`/retreat/${retreat.id}`}
          className="inline-flex items-center gap-2 rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sage-light"
        >
          View public listing →
        </Link>
        <Link
          href={`/dashboard/bookings?retreat=${retreat.id}`}
          className="inline-flex items-center gap-2 rounded-lg border-2 border-onda-border bg-transparent px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink"
        >
          View all bookings →
        </Link>
        <Link
          href="/dashboard/messages"
          className="inline-flex items-center gap-2 rounded-lg border-2 border-onda-border bg-transparent px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink"
        >
          Messages
        </Link>
      </div>

      {accommodationTypes.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-onda-border bg-card-bg">
          <div className="flex items-start justify-between border-b border-onda-border px-6 py-5">
            <div>
              <h2 className="font-serif text-lg text-ink">Accommodation types</h2>
              <p className="mt-1 text-sm text-warm-gray">Room options and availability</p>
            </div>
            <Link
              href={`/dashboard/retreats/${retreat.id}/edit#accommodation`}
              className="text-sm font-semibold text-sage hover:underline"
            >
              Edit
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-onda-border bg-table-header">
                  <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">Room type</th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">Capacity</th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">Booked</th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">Price</th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">Status</th>
                </tr>
              </thead>
              <tbody>
                {accommodationTypes.map((a) => (
                  <tr key={a.id} className="border-b border-onda-border last:border-b-0 hover:bg-[rgba(74,103,65,0.02)]">
                    <td className="px-6 py-4 font-medium text-ink">{a.name}</td>
                    <td className="px-6 py-4 text-warm-gray">{a.capacity}</td>
                    <td className="px-6 py-4 text-warm-gray">{a.bookedCount}</td>
                    <td className="px-6 py-4 font-medium text-ink">{formatCurrency(a.priceCents)}</td>
                    <td className="px-6 py-4">
                      {a.soldOut ? (
                        <span className="rounded-full bg-warm-gray/15 px-2.5 py-1 text-xs font-semibold text-warm-gray">Sold out</span>
                      ) : (
                        <span className="rounded-full bg-status-signed px-2.5 py-1 text-xs font-semibold text-sage">Available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activities.length > 0 && (
        <div className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-onda-border bg-card-bg p-6">
          <div>
            <h2 className="font-serif text-lg text-ink">Activity options</h2>
          <p className="mt-1 text-sm text-warm-gray">Guests can select which activities they’d like</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {activities.map((act) => (
              <li key={act.id} className="rounded-full border border-onda-border bg-cream px-3 py-1.5 text-sm text-ink">
                {act.label}
              </li>
            ))}
          </ul>
          </div>
          <Link
            href={`/dashboard/retreats/${retreat.id}/edit#activities`}
            className="flex-shrink-0 text-sm font-semibold text-sage hover:underline"
          >
            Edit
          </Link>
        </div>
      )}

      <div className="mt-8 overflow-hidden rounded-2xl border border-onda-border bg-card-bg">
        <div className="border-b border-onda-border px-6 py-5">
          <h2 className="font-serif text-lg text-ink">Guest list ({guests.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-onda-border bg-table-header">
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                  Guest
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                  Status
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                  Waiver
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                  Amount
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {guests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-warm-gray">
                    No guests yet.
                  </td>
                </tr>
              ) : (
                guests.map((b) => (
                  <tr key={b.id} className="border-b border-onda-border last:border-b-0 hover:bg-[rgba(74,103,65,0.02)]">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-ink">{b.guestName}</div>
                      <div className="mt-0.5 text-[13px] text-warm-gray">{b.guestEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                        b.status === "confirmed" ? "bg-status-signed text-sage" :
                        b.status === "pending" ? "bg-status-pending text-clay" : "bg-warm-gray/15 text-warm-gray"
                      }`}>
                        {b.status === "confirmed" ? "Confirmed" : b.status === "pending" ? "Pending" : "Cancelled"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {b.waiverStatus === "signed" ? (
                        <span className="font-medium text-sage">Signed</span>
                      ) : (
                        <span className="text-clay">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-ink">
                      {formatCurrency(b.totalCents)}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/messages?retreat=${retreat.id}&email=${encodeURIComponent(b.guestEmail)}`}
                        className="text-sm font-semibold text-ink hover:text-sage hover:underline"
                      >
                        Message →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {waitlist.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-onda-border bg-card-bg">
          <button
            type="button"
            onClick={() => setWaitlistOpen((o) => !o)}
            className="flex w-full items-center justify-between border-b border-onda-border px-6 py-5 text-left"
          >
            <h2 className="font-serif text-lg text-ink">Waitlist ({waitlist.length})</h2>
            <span className="text-warm-gray" aria-hidden>{waitlistOpen ? "▼" : "▶"}</span>
          </button>
          {waitlistOpen && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-onda-border bg-table-header">
                    <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">Name</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">Email</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">Date added</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray"> </th>
                  </tr>
                </thead>
                <tbody>
                  {waitlist.map((w) => (
                    <tr key={w.id} className="border-b border-onda-border last:border-b-0 hover:bg-[rgba(74,103,65,0.02)]">
                      <td className="px-6 py-4 font-medium text-ink">{w.name}</td>
                      <td className="px-6 py-4 text-warm-gray">{w.email}</td>
                      <td className="px-6 py-4 text-warm-gray">
                        {new Date(w.addedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          className="text-sm font-semibold text-sage hover:underline"
                        >
                          Notify
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
