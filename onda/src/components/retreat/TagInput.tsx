"use client";

import { useState, useCallback, KeyboardEvent } from "react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxLength?: number;
}

export function TagInput({ value, onChange, placeholder = "Type and press Enter to add", maxLength }: TagInputProps) {
  const [input, setInput] = useState("");

  const addTag = useCallback(
    (raw: string) => {
      const tag = raw.trim().replace(/^,+|,+$/g, "");
      if (!tag || (maxLength != null && value.length >= maxLength)) return;
      if (value.includes(tag)) return;
      onChange([...value, tag]);
      setInput("");
    },
    [value, onChange, maxLength]
  );

  const removeTag = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange]
  );

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (input.trim()) addTag(input);
      else if (e.key === "," && input.length) addTag(input);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-[#D8D2C4] bg-white p-2 focus-within:ring-2 focus-within:ring-[#4A6741]/30">
      {value.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E8] px-3 py-1 text-sm text-[#1A1A14]"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(i)}
            className="ml-0.5 rounded-full p-0.5 text-[#8A8478] hover:bg-[#D8D2C4] hover:text-[#1A1A14]"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => input.trim() && addTag(input)}
        placeholder={value.length === 0 ? placeholder : ""}
        className="min-w-[120px] flex-1 border-0 bg-transparent p-1 text-sm text-[#1A1A14] placeholder:text-[#8A8478] focus:outline-none"
      />
    </div>
  );
}
