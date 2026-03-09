"use client";

import type { CancellationPolicy } from "@/lib/retreat-types";

const policies: { value: CancellationPolicy; label: string; description: string }[] = [
  {
    value: "flexible",
    label: "Flexible",
    description: "Full refund up to 14 days before start",
  },
  {
    value: "moderate",
    label: "Moderate",
    description: "50% refund up to 7 days before start",
  },
  {
    value: "strict",
    label: "Strict",
    description: "No refund within 30 days of start",
  },
];

interface CancellationPolicySelectorProps {
  value: CancellationPolicy;
  onChange: (v: CancellationPolicy) => void;
}

export function CancellationPolicySelector({ value, onChange }: CancellationPolicySelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {policies.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          className={`rounded-xl border-2 p-4 text-left transition-colors ${
            value === p.value
              ? "border-[#4A6741] bg-[#4A6741]/10"
              : "border-[#D8D2C4] bg-white hover:border-[#8A8478]"
          }`}
        >
          <span className="block font-semibold text-[#1A1A14]">{p.label}</span>
          <span className="mt-1 block text-sm text-[#8A8478]">{p.description}</span>
        </button>
      ))}
    </div>
  );
}
