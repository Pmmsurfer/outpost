"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { mapSupabaseRetreatToListItem } from "@/lib/bookings";
import type { RetreatListItem } from "@/lib/bookings";
import {
  type Booking,
  type BookingStatus,
} from "@/lib/bookings";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function formatRetreatDates(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const styles: Record<BookingStatus, string> = {
    confirmed: "bg-status-signed text-sage",
    pending: "bg-status-pending text-clay",
    cancelled: "bg-warm-gray/15 text-warm-gray",
  };
  const labels: Record<BookingStatus, string> = {
    confirmed: "Confirmed",
    pending: "Pending",
    cancelled: "Cancelled",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function BookingsContent() {
  const searchParams = useSearchParams();
  const retreatFromUrl = searchParams.get("retreat") ?? "";
  const [search, setSearch] = useState("");
  const [retreatId, setRetreatId] = useState<string>(retreatFromUrl);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [retreats, setRetreats] = useState<RetreatListItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [googleSheet, setGoogleSheet] = useState<{ connected: boolean; spreadsheetUrl?: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [sheetMessage, setSheetMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted || !user) {
        setLoading(false);
        return;
      }
      const { data: retreatsData } = await supabase
        .from("retreats")
        .select("*")
        .eq("host_id", user.id)
        .order("start_date", { ascending: true });
      const retreatList = (retreatsData ?? []).map((r) => mapSupabaseRetreatToListItem(r as Record<string, unknown>)).filter((r): r is RetreatListItem => r != null);
      if (!mounted) return;
      setRetreats(retreatList);
      const ids = retreatList.map((r) => r.id);
      if (ids.length === 0) {
        setBookings([]);
        setLoading(false);
        return;
      }
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("id, retreat_id, guest_name, guest_email, retreat_name, total_cents, status, waiver_signed, booked_at")
        .in("retreat_id", ids)
        .order("booked_at", { ascending: false });
      const retreatMap = new Map(retreatList.map((r) => [r.id, r]));
      const bookingList: Booking[] = (bookingsData ?? []).map((b: Record<string, unknown>) => {
        const r = retreatMap.get(String(b.retreat_id));
        return {
          id: String(b.id),
          retreatId: String(b.retreat_id),
          guestName: String(b.guest_name ?? ""),
          guestEmail: String(b.guest_email ?? ""),
          retreatName: String(b.retreat_name ?? ""),
          retreatStartDate: r?.startDate ?? "",
          retreatEndDate: r?.endDate ?? "",
          totalCents: typeof b.total_cents === "number" ? b.total_cents : 0,
          status: (b.status as BookingStatus) ?? "pending",
          waiverStatus: b.waiver_signed === true ? "signed" : "pending",
          bookedAt: String(b.booked_at ?? ""),
        };
      });
      if (!mounted) return;
      setBookings(bookingList);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    fetch("/api/integrations/google")
      .then((r) => r.json())
      .then((data) => setGoogleSheet(data))
      .catch(() => setGoogleSheet({ connected: false }));
  }, []);

  useEffect(() => {
    const connected = searchParams.get("google_connected");
    const err = searchParams.get("error");
    if (connected === "1") setSheetMessage("Google Sheet connected. You can sync your bookings below.");
    if (err) {
      const messages: Record<string, string> = {
        missing_params: "Connection was cancelled or invalid.",
        session: "Session expired. Please try again.",
        no_refresh_token: "Google did not return a refresh token. Try disconnecting and connecting again.",
        token_exchange: "Could not complete Google sign-in.",
        sheet_create: "Could not create the Google Sheet.",
        db: "Could not save the connection.",
      };
      setSheetMessage(messages[err] ?? "Something went wrong.");
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    let list = [...bookings];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.guestName.toLowerCase().includes(q) ||
          b.guestEmail.toLowerCase().includes(q)
      );
    }
    if (retreatId) {
      list = list.filter((b) => b.retreatId === retreatId);
    }
    if (statusFilter !== "all") {
      list = list.filter((b) => b.status === statusFilter);
    }
    return list;
  }, [bookings, search, retreatId, statusFilter]);

  const stats = useMemo(() => {
    const totalBookings = filtered.length;
    const totalRevenue = filtered
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => sum + b.totalCents, 0);
    const pendingCount = filtered.filter((b) => b.status === "pending").length;
    return { totalBookings, totalRevenue, pendingCount };
  }, [filtered]);

  function exportCsv() {
    const headers = ["Guest name", "Email", "Retreat", "Amount", "Status", "Waiver", "Booked date"];
    const rows = filtered.map((b) => [
      b.guestName,
      b.guestEmail,
      b.retreatName,
      formatCurrency(b.totalCents),
      b.status.charAt(0).toUpperCase() + b.status.slice(1),
      b.waiverStatus === "signed" ? "Signed" : "Pending",
      formatDate(b.bookedAt),
    ]);
    const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function syncToGoogleSheet() {
    setSyncing(true);
    setSheetMessage(null);
    try {
      const res = await fetch("/api/integrations/google/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      setSheetMessage(`Synced ${data.rowsSynced ?? 0} bookings to your Google Sheet.`);
    } catch (e) {
      setSheetMessage(e instanceof Error ? e.message : "Sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function disconnectGoogleSheet() {
    if (!confirm("Disconnect your Google Sheet? You can connect again later.")) return;
    setSheetMessage(null);
    try {
      const res = await fetch("/api/integrations/google", { method: "DELETE" });
      if (!res.ok) throw new Error("Disconnect failed");
      setGoogleSheet({ connected: false });
      setSheetMessage("Google Sheet disconnected.");
    } catch {
      setSheetMessage("Could not disconnect.");
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-warm-gray">Loading bookings…</div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="mb-8">
        <h1 className="font-serif text-[28px] tracking-tight text-ink">Bookings</h1>
        <p className="mt-2 text-warm-gray">Global ledger of all bookings across your retreats.</p>
      </div>

      {/* Google Sheet integration */}
      <div className="mb-10 rounded-2xl border border-onda-border bg-card-bg p-6">
        <h2 className="font-serif text-lg text-ink">Google Sheet</h2>
        <p className="mt-1 text-sm text-warm-gray">
          Connect a Google Sheet to sync your bookings table. A new sheet is created for you; sync pushes current bookings to it.
        </p>
        {sheetMessage && (
          <p className="mt-3 text-sm text-sage">{sheetMessage}</p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {googleSheet?.connected ? (
            <>
              {googleSheet.spreadsheetUrl && (
                <a
                  href={googleSheet.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-onda-border bg-transparent px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink"
                >
                  Open Sheet →
                </a>
              )}
              <button
                type="button"
                onClick={syncToGoogleSheet}
                disabled={syncing}
                className="rounded-lg bg-sage px-4 py-2.5 text-sm font-semibold text-white hover:bg-sage-light disabled:opacity-60"
              >
                {syncing ? "Syncing…" : "Sync to Sheet"}
              </button>
              <button
                type="button"
                onClick={disconnectGoogleSheet}
                className="rounded-lg border-2 border-onda-border bg-transparent px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink"
              >
                Disconnect
              </button>
            </>
          ) : (
            <a
              href="/api/integrations/google/connect"
              className="inline-flex items-center gap-2 rounded-lg bg-[#4285F4] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3367D6]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Connect Google Sheet
            </a>
          )}
        </div>
      </div>

      {/* Summary bar - match HTML .metrics /.metric-card */}
      <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
        <div className="rounded-xl border border-onda-border bg-card-bg p-5">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
            Total bookings
          </span>
          <p className="font-serif text-[28px] text-ink">{stats.totalBookings}</p>
        </div>
        <div className="rounded-xl border border-onda-border bg-card-bg p-5">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
            Total revenue
          </span>
          <p className="font-serif text-[28px] text-sage">
            {formatCurrency(stats.totalRevenue)}
          </p>
        </div>
        <div className="rounded-xl border border-onda-border bg-card-bg p-5">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
            Pending
          </span>
          <p className="font-serif text-[28px] text-clay">{stats.pendingCount}</p>
        </div>
      </div>

      {/* Filters row - match HTML inputs */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="text"
            placeholder="Search by guest name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-onda-border bg-white px-4 py-2.5 text-sm text-ink placeholder:text-warm-gray focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
          />
          <select
            value={retreatId}
            onChange={(e) => setRetreatId(e.target.value)}
            className="min-w-[280px] rounded-lg border border-onda-border bg-white px-4 py-2.5 text-sm text-ink focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
          >
            <option value="">All retreats</option>
            {retreats.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as BookingStatus | "all")
            }
            className="rounded-lg border border-onda-border bg-white px-4 py-2.5 text-sm text-ink focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
          >
            <option value="all">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg border-2 border-onda-border bg-transparent px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink"
        >
          Export CSV
        </button>
      </div>

      {/* Table - match HTML .card .table-wrap */}
      <div className="overflow-hidden rounded-2xl border border-onda-border bg-card-bg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-onda-border bg-table-header">
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                  Guest
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                  Retreat
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                  Amount
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                  Status
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                  Waiver
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                  Booked
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                  {" "}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-sm text-warm-gray"
                  >
                    No bookings match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((booking) => (
                  <TableRow key={booking.id} booking={booking} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-warm-gray">Loading…</div>}>
      <BookingsContent />
    </Suspense>
  );
}

function TableRow({ booking }: { booking: Booking }) {
  const viewHref = `/dashboard/bookings/${booking.id}`;
  return (
    <tr className="border-b border-onda-border last:border-b-0 hover:bg-[rgba(74,103,65,0.02)]">
      <td className="px-6 py-4">
        <div className="font-semibold text-ink">{booking.guestName}</div>
        <div className="mt-0.5 text-[13px] text-warm-gray">{booking.guestEmail}</div>
      </td>
      <td className="px-6 py-4">
        <div className="font-medium text-ink">{booking.retreatName}</div>
        <div className="mt-0.5 text-[13px] text-warm-gray">
          {formatRetreatDates(
            booking.retreatStartDate,
            booking.retreatEndDate
          )}
        </div>
      </td>
      <td className="px-6 py-4 font-medium text-ink">
        {formatCurrency(booking.totalCents)}
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={booking.status} />
      </td>
      <td className="px-6 py-4">
        {booking.waiverStatus === "signed" ? (
          <span className="font-medium text-sage">Signed</span>
        ) : (
          <span className="text-clay">Pending</span>
        )}
      </td>
      <td className="px-6 py-4 text-warm-gray">
        {formatDate(booking.bookedAt)}
      </td>
      <td className="px-6 py-4">
        <Link
          href={viewHref}
          className="inline-block rounded-md border border-onda-border bg-transparent px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-ink hover:bg-cream"
        >
          View
        </Link>
      </td>
    </tr>
  );
}
