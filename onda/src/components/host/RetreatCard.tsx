"use client";

import Link from "next/link";
import type { RetreatForHost } from "@/lib/host-profile";

function formatRetreatDates(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function formatPrice(dollars: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(dollars);
}

interface RetreatCardProps {
  retreat: RetreatForHost;
  href: string;
  muted?: boolean;
}

export function RetreatCard({ retreat, href, muted = false }: RetreatCardProps) {
  return (
    <Link
      href={href}
      className={`relative flex flex-col overflow-hidden rounded-2xl border border-[#D8D2C4] bg-[#FDFAF5] transition-opacity hover:opacity-90 ${
        muted ? "grayscale-[0.7] opacity-90" : ""
      }`}
    >
      <div className="absolute right-3 top-3">
        {retreat.status === "published" && !muted ? (
          <span className="inline-block rounded-full bg-[#E8F5E6] px-2.5 py-1 text-xs font-semibold text-[#4A6741]">
            Published
          </span>
        ) : null}
      </div>

      <div className="p-4 pr-24">
        <h2 className="font-serif text-lg text-[#1A1A14]">{retreat.name}</h2>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8478]">Location</p>
            <p className="text-[#1A1A14]">{retreat.location ?? "—"}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8478]">Price</p>
            <p className="text-[#1A1A14]">
              {retreat.pricePerPerson != null ? `${formatPrice(retreat.pricePerPerson)} / person` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8478]">Dates</p>
            <p className="text-[#1A1A14]">{formatRetreatDates(retreat.startDate, retreat.endDate)}</p>
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-[#D8D2C4] p-4">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#4A6741]">
          View retreat →
        </span>
      </div>
    </Link>
  );
}
