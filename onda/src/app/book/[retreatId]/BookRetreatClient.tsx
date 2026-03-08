"use client";

import { useState } from "react";
import Link from "next/link";
import type { RetreatDetail } from "@/lib/retreatDetails";
import type { Retreat } from "@/lib/bookings";
import type { AccommodationType, ActivityOption } from "@/lib/retreats";
import { mockCustomFields, mockConsentCheckboxes } from "@/lib/retreats";

const DIETARY_OPTIONS = ["Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "Halal", "Kosher"] as const;
const REFERRAL_OPTIONS = [
  { value: "", label: "How did you hear about us?" },
  { value: "instagram", label: "Instagram" },
  { value: "friend_or_family", label: "Friend or family" },
  { value: "google", label: "Google" },
  { value: "returning_guest", label: "Returning guest" },
  { value: "other", label: "Other" },
];

function formatRetreatDates(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

export interface BookRetreatClientProps {
  retreatId: string;
  detail: RetreatDetail;
  retreat: Retreat;
  roomTypes: AccommodationType[];
  activityOptions: ActivityOption[];
}

export default function BookRetreatClient({
  retreatId,
  detail,
  retreat,
  roomTypes,
  activityOptions,
}: BookRetreatClientProps) {
  const formRetreatId = detail.bookId ?? retreatId;
  const customFields = mockCustomFields.filter((f) => f.retreatId === formRetreatId);
  const consents = mockConsentCheckboxes.filter((c) => c.retreatId === formRetreatId);

  const showRoomSelection = roomTypes.length > 1;
  const showActivities = activityOptions.length > 0;

  // When only one room type, use it for price display (no section shown)
  const defaultRoomId = roomTypes.length === 1 ? roomTypes[0].id : "";
  const [roomTypeId, setRoomTypeId] = useState(defaultRoomId);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [dietaryRequirements, setDietaryRequirements] = useState<string[]>([]);
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [roommateRequest, setRoommateRequest] = useState("");
  const [roommateExpanded, setRoommateExpanded] = useState(false);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [consentAnswers, setConsentAnswers] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedRoom = roomTypes.find((r) => r.id === roomTypeId);
  const depositCents = retreat.depositCents ?? 0;
  const balanceCents = selectedRoom ? selectedRoom.priceCents - depositCents : 0;

  const toggleDietary = (opt: string) => {
    setDietaryRequirements((prev) =>
      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
    );
  };

  const toggleActivity = (id: string) => {
    setSelectedActivityIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const name = emergencyContactName.trim();
    const phone = emergencyContactPhone.trim();
    if (!name || !phone) {
      setSubmitError("Please fill in emergency contact name and phone.");
      return;
    }
    const gName = guestName.trim();
    const gEmail = guestEmail.trim();
    if (!gName || !gEmail) {
      setSubmitError("Please enter your full name and email.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          retreatId: formRetreatId,
          retreatName: retreat.name,
          guestName: gName,
          guestEmail: gEmail,
          roomTypeId: roomTypeId || null,
          selectedActivities: selectedActivityIds,
          dietaryRequirements,
          dietaryNotes: dietaryNotes.trim() || null,
          emergencyContactName: name,
          emergencyContactPhone: phone,
          referralSource: referralSource || null,
          roommateRequest: roommateRequest.trim() || null,
          totalCents: selectedRoom ? selectedRoom.priceCents : retreat.depositCents ?? 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save booking");
      // TODO: redirect to Stripe Checkout with session id
      window.location.href = `/retreat/${retreatId}`;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <Link href={`/retreat/${retreatId}`} className="text-sm font-semibold text-sage hover:underline">
          ← Back to retreat
        </Link>

        <header className="mt-8">
          <h1 className="font-serif text-[28px] tracking-tight text-ink">{retreat.name}</h1>
          <p className="mt-2 text-warm-gray">{formatRetreatDates(retreat.startDate, retreat.endDate)}</p>
          {depositCents > 0 && (
            <p className="mt-2 text-sm text-warm-gray">
              {formatCurrency(depositCents)} non-refundable deposit (applied to total).
              {retreat.balanceDueDaysBeforeStart != null && (
                <> Balance invoiced {retreat.balanceDueDaysBeforeStart} days before start.</>
              )}
            </p>
          )}
        </header>

        <form className="mt-10 space-y-8" onSubmit={handleSubmit}>
          {/* Your information */}
          <section className="rounded-2xl border border-onda-border bg-card-bg p-6">
            <h2 className="font-serif text-lg text-ink">Your information</h2>
            <p className="mt-1 text-sm text-warm-gray">We&apos;ll use this to confirm your booking and get in touch.</p>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="guest-name" className="block text-sm font-medium text-ink">Full name *</label>
                <input
                  id="guest-name"
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Your full name"
                  className="mt-1 w-full rounded-lg border border-onda-border bg-white px-4 py-3 text-sm text-ink placeholder:text-warm-gray focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
                />
              </div>
              <div>
                <label htmlFor="guest-email" className="block text-sm font-medium text-ink">Email *</label>
                <input
                  id="guest-email"
                  type="email"
                  required
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 w-full rounded-lg border border-onda-border bg-white px-4 py-3 text-sm text-ink placeholder:text-warm-gray focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
                />
              </div>
              <div>
                <label htmlFor="guest-phone" className="block text-sm font-medium text-ink">Phone (optional)</label>
                <input
                  id="guest-phone"
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="Your phone number"
                  className="mt-1 w-full rounded-lg border border-onda-border bg-white px-4 py-3 text-sm text-ink placeholder:text-warm-gray focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
                />
              </div>
            </div>
          </section>

          {/* Room selection — only if multiple room types */}
          {showRoomSelection && (
            <section className="rounded-2xl border border-onda-border bg-card-bg p-6">
              <h2 className="font-serif text-lg text-ink">Choose your room</h2>
              <div className="mt-4 space-y-2">
                {roomTypes.map((room) => {
                  const spotsLeft = room.capacity - room.bookedCount;
                  const soldOut = room.soldOut || spotsLeft <= 0;
                  const isSelected = roomTypeId === room.id;
                  return (
                    <label
                      key={room.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
                        soldOut
                          ? "cursor-not-allowed border-onda-border bg-warm-gray/10 opacity-70"
                          : isSelected
                            ? "border-sage bg-sage/5"
                            : "border-onda-border hover:bg-sage/5"
                      }`}
                    >
                      <input
                        type="radio"
                        name="room"
                        value={room.id}
                        checked={roomTypeId === room.id}
                        onChange={() => !soldOut && setRoomTypeId(room.id)}
                        disabled={soldOut}
                        className="h-4 w-4 border-onda-border text-sage focus:ring-sage disabled:opacity-50"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-ink">{room.name}</span>
                        <span className="ml-2 text-sm text-warm-gray">
                          {formatCurrency(room.priceCents)} per person
                        </span>
                      </div>
                      <span className="text-xs text-warm-gray">
                        {soldOut ? "Sold out" : `${spotsLeft} spots left`}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          )}

          {/* Activities */}
          {showActivities && (
            <section className="rounded-2xl border border-onda-border bg-card-bg p-6">
              <h2 className="font-serif text-lg text-ink">Which activities are you interested in?</h2>
              <p className="mt-1 text-sm text-warm-gray">Let your host know what you&apos;d like to do</p>
              <div className="mt-4 space-y-2">
                {activityOptions.map((act) => (
                  <label key={act.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-onda-border p-3 hover:bg-sage/5">
                    <input
                      type="checkbox"
                      checked={selectedActivityIds.includes(act.id)}
                      onChange={() => toggleActivity(act.id)}
                      className="h-4 w-4 rounded border-onda-border text-sage focus:ring-sage"
                    />
                    <span className="text-sm text-ink">{act.label}</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Dietary requirements */}
          <section className="rounded-2xl border border-onda-border bg-card-bg p-6">
            <h2 className="font-serif text-lg text-ink">Dietary requirements</h2>
            <p className="mt-1 text-sm text-warm-gray">Help your host plan meals for you</p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {DIETARY_OPTIONS.map((opt) => (
                <label key={opt} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={dietaryRequirements.includes(opt)}
                    onChange={() => toggleDietary(opt)}
                    className="h-4 w-4 rounded border-onda-border text-sage focus:ring-sage"
                  />
                  <span className="text-sm text-ink">{opt}</span>
                </label>
              ))}
            </div>
            <input
              type="text"
              value={dietaryNotes}
              onChange={(e) => setDietaryNotes(e.target.value)}
              placeholder="Allergies or other requirements"
              className="mt-4 w-full rounded-lg border border-onda-border bg-white px-4 py-3 text-sm text-ink placeholder:text-warm-gray focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
            />
          </section>

          {/* Emergency contact */}
          <section className="rounded-2xl border border-onda-border bg-card-bg p-6">
            <h2 className="font-serif text-lg text-ink">Emergency contact</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-ink">Full name *</label>
                <input
                  type="text"
                  required
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="Full name"
                  className="mt-1 w-full rounded-lg border border-onda-border bg-white px-4 py-3 text-sm text-ink placeholder:text-warm-gray focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink">Phone number *</label>
                <input
                  type="tel"
                  required
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  placeholder="Phone number"
                  className="mt-1 w-full rounded-lg border border-onda-border bg-white px-4 py-3 text-sm text-ink placeholder:text-warm-gray focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
                />
              </div>
            </div>
          </section>

          {/* How did you hear about us */}
          <section className="rounded-2xl border border-onda-border bg-card-bg p-6">
            <label className="block text-sm font-medium text-ink">
              {REFERRAL_OPTIONS[0].label}
            </label>
            <select
              value={referralSource}
              onChange={(e) => setReferralSource(e.target.value)}
              className="mt-2 w-full rounded-lg border border-onda-border bg-white px-4 py-3 text-sm text-ink focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
            >
              {REFERRAL_OPTIONS.map((opt) => (
                <option key={opt.value || "empty"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </section>

          {/* Roommate request — optional, collapsed by default */}
          <section className="rounded-2xl border border-onda-border bg-card-bg p-6">
            {!roommateExpanded ? (
              <button
                type="button"
                onClick={() => setRoommateExpanded(true)}
                className="flex w-full items-center gap-2 text-left text-sm font-medium text-ink hover:text-sage"
              >
                <span className="text-lg">+</span>
                Traveling with someone? Add a roommate request
              </button>
            ) : (
              <>
                <h2 className="font-serif text-lg text-ink">Roommate(s) request</h2>
                <p className="mt-1 text-sm text-warm-gray">If you&apos;d like to room with someone, list their name(s). Optional.</p>
                <textarea
                  value={roommateRequest}
                  onChange={(e) => setRoommateRequest(e.target.value)}
                  placeholder="e.g. Jane Smith"
                  rows={2}
                  className="mt-4 w-full rounded-lg border border-onda-border bg-white px-4 py-3 text-sm text-ink placeholder:text-warm-gray focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
                />
              </>
            )}
          </section>

          {/* Custom fields */}
          {customFields.length > 0 && (
            <section className="rounded-2xl border border-onda-border bg-card-bg p-6">
              <h2 className="font-serif text-lg text-ink">Additional details</h2>
              <div className="mt-4 space-y-4">
                {customFields.map((f) => (
                  <div key={f.id}>
                    <label className="block text-sm font-medium text-ink">
                      {f.label} {f.required && "*"}
                    </label>
                    {f.type === "paragraph" ? (
                      <textarea
                        value={customValues[f.id] ?? ""}
                        onChange={(e) => setCustomValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-onda-border bg-white px-4 py-3 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
                      />
                    ) : (
                      <input
                        type="text"
                        value={customValues[f.id] ?? ""}
                        onChange={(e) => setCustomValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-onda-border bg-white px-4 py-3 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Consents */}
          {consents.length > 0 && (
            <section className="rounded-2xl border border-onda-border bg-card-bg p-6">
              <h2 className="font-serif text-lg text-ink">Policies & consent</h2>
              <div className="mt-4 space-y-3">
                {consents.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={consentAnswers[c.id] ?? false}
                      onChange={(e) => setConsentAnswers((prev) => ({ ...prev, [c.id]: e.target.checked }))}
                      className="mt-1 h-4 w-4 rounded border-onda-border text-sage focus:ring-sage"
                    />
                    <span className="text-sm text-ink">
                      {c.label}
                      {c.policyUrl && (
                        <a href={c.policyUrl} className="ml-1 text-sage hover:underline">Learn more</a>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Comments or questions */}
          <section className="rounded-2xl border border-onda-border bg-card-bg p-6">
            <h2 className="font-serif text-lg text-ink">Comments or questions</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
              className="mt-4 w-full rounded-lg border border-onda-border bg-white px-4 py-3 text-sm text-ink placeholder:text-warm-gray focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
            />
          </section>

          {/* Payment */}
          <section className="rounded-2xl border border-onda-border bg-card-bg p-6">
            <h2 className="font-serif text-lg text-ink">Payment</h2>
            <p className="mt-1 text-sm text-warm-gray">
              You&apos;ll enter your card details securely on the next step via Stripe.
            </p>
            {(depositCents > 0 || selectedRoom) && (
              <p className="mt-3 font-semibold text-ink">
                Deposit due today: {formatCurrency(depositCents)}
                {selectedRoom && balanceCents > 0 && (
                  <> · Balance: {formatCurrency(balanceCents)} (invoiced later)</>
                )}
              </p>
            )}
          </section>

          {submitError && (
            <p className="text-sm text-red-600">{submitError}</p>
          )}

          <div className="flex flex-col gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-sage px-6 py-3.5 text-sm font-semibold text-white hover:bg-sage-light disabled:opacity-60 sm:w-auto sm:min-w-[200px]"
            >
              {submitting ? "Saving…" : "Continue to payment →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
