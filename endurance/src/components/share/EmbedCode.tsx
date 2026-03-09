"use client";

import { useState } from "react";

interface EmbedCodeProps {
  bookingUrl: string;
}

const snippet = (url: string) =>
  `<a href="${url}" target="_blank" rel="noopener noreferrer" style="background:#4A6741;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-family:sans-serif">Book Now</a>`;

export function EmbedCode({ bookingUrl }: EmbedCodeProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const code = snippet(bookingUrl);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-[#D8D2C4] bg-[#FDFAF5] p-6">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between text-left font-serif text-lg text-[#1A1A14] hover:opacity-80"
      >
        Add a booking button to your website →
        <span className="text-[#8A8478]" aria-hidden>
          {expanded ? "▼" : "▶"}
        </span>
      </button>
      {expanded && (
        <div className="mt-4">
          <pre className="overflow-x-auto rounded-lg border border-[#D8D2C4] bg-[#1A1A14] p-4 text-xs leading-relaxed text-white">
            {code}
          </pre>
          <button
            type="button"
            onClick={handleCopy}
            className="mt-3 rounded-lg bg-[#4A6741] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6B8F62]"
          >
            {copied ? "Copied!" : "Copy code"}
          </button>
          <p className="mt-3 text-xs text-[#8A8478]">
            Paste this into any website or Squarespace page
          </p>
        </div>
      )}
    </div>
  );
}
