"use client";

import { useState } from "react";

interface BookingLinkCardProps {
  retreats: { id: string; name: string }[];
  selectedRetreatId: string;
  onSelectRetreat: (id: string) => void;
  getBookingUrl: (retreatId: string) => string;
}

export function BookingLinkCard({
  retreats,
  selectedRetreatId,
  onSelectRetreat,
  getBookingUrl,
}: BookingLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const url = getBookingUrl(selectedRetreatId);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpen = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="rounded-2xl border border-[#D8D2C4] bg-[#FDFAF5] p-6">
      <h2 className="font-serif text-lg text-[#1A1A14]">Your booking link</h2>
      {retreats.length > 1 && (
        <div className="mt-4">
          <label htmlFor="share-retreat-select" className="block text-sm font-semibold text-[#1A1A14]">
            Retreat
          </label>
          <select
            id="share-retreat-select"
            value={selectedRetreatId}
            onChange={(e) => onSelectRetreat(e.target.value)}
            className="mt-2 w-full max-w-sm rounded-lg border border-[#D8D2C4] bg-white px-4 py-2.5 text-sm text-ink focus:border-[#4A6741] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/20"
          >
            {retreats.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="mt-4">
        <div className="rounded-lg border border-[#D8D2C4] bg-white px-4 py-3 font-mono text-sm text-[#1A1A14] break-all">
          {url}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg bg-[#4A6741] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6B8F62]"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
          <button
            type="button"
            onClick={handleOpen}
            className="rounded-lg border-2 border-[#D8D2C4] bg-transparent px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-[#1A1A14]"
          >
            Open page →
          </button>
        </div>
        <p className="mt-3 text-xs text-[#8A8478]">
          Share this link anywhere — Instagram bio, email, WhatsApp, wherever your audience is
        </p>
      </div>
    </div>
  );
}
