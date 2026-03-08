"use client";

interface ProgressBarProps {
  statusMessage: string;
  publishLabel?: string;
  onSaveDraft: () => void;
  onPublish: () => void;
  canPublish: boolean;
  isSaving?: boolean;
}

export function ProgressBar({
  statusMessage,
  publishLabel = "Publish Retreat",
  onSaveDraft,
  onPublish,
  canPublish,
  isSaving = false,
}: ProgressBarProps) {
  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-[#D8D2C4] px-6 py-4"
      style={{ background: "#FDFAF5" }}
    >
      <h1 className="font-serif text-xl text-[#1A1A14]">Create Retreat</h1>
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm font-medium text-[#1A1A14]">{statusMessage}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isSaving}
          className="rounded-lg border border-[#D8D2C4] bg-transparent px-4 py-2.5 text-sm font-semibold text-[#1A1A14] transition-colors hover:bg-[#F5F0E8] disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save draft"}
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={!canPublish || isSaving}
          className="rounded-lg bg-[#4A6741] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6B8F62] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {publishLabel}
        </button>
      </div>
    </header>
  );
}
