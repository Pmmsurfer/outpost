"use client";

import { useState, useMemo, useEffect } from "react";
import { mockAccommodationTypes } from "@/lib/retreats";
import { getRetreatDetail } from "@/lib/retreatDetails";
import { BookingLinkCard } from "./BookingLinkCard";
import { InstagramCard } from "./InstagramCard";
import { EmbedCode } from "./EmbedCode";
import type { Retreat } from "@/lib/bookings";

export type RetreatForShare = Retreat & { location?: string; capacity?: number; coverImageUrl?: string | null };

interface ShareClientProps {
  retreats: RetreatForShare[];
}

function getSpotsLeft(retreatId: string, fallbackCapacity?: number): number {
  const types = mockAccommodationTypes.filter((a) => a.retreatId === retreatId);
  if (types.length > 0) {
    const totalCapacity = types.reduce((s, a) => s + a.capacity, 0);
    const totalBooked = types.reduce((s, a) => s + a.bookedCount, 0);
    return Math.max(0, totalCapacity - totalBooked);
  }
  return fallbackCapacity ?? 0;
}

function getRetreatLocation(retreatId: string, fallbackLocation?: string): string {
  if (fallbackLocation) return fallbackLocation;
  const detail = getRetreatDetail(retreatId);
  return detail?.location ?? "—";
}

export function ShareClient({ retreats }: ShareClientProps) {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  const sorted = useMemo(
    () => [...retreats].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [retreats]
  );
  const defaultSelected = sorted[0]?.id ?? "";
  const [selectedRetreatId, setSelectedRetreatId] = useState(defaultSelected);

  const selectedRetreat = retreats.find((r) => r.id === selectedRetreatId) ?? sorted[0];
  const retreatId = selectedRetreat?.id ?? "";

  const bookingUrl = useMemo(
    () => (origin ? `${origin}/retreat/${retreatId}` : ""),
    [origin, retreatId]
  );

  const getBookingUrl = (id: string) => (origin ? `${origin}/retreat/${id}` : "");

  const datesFormatted = selectedRetreat
    ? `${new Date(selectedRetreat.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${new Date(selectedRetreat.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    : "";
  const location = getRetreatLocation(retreatId, selectedRetreat?.location);
  const datesAndLocation = `${datesFormatted} · ${location}`;
  const spotsLeft = getSpotsLeft(retreatId, selectedRetreat?.capacity);

  if (!selectedRetreat) return null;

  return (
    <div className="mt-8 space-y-8">
      <BookingLinkCard
        retreats={retreats.map((r) => ({ id: r.id, name: r.name }))}
        selectedRetreatId={selectedRetreatId}
        onSelectRetreat={setSelectedRetreatId}
        getBookingUrl={getBookingUrl}
      />
      <EmbedCode bookingUrl={bookingUrl} />
      <InstagramCard
        retreatName={selectedRetreat.name}
        datesAndLocation={datesAndLocation}
        spotsLeft={spotsLeft}
        coverImageUrl={selectedRetreat.coverImageUrl ?? null}
      />
    </div>
  );
}
