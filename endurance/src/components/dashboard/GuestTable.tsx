"use client";

import Link from "next/link";

export interface GuestRow {
  id: string;
  retreatId: string;
  guestName: string;
  guestEmail: string;
  retreatName: string;
  totalCents: number;
  status: "confirmed" | "pending" | "cancelled";
  waiverSigned: boolean;
  bookedAt: string;
}

interface GuestTableProps {
  bookings: GuestRow[];
}

export function GuestTable({ bookings }: GuestTableProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-serif text-lg text-ink">Guest list</h2>
        <Link
          href="/dashboard/bookings"
          className="inline-flex items-center rounded-md border-[1.5px] border-[#D8D2C4] px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:border-ink"
        >
          View all →
        </Link>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-onda-border bg-card-bg">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-onda-border bg-table-header">
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                  Guest
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                  Retreat
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                  Status
                </th>
                <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-onda-border last:border-b-0 hover:bg-[rgba(74,103,65,0.02)]"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-ink">{b.guestName}</div>
                    <div className="mt-0.5 text-[13px] text-warm-gray">{b.guestEmail}</div>
                  </td>
                  <td className="px-6 py-4 text-ink">{b.retreatName}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                        b.status === "confirmed"
                          ? "bg-status-signed text-sage"
                          : b.status === "pending"
                            ? "bg-status-pending text-clay"
                            : "bg-warm-gray/15 text-warm-gray"
                      }`}
                    >
                      {b.status === "confirmed"
                        ? "Confirmed"
                        : b.status === "pending"
                          ? "Pending"
                          : "Cancelled"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/bookings/${b.id}`}
                      className="inline-block rounded-md border border-onda-border bg-transparent px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-ink hover:bg-cream"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
