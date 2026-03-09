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
      className="sticky top-0 z-50 flex flex-col gap-3 border-b border-[#D8D2C4] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6"
      style={{ background: "#FDFAF5" }}
    >
      <h1 className="font-serif text-lg sm:text-xl text-[#1A1A14]">Create Retreat</h1>
      <div className="flex flex-1 items-center justify-center order-3 sm:order-2 min-w-0">
        <p className="text-sm font-medium text-[#1A1A14] text-center truncate">{statusMessage}</p>
      </div>
      <div className="flex items-stretch gap-3 order-2 sm:order-3">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isSaving}
          className="min-h-[44px] flex-1 sm:flex-initial rounded-lg border border-[#D8D2C4] bg-transparent px-4 py-2.5 text-sm font-semibold text-[#1A1A14] transition-colors hover:bg-[#F5F0E8] disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save draft"}
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={!canPublish || isSaving}
          className="min-h-[44px] flex-1 sm:flex-initial rounded-lg bg-[#4A6741] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6B8F62] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {publishLabel}
        </button>
      </div>
    </header>
  );
}
