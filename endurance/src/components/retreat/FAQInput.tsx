"use client";

import { useState } from "react";
import type { RetreatFaq } from "@/lib/retreat-types";

interface FAQInputProps {
  value: RetreatFaq[];
  onChange: (faqs: RetreatFaq[]) => void;
}

export function FAQInput({ value, onChange }: FAQInputProps) {
  const [openId, setOpenId] = useState<string | null>(value.length > 0 ? `faq-0` : null);

  const add = () => {
    const newFaq: RetreatFaq = { question: "", answer: "" };
    const next = [...value, newFaq];
    onChange(next);
    setOpenId(`faq-${next.length - 1}`);
  };

  const update = (index: number, field: "question" | "answer", text: string) => {
    const next = value.map((faq, i) => (i === index ? { ...faq, [field]: text } : faq));
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
    setOpenId(null);
  };

  return (
    <div className="space-y-2">
      {value.map((faq, i) => {
        const id = `faq-${i}`;
        const isOpen = openId === id;
        return (
          <div
            key={id}
            className="overflow-hidden rounded-lg border border-[#D8D2C4] bg-white"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-[#1A1A14] hover:bg-[#F5F0E8]/50"
            >
              <span className="truncate">
                {faq.question || `FAQ ${i + 1}`}
              </span>
              <span className="text-[#8A8478]">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && (
              <div className="border-t border-[#D8D2C4] p-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8A8478]">Question</label>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => update(i, "question", e.target.value)}
                    placeholder="e.g. Do I need experience?"
                    className="mt-1 w-full rounded-lg border border-[#D8D2C4] bg-white px-4 py-2.5 text-sm focus:border-[#4A6741] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8A8478]">Answer</label>
                  <textarea
                    value={faq.answer}
                    onChange={(e) => update(i, "answer", e.target.value)}
                    placeholder="e.g. No, all levels are welcome."
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-[#D8D2C4] bg-white px-4 py-2.5 text-sm focus:border-[#4A6741] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-sm font-medium text-[#8A8478] hover:text-[#C4793A]"
                >
                  Remove FAQ
                </button>
              </div>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={add}
        className="text-sm font-semibold text-[#4A6741] hover:underline"
      >
        + Add FAQ
      </button>
    </div>
  );
}
