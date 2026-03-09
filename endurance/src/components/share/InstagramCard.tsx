"use client";

import { useRef, useCallback } from "react";
import html2canvas from "html2canvas";

interface InstagramCardProps {
  retreatName: string;
  datesAndLocation: string;
  spotsLeft: number;
  coverImageUrl: string | null;
}

export function InstagramCard({
  retreatName,
  datesAndLocation,
  spotsLeft,
  coverImageUrl,
}: InstagramCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(async () => {
    const el = cardRef.current;
    if (!el) return;
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: coverImageUrl ? undefined : "#1A1A14",
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `retreat-${retreatName.replace(/\s+/g, "-").toLowerCase()}-card.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Download failed:", err);
    }
  }, [retreatName, coverImageUrl]);

  return (
    <div className="rounded-2xl border border-[#D8D2C4] bg-[#FDFAF5] p-6">
      <h2 className="font-serif text-lg text-[#1A1A14]">Instagram story card</h2>
      <div className="mt-4 flex flex-col items-start gap-4">
        <div
          ref={cardRef}
          className="relative flex h-[400px] w-[400px] flex-col justify-between overflow-hidden rounded-xl bg-[#1A1A14] text-white"
          style={
            coverImageUrl
              ? { backgroundImage: `url(${coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : undefined
          }
        >
          {coverImageUrl && <div className="absolute inset-0 bg-[#1A1A14]/50" />}
          <div className="relative z-10 p-6">
            <h3 className="font-serif text-2xl leading-tight text-white">{retreatName}</h3>
            <p className="mt-2 text-sm text-white/70">{datesAndLocation}</p>
          </div>
          <div className="relative z-10 flex items-end justify-between p-6">
            <span
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                spotsLeft < 5 ? "bg-[#C4793A] text-white" : "bg-[#4A6741] text-white"
              }`}
            >
              {spotsLeft < 5 ? `${spotsLeft} spots left` : "Now booking"}
            </span>
            <span className="font-serif text-sm font-medium text-white/80">Outpost</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          className="rounded-lg bg-[#4A6741] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6B8F62]"
        >
          Download card
        </button>
        <p className="text-xs text-[#8A8478]">Save and share to your Instagram story or feed</p>
      </div>
    </div>
  );
}
