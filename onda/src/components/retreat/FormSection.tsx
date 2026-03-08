"use client";

interface FormSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  required?: boolean;
  /** When true, section can be collapsed. Renders collapsed state or expanded content. */
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  /** Shown in collapsed state when no content (e.g. "+ Add trip highlights") */
  collapsedLabel?: string;
  /** Shown in collapsed state when section has content (e.g. "3 highlights added ✓") */
  doneSummary?: string;
  /** When true and expanded, show "✓ Done" badge in top right */
  showDoneBadge?: boolean;
}

export function FormSection({
  title,
  subtitle,
  children,
  required,
  collapsible = false,
  expanded = true,
  onToggle,
  collapsedLabel,
  doneSummary,
  showDoneBadge = false,
}: FormSectionProps) {
  const hasContent = !!doneSummary;

  if (collapsible && !expanded) {
    return (
      <section
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onToggle?.()}
        className="rounded-xl border border-dashed border-[#D8D2C4] bg-[#FDFAF5]/60 px-6 py-5 transition-colors hover:border-[#4A6741]/50 hover:bg-[#F5F0E8]/50"
      >
        <span className="font-medium text-[#4A6741]">
          {hasContent ? doneSummary : collapsedLabel}
        </span>
      </section>
    );
  }

  return (
    <section
      className="relative rounded-2xl border border-[#D8D2C4] p-6"
      style={{ background: "#FDFAF5" }}
    >
      {showDoneBadge && (
        <span className="absolute right-6 top-6 rounded-full bg-[#E8F5E6] px-2.5 py-1 text-xs font-semibold text-[#4A6741]">
          ✓ Done
        </span>
      )}
      <h2 className="font-serif text-lg text-[#1A1A14] pr-20">
        {title}
        {required && <span className="ml-1 text-[#C4793A]">*</span>}
      </h2>
      {subtitle && <p className="mt-1 text-sm text-[#8A8478]">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}
