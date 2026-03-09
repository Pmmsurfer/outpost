"use client";

import { useState } from "react";
import type { HostReview } from "@/lib/host-profile";

const DISPLAY_CAP = 6;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= rating ? "text-[#4A6741]" : "text-[#D8D2C4]"}
          aria-hidden
        >
          ★
        </span>
      ))}
    </div>
  );
}

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function HostProfileReviews({ reviews }: { reviews: HostReview[] }) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? reviews : reviews.slice(0, DISPLAY_CAP);

  return (
    <section className="mt-14">
      <h2 className="font-serif text-2xl text-[#1A1A14]">What guests say</h2>
      <ul className="mt-6 space-y-6">
        {displayed.map((r) => (
          <li
            key={r.id}
            className="rounded-2xl border border-[#D8D2C4] bg-[#FDFAF5] p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-[#1A1A14]">
                {r.guest_first_name} {r.guest_last_initial}.
              </span>
              <StarRating rating={r.rating} />
            </div>
            <p className="mt-1 text-sm text-[#8A8478]">{r.retreat_name}</p>
            <p className="mt-3 text-[#1A1A14]">{r.review_text}</p>
            <p className="mt-2 text-xs text-[#8A8478]">{formatReviewDate(r.created_at)}</p>
          </li>
        ))}
      </ul>
      {reviews.length > DISPLAY_CAP && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-6 text-sm font-semibold text-[#4A6741] hover:underline"
        >
          Show all reviews
        </button>
      )}
    </section>
  );
}
