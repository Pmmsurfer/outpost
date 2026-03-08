"use client";

import { useState } from "react";

interface BulletListInputProps {
  value: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

export function BulletListInput({
  value,
  onChange,
  placeholder = "Add a highlight",
}: BulletListInputProps) {
  const [newItem, setNewItem] = useState("");

  const add = () => {
    const t = newItem.trim();
    if (!t) return;
    onChange([...value, t]);
    setNewItem("");
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const move = (index: number, dir: "up" | "down") => {
    const next = [...value];
    const j = dir === "up" ? index - 1 : index + 1;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {value.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-lg border border-[#D8D2C4] bg-white px-3 py-2"
        >
          <span className="text-sm text-[#8A8478]">{i + 1}.</span>
          <span className="flex-1 text-sm text-[#1A1A14]">{item}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => move(i, "up")}
              disabled={i === 0}
              className="rounded p-1 text-[#8A8478] hover:bg-[#F5F0E8] disabled:opacity-40"
              aria-label="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(i, "down")}
              disabled={i === value.length - 1}
              className="rounded p-1 text-[#8A8478] hover:bg-[#F5F0E8] disabled:opacity-40"
              aria-label="Move down"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => remove(i)}
              className="rounded p-1 text-[#8A8478] hover:bg-[#F5F0E8] hover:text-[#C4793A]"
              aria-label="Remove"
            >
              ×
            </button>
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-[#D8D2C4] bg-white px-4 py-2.5 text-sm text-[#1A1A14] placeholder:text-[#8A8478] focus:border-[#4A6741] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/20"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-lg border border-[#4A6741] bg-transparent px-4 py-2.5 text-sm font-semibold text-[#4A6741] hover:bg-[#4A6741]/10"
        >
          + Add highlight
        </button>
      </div>
    </div>
  );
}
