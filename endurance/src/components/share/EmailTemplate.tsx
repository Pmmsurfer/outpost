"use client";

import { useState } from "react";

interface EmailTemplateProps {
  message: string;
}

export function EmailTemplate({ message }: EmailTemplateProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-[#D8D2C4] bg-[#FDFAF5] p-6">
      <h2 className="font-serif text-lg text-[#1A1A14]">Email your guests</h2>
      <p className="mt-1 text-sm text-[#8A8478]">Send a direct invite to people you know</p>
      <textarea
        readOnly
        value={message}
        rows={14}
        className="mt-4 w-full resize-y rounded-lg border border-[#D8D2C4] bg-white px-4 py-3 font-sans text-sm text-[#1A1A14] focus:border-[#4A6741] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/20"
      />
      <div className="mt-3">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg bg-[#4A6741] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6B8F62]"
        >
          {copied ? "Copied!" : "Copy message"}
        </button>
        <p className="mt-3 text-xs text-[#8A8478]">
          Paste this into Gmail, Mailchimp, or wherever you email your list
        </p>
      </div>
    </div>
  );
}
