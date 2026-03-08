"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { mockBookings, mockRetreats } from "@/lib/bookings";
import {
  mockAccommodationTypes,
  mockActivityOptions,
  mockCustomFields,
} from "@/lib/retreats";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

export default function BookingDetailPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;
  const booking = mockBookings.find((b) => b.id === bookingId);
  const retreat = booking ? mockRetreats.find((r) => r.id === booking.retreatId) : null;
  const accommodation = booking?.accommodationTypeId
    ? mockAccommodationTypes.find((a) => a.id === booking.accommodationTypeId)
    : null;
  const activities = booking?.activityIds
    ? mockActivityOptions.filter((a) => booking.activityIds!.includes(a.id))
    : [];
  const customFields = retreat ? mockCustomFields.filter((f) => f.retreatId === retreat.id) : [];

  if (!booking) {
    return (
      <div>
        <p className="text-warm-gray">Booking not found.</p>
        <Link href="/dashboard/bookings" className="mt-4 inline-block font-semibold text-sage hover:underline">
          ← Back to Bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Link
        href="/dashboard/bookings"
        className="mb-6 inline-block text-sm font-semibold text-sage hover:underline"
      >
        ← Bookings
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] tracking-tight text-ink">{booking.guestName}</h1>
          <p className="mt-2 text-warm-gray">{booking.guestEmail}</p>
          <p className="mt-1 text-sm text-ink">{booking.retreatName}</p>
          <p className="text-sm text-warm-gray">Booked {formatDate(booking.bookedAt)}</p>
        </div>
        <div className="flex gap-2">
          <span className={`inline-block rounded-full px-3 py-1.5 text-xs font-semibold ${
            booking.status === "confirmed" ? "bg-status-signed text-sage" :
            booking.status === "pending" ? "bg-status-pending text-clay" : "bg-warm-gray/15 text-warm-gray"
          }`}>
            {booking.status === "confirmed" ? "Confirmed" : booking.status === "pending" ? "Pending" : "Cancelled"}
          </span>
          {booking.waiverStatus === "signed" ? (
            <span className="rounded-full bg-status-signed px-3 py-1.5 text-xs font-semibold text-sage">Waiver signed</span>
          ) : (
            <span className="rounded-full bg-status-pending px-3 py-1.5 text-xs font-semibold text-clay">Waiver pending</span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment */}
        <section className="rounded-2xl border border-onda-border bg-card-bg p-6">
          <h2 className="font-serif text-lg text-ink">Payment</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-warm-gray">Total</dt>
              <dd className="font-medium text-ink">{formatCurrency(booking.totalCents)}</dd>
            </div>
            {booking.depositCents != null && (
              <>
                <div className="flex justify-between">
                  <dt className="text-warm-gray">Deposit</dt>
                  <dd className="text-ink">{formatCurrency(booking.depositCents)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-warm-gray">Balance due</dt>
                  <dd className="text-ink">{booking.balanceDueCents != null ? formatCurrency(booking.balanceDueCents) : "—"}</dd>
                </div>
              </>
            )}
          </dl>
        </section>

        {/* Accommodation */}
        {accommodation && (
          <section className="rounded-2xl border border-onda-border bg-card-bg p-6">
            <h2 className="font-serif text-lg text-ink">Accommodation</h2>
            <p className="mt-2 text-sm text-ink">{accommodation.name}</p>
            <p className="text-sm text-warm-gray">{formatCurrency(accommodation.priceCents)}</p>
          </section>
        )}

        {/* Activities */}
        {activities.length > 0 && (
          <section className="rounded-2xl border border-onda-border bg-card-bg p-6">
            <h2 className="font-serif text-lg text-ink">Activities selected</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {activities.map((a) => (
                <li key={a.id} className="rounded-full border border-onda-border bg-cream px-3 py-1 text-sm text-ink">
                  {a.label}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Roommate request */}
        {booking.roommateRequest != null && booking.roommateRequest !== "" && (
          <section className="rounded-2xl border border-onda-border bg-card-bg p-6">
            <h2 className="font-serif text-lg text-ink">Roommate request</h2>
            <p className="mt-2 text-sm text-ink">{booking.roommateRequest}</p>
          </section>
        )}

        {/* Custom field values */}
        {customFields.length > 0 && booking.customFieldValues && Object.keys(booking.customFieldValues).length > 0 && (
          <section className="rounded-2xl border border-onda-border bg-card-bg p-6 lg:col-span-2">
            <h2 className="font-serif text-lg text-ink">Additional details</h2>
            <dl className="mt-4 space-y-2 text-sm">
              {customFields.map((f) => {
                const value = booking.customFieldValues![f.id];
                if (value == null || value === "") return null;
                return (
                  <div key={f.id}>
                    <dt className="text-warm-gray">{f.label}</dt>
                    <dd className="mt-0.5 text-ink">{value}</dd>
                  </div>
                );
              })}
            </dl>
          </section>
        )}

        {/* Notes */}
        {booking.notes != null && booking.notes !== "" && (
          <section className="rounded-2xl border border-onda-border bg-card-bg p-6 lg:col-span-2">
            <h2 className="font-serif text-lg text-ink">Notes</h2>
            <p className="mt-2 text-sm text-ink">{booking.notes}</p>
          </section>
        )}
      </div>

      <div className="mt-8">
        <Link
          href={`/dashboard/retreats/${booking.retreatId}`}
          className="inline-flex items-center gap-2 rounded-lg border-2 border-onda-border bg-transparent px-5 py-2.5 text-sm font-semibold text-ink hover:border-ink"
        >
          View retreat →
        </Link>
      </div>
    </div>
  );
}
