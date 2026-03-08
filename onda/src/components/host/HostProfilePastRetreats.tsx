"use client";

import { useState } from "react";
import { RetreatCard } from "./RetreatCard";
import type { RetreatForHost } from "@/lib/host-profile";

export function HostProfilePastRetreats({ pastRetreats }: { pastRetreats: RetreatForHost[] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <section className="mt-14">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-2 text-[#8A8478] hover:text-[#1A1A14]"
      >
        <span className="font-medium">
          {pastRetreats.length} past retreat{pastRetreats.length === 1 ? "" : "s"}
        </span>
        <span aria-hidden>{expanded ? "▼" : "▶"}</span>
      </button>
      {expanded && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {pastRetreats.map((retreat) => (
            <RetreatCard
              key={retreat.id}
              retreat={retreat}
              href={`/retreat/${retreat.id}`}
              muted
            />
          ))}
        </div>
      )}
    </section>
  );
}
