"use client";

import { useState } from "react";

export default function RetreatDetailClient({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mt-4 space-y-0 border border-onda-border rounded-xl overflow-hidden">
      {faqs.map((faq, i) => (
        <div
          key={i}
          className="border-b border-onda-border last:border-b-0 bg-card-bg"
        >
          <button
            type="button"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-ink hover:bg-sage/5 transition-colors"
          >
            {faq.question}
            <span className="text-warm-gray shrink-0 ml-2">
              {openIndex === i ? "−" : "+"}
            </span>
          </button>
          {openIndex === i && (
            <div className="border-t border-onda-border bg-cream/50 px-5 py-4 text-sm text-warm-gray leading-relaxed">
              {faq.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
