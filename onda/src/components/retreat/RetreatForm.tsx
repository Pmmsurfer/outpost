"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  defaultFormData,
  type RetreatFormData,
  type ActivityType,
  type SkillLevel,
} from "@/lib/retreat-types";
import { supabase } from "@/lib/supabase";
import { ProgressBar } from "./ProgressBar";
import { FormSection } from "./FormSection";
import { TagInput } from "./TagInput";
import { BulletListInput } from "./BulletListInput";
import { FAQInput } from "./FAQInput";
import { CancellationPolicySelector } from "./CancellationPolicySelector";
import { PhotoUpload } from "./PhotoUpload";

const ACTIVITY_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: "surf", label: "Surf" },
  { value: "yoga", label: "Yoga" },
  { value: "hiking", label: "Hiking" },
  { value: "multi-sport", label: "Multi-sport" },
  { value: "other", label: "Other" },
];

const SKILL_OPTIONS: { value: SkillLevel; label: string }[] = [
  { value: "all-levels", label: "All levels" },
  { value: "beginner", label: "Beginner-friendly" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const today = new Date().toISOString().slice(0, 10);
const MODE_KEY = "retreat_form_mode";
const SECTION_KEYS = {
  listingShowMore: "retreat_form_listing_show_more",
  highlights: "retreat_form_section_highlights",
  faqs: "retreat_form_section_faqs",
  waiver: "retreat_form_section_waiver",
  gallery: "retreat_form_section_gallery",
};

function useStoredMode(): ["quick" | "full", (m: "quick" | "full") => void] {
  const [mode, setModeState] = useState<"quick" | "full">("full");
  useEffect(() => {
    try {
      const stored = localStorage.getItem(MODE_KEY);
      if (stored === "quick" || stored === "full") setModeState(stored);
    } catch {}
  }, []);
  const setMode = useCallback((m: "quick" | "full") => {
    setModeState(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {}
  }, []);
  return [mode, setMode];
}

function useStoredSection(key: string, defaultExpanded: boolean): [boolean, (v: boolean) => void] {
  const [expanded, setExpandedState] = useState(defaultExpanded);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored === "true") setExpandedState(true);
      if (stored === "false") setExpandedState(false);
    } catch {}
  }, [key]);
  const setExpanded = useCallback(
    (v: boolean) => {
      setExpandedState(v);
      try {
        localStorage.setItem(key, String(v));
      } catch {}
    },
    [key]
  );
  return [expanded, setExpanded];
}

function useDebouncedSave(save: () => void, delay: number) {
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;
  return useCallback(() => {
    if (ref.current) clearTimeout(ref.current);
    ref.current = setTimeout(() => saveRef.current(), delay);
  }, [delay]);
}

export function RetreatForm() {
  const router = useRouter();
  const [data, setData] = useState<RetreatFormData>(defaultFormData);
  const [retreatId, setRetreatId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [mode, setMode] = useStoredMode();
  const [listingShowMore, setListingShowMore] = useStoredSection(SECTION_KEYS.listingShowMore, false);
  const [highlightsExpanded, setHighlightsExpanded] = useStoredSection(SECTION_KEYS.highlights, false);
  const [faqsExpanded, setFaqsExpanded] = useStoredSection(SECTION_KEYS.faqs, false);
  const [waiverExpanded, setWaiverExpanded] = useStoredSection(SECTION_KEYS.waiver, false);
  const [galleryExpanded, setGalleryExpanded] = useStoredSection(SECTION_KEYS.gallery, false);

  const buildPayload = useCallback(() => {
    const win = typeof window !== "undefined" ? (window as unknown as Record<string, unknown>) : null;
    const hostId = win?.__hostId != null ? String(win.__hostId) : null;
    return {
      ...(retreatId && { id: retreatId }),
      name: data.name,
      activity_type: data.activity_type,
      location_city: data.location_city,
      location_country: data.location_country,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      capacity: data.capacity ? parseInt(data.capacity, 10) : null,
      contact_email: data.contact_email || null,
      short_description: data.short_description || null,
      full_description: data.full_description || null,
      included: data.included,
      not_included: data.not_included,
      skill_level: data.skill_level,
      typical_day: data.typical_day || null,
      accommodation_notes: data.accommodation_notes || null,
      highlights: data.highlights,
      faqs: data.faqs,
      price: data.price ? parseFloat(data.price) : null,
      currency: data.currency,
      deposit_amount: data.deposit_amount ? parseFloat(data.deposit_amount) : null,
      deposit_type: data.deposit_type,
      balance_due_days: data.balance_due_days ? parseInt(data.balance_due_days, 10) : null,
      cancellation_policy: data.cancellation_policy,
      policy_liability_waiver: data.policy_liability_waiver,
      policy_travel_insurance: data.policy_travel_insurance,
      policy_age_requirement: data.policy_age_requirement,
      policy_age_min: data.policy_age_min ? parseInt(data.policy_age_min, 10) : null,
      policy_custom: data.policy_custom,
      policy_custom_text: data.policy_custom_text || null,
      waiver_required: data.waiver_required,
      waiver_text: data.waiver_text || null,
      cover_image_url: data.cover_image_url || null,
      gallery_urls: data.gallery_urls,
      status: data.status,
      host_id: hostId ?? undefined,
    };
  }, [data, retreatId]);

  const saveToSupabase = useCallback(
    async (status: "draft" | "published") => {
      if (!supabase) {
        setToast("Supabase not configured. Add env vars to enable save.");
        return null;
      }
      setIsSaving(true);
      const win = typeof window !== "undefined" ? (window as unknown as Record<string, unknown>) : null;
      let hostId: string | null = win?.__hostId != null ? String(win.__hostId) : null;
      if (!hostId) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError && typeof console !== "undefined") console.error("Auth check failed:", userError);
        hostId = user?.id ?? null;
        if (win && hostId) win.__hostId = hostId;
      }
      const payload = buildPayload();
      const payloadWithHost = { ...payload, host_id: hostId ?? payload.host_id, status };
      let row: { id?: string } | null = null;
      let error = null;
      if (retreatId) {
        const result = await supabase
          .from("retreats")
          .update(payloadWithHost as Record<string, unknown>)
          .eq("id", retreatId)
          .select("id")
          .single();
        row = result.data;
        error = result.error;
        if (error && typeof console !== "undefined") console.error("Retreat update error:", error);
        if (!error && !row) {
          setToast("Save failed. Make sure you're logged in as the retreat host.");
          setIsSaving(false);
          return null;
        }
      } else {
        if (!hostId) {
          setToast("You must be logged in to create a retreat. Go to Login first.");
          setIsSaving(false);
          return null;
        }
        const result = await supabase
          .from("retreats")
          .insert(payloadWithHost as Record<string, unknown>)
          .select("id")
          .single();
        row = result.data;
        error = result.error;
        if (error && typeof console !== "undefined") console.error("Retreat insert error:", error);
      }
      setIsSaving(false);
      if (error) {
        setToast(error.message);
        return null;
      }
      const id = row?.id;
      if (id) setRetreatId(id);
      return id;
    },
    [buildPayload, retreatId]
  );

  const debouncedSave = useDebouncedSave(() => saveToSupabase("draft"), 800);

  const handleBlur = useCallback(() => {
    debouncedSave();
  }, [debouncedSave]);

  const update = useCallback(<K extends keyof RetreatFormData>(key: K, value: RetreatFormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const basicsOk =
    !!data.name.trim() &&
    !!data.location_city.trim() &&
    !!data.location_country.trim() &&
    !!data.start_date &&
    !!data.end_date &&
    data.start_date <= data.end_date &&
    data.start_date >= today &&
    !!data.capacity &&
    parseInt(data.capacity, 10) >= 1 &&
    !!data.contact_email.trim();

  const listingOk =
    !!data.short_description.trim() &&
    data.short_description.length <= 160 &&
    !!data.full_description.trim() &&
    data.included.length > 0 &&
    !!data.skill_level;

  const priceOk =
    !!data.price &&
    !isNaN(parseFloat(data.price)) &&
    parseFloat(data.price) >= 0 &&
    !!data.cancellation_policy;

  const coverOk = !!data.cover_image_url.trim();

  const requiredChecks = [
    !!data.name.trim(),
    !!data.location_city.trim(),
    !!data.location_country.trim(),
    !!data.start_date,
    !!data.end_date && data.start_date <= data.end_date && data.start_date >= today,
    !!data.capacity && parseInt(data.capacity, 10) >= 1,
    !!data.contact_email.trim(),
    !!data.short_description.trim() && data.short_description.length <= 160,
    !!data.full_description.trim(),
    data.included.length > 0,
    !!data.skill_level,
    !!data.price && !isNaN(parseFloat(data.price)) && parseFloat(data.price) >= 0,
    !!data.cancellation_policy,
    !!data.cover_image_url.trim(),
  ];
  const requiredDone = requiredChecks.filter(Boolean).length;
  const requiredTotal = requiredChecks.length;
  const requiredFieldsLeft = requiredTotal - requiredDone;

  const canPublish = basicsOk && listingOk && priceOk && coverOk;

  const onlyPhotoLeft = !coverOk && requiredDone === requiredTotal - 1;
  const statusMessage =
    requiredFieldsLeft === requiredTotal
      ? "Let's build your retreat"
      : canPublish
        ? "Ready to publish 🎉"
        : onlyPhotoLeft
          ? "Almost there — add a cover photo to publish"
          : `${requiredFieldsLeft} required fields left`;

  const publishLabel = !coverOk
    ? "Add a cover photo to publish"
    : !priceOk && (!data.price || isNaN(parseFloat(data.price)) || parseFloat(data.price) < 0)
      ? "Fill in price to publish"
      : "Publish Retreat";

  const handleSaveDraft = useCallback(async () => {
    const id = await saveToSupabase("draft");
    if (id !== undefined) setToast("Draft saved");
  }, [saveToSupabase]);

  const handlePublish = useCallback(async () => {
    if (!canPublish) return;
    const id = await saveToSupabase("published");
    if (id) router.push(`/dashboard/retreats/${id}`);
  }, [canPublish, saveToSupabase, router]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const inputClass =
    "w-full rounded-lg border border-[#D8D2C4] bg-white px-4 py-2.5 text-sm text-[#1A1A14] placeholder:text-[#8A8478] focus:border-[#4A6741] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/20";
  const labelClass = "block text-sm font-semibold text-[#1A1A14]";

  return (
    <div className="min-h-screen" style={{ background: "#F5F0E8" }}>
      <ProgressBar
        statusMessage={statusMessage}
        publishLabel={publishLabel}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        canPublish={canPublish}
        isSaving={isSaving}
      />

      {/* Mode toggle */}
      <div className="border-b border-[#D8D2C4] px-4 py-4 sm:px-6" style={{ background: "#FDFAF5" }}>
        <div className="mx-auto flex max-w-2xl items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setMode("quick")}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              mode === "quick"
                ? "bg-[#4A6741] text-white"
                : "bg-transparent text-[#8A8478] hover:bg-[#F5F0E8] hover:text-[#1A1A14]"
            }`}
          >
            Quick Publish
          </button>
          <button
            type="button"
            onClick={() => setMode("full")}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              mode === "full"
                ? "bg-[#4A6741] text-white"
                : "bg-transparent text-[#8A8478] hover:bg-[#F5F0E8] hover:text-[#1A1A14]"
            }`}
          >
            Full Listing
          </button>
          {mode === "quick" && (
            <span className="ml-3 text-sm text-[#8A8478]">~5 minutes</span>
          )}
          {mode === "full" && (
            <span className="ml-3 text-sm text-[#8A8478]">~15 minutes</span>
          )}
        </div>
      </div>

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-[#1A1A14] px-6 py-3 text-sm font-medium text-white shadow-lg"
          role="alert"
        >
          {toast}
        </div>
      )}

      <div className="mx-auto max-w-2xl space-y-8 px-4 py-10 pb-24 sm:px-6">
        {/* 1. BASICS */}
        <FormSection title="Basics" required>
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Retreat name</label>
              <input
                type="text"
                value={data.name}
                onChange={(e) => update("name", e.target.value)}
                onBlur={handleBlur}
                placeholder="e.g. 7-Day Surf & Yoga Retreat"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Activity type</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {ACTIVITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update("activity_type", opt.value)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      data.activity_type === opt.value
                        ? "bg-[#4A6741] text-white"
                        : "border border-[#D8D2C4] bg-white text-[#1A1A14] hover:border-[#8A8478]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className={labelClass}>City / region</label>
                <input
                  type="text"
                  value={data.location_city}
                  onChange={(e) => update("location_city", e.target.value)}
                  onBlur={handleBlur}
                  placeholder="e.g. Nosara"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Country</label>
                <input
                  type="text"
                  value={data.location_country}
                  onChange={(e) => update("location_country", e.target.value)}
                  onBlur={handleBlur}
                  placeholder="e.g. Costa Rica"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Start date</label>
                <input
                  type="date"
                  value={data.start_date}
                  min={today}
                  onChange={(e) => update("start_date", e.target.value)}
                  onBlur={handleBlur}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>End date</label>
                <input
                  type="date"
                  value={data.end_date}
                  min={data.start_date || today}
                  onChange={(e) => update("end_date", e.target.value)}
                  onBlur={handleBlur}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Total spots / capacity</label>
              <input
                type="number"
                min={1}
                value={data.capacity}
                onChange={(e) => update("capacity", e.target.value)}
                onBlur={handleBlur}
                placeholder="e.g. 14"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Contact email (for guest inquiries)</label>
              <input
                type="email"
                value={data.contact_email}
                onChange={(e) => update("contact_email", e.target.value)}
                onBlur={handleBlur}
                placeholder="hello@example.com"
                className={inputClass}
              />
            </div>
          </div>
        </FormSection>

        {/* 2. LISTING COPY */}
        <FormSection
          title="Listing copy"
          subtitle="The hook and full description for the public retreat page."
          required
        >
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Short description (max 160 chars)</label>
              <textarea
                value={data.short_description}
                onChange={(e) => update("short_description", e.target.value.slice(0, 160))}
                onBlur={handleBlur}
                rows={2}
                maxLength={160}
                placeholder="One line hook for listing cards"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-[#8A8478]">{data.short_description.length}/160</p>
            </div>
            <div>
              <label className={labelClass}>Full description</label>
              <textarea
                value={data.full_description}
                onChange={(e) => update("full_description", e.target.value)}
                onBlur={handleBlur}
                rows={6}
                placeholder="Full copy for the retreat page..."
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>What&apos;s included</label>
              <TagInput
                value={data.included}
                onChange={(v) => update("included", v)}
                placeholder="e.g. Surf lessons, Airport transfer"
              />
            </div>
            {mode === "full" && (
              <div>
                <label className={labelClass}>What&apos;s not included</label>
                <TagInput
                  value={data.not_included}
                  onChange={(v) => update("not_included", v)}
                  placeholder="e.g. Flights, Travel insurance"
                />
              </div>
            )}
            <div>
              <label className={labelClass}>Skill level</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {SKILL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update("skill_level", opt.value)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      data.skill_level === opt.value
                        ? "bg-[#4A6741] text-white"
                        : "border border-[#D8D2C4] bg-white text-[#1A1A14] hover:border-[#8A8478]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {mode === "full" && (
              <>
                <button
                  type="button"
                  onClick={() => setListingShowMore(!listingShowMore)}
                  className="mt-4 flex items-center gap-2 text-sm font-medium text-[#4A6741] hover:underline"
                >
                  {listingShowMore ? "Show less" : "Show more details ↓"}
                </button>
                {listingShowMore && (
                  <>
                    <div className="mt-6">
                      <label className={labelClass}>Typical day (optional)</label>
                      <textarea
                        value={data.typical_day}
                        onChange={(e) => update("typical_day", e.target.value)}
                        onBlur={handleBlur}
                        rows={3}
                        placeholder="Sample daily schedule..."
                        className={inputClass}
                      />
                    </div>
                    <div className="mt-6">
                      <label className={labelClass}>Accommodation notes (optional)</label>
                      <input
                        type="text"
                        value={data.accommodation_notes}
                        onChange={(e) => update("accommodation_notes", e.target.value)}
                        onBlur={handleBlur}
                        placeholder="e.g. Pick your room when you book."
                        className={inputClass}
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </FormSection>

        {/* 3. TRIP HIGHLIGHTS — only in Full mode; collapsible */}
        {mode === "full" && (
          <FormSection
            title="Trip highlights"
            subtitle="Highlights are shown prominently on the public retreat page."
            collapsible
            expanded={highlightsExpanded}
            onToggle={() => setHighlightsExpanded(!highlightsExpanded)}
            collapsedLabel="+ Add trip highlights"
            doneSummary={data.highlights.length > 0 ? `${data.highlights.length} highlights added ✓` : undefined}
            showDoneBadge={highlightsExpanded && data.highlights.length > 0}
          >
            <BulletListInput value={data.highlights} onChange={(v) => update("highlights", v)} placeholder="Add a highlight" />
          </FormSection>
        )}

        {/* 4. FAQs — only in Full mode; collapsible */}
        {mode === "full" && (
          <FormSection
            title="FAQs"
            subtitle="FAQs are shown at the bottom of the public retreat page."
            collapsible
            expanded={faqsExpanded}
            onToggle={() => setFaqsExpanded(!faqsExpanded)}
            collapsedLabel="+ Add FAQs"
            doneSummary={data.faqs.length > 0 ? `${data.faqs.length} FAQs added ✓` : undefined}
            showDoneBadge={faqsExpanded && data.faqs.length > 0}
          >
            <FAQInput value={data.faqs} onChange={(v) => update("faqs", v)} />
          </FormSection>
        )}

        {/* 5. PAYMENT & CANCELLATION */}
        <FormSection title="Payment & cancellation" required>
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div>
                <label className={labelClass}>Price per person</label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={data.price}
                  onChange={(e) => update("price", e.target.value)}
                  onBlur={handleBlur}
                  placeholder="e.g. 1890"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Currency</label>
                <select
                  value={data.currency}
                  onChange={(e) => update("currency", e.target.value)}
                  onBlur={handleBlur}
                  className={inputClass}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Deposit amount (optional)</label>
                <input
                  type="number"
                  min={0}
                  value={data.deposit_amount}
                  onChange={(e) => update("deposit_amount", e.target.value)}
                  onBlur={handleBlur}
                  placeholder={data.deposit_type === "percent" ? "e.g. 25" : "e.g. 500"}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Deposit type</label>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => update("deposit_type", "flat")}
                    className={`rounded-lg px-3 py-2 text-sm font-medium ${data.deposit_type === "flat" ? "bg-[#4A6741] text-white" : "border border-[#D8D2C4] bg-white text-[#1A1A14]"}`}
                  >
                    Flat
                  </button>
                  <button
                    type="button"
                    onClick={() => update("deposit_type", "percent")}
                    className={`rounded-lg px-3 py-2 text-sm font-medium ${data.deposit_type === "percent" ? "bg-[#4A6741] text-white" : "border border-[#D8D2C4] bg-white text-[#1A1A14]"}`}
                  >
                    %
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>Balance due (optional)</label>
              <input
                type="text"
                value={data.balance_due_days}
                onChange={(e) => update("balance_due_days", e.target.value)}
                onBlur={handleBlur}
                placeholder="e.g. 30 days before retreat start"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Cancellation policy</label>
              <CancellationPolicySelector value={data.cancellation_policy} onChange={(v) => update("cancellation_policy", v)} />
            </div>
          </div>
        </FormSection>

        {/* 6. WAIVER & POLICIES — only in Full mode; collapsible */}
        {mode === "full" && (
          <FormSection
            title="Waiver & policies"
            subtitle="Checkboxes guests must agree to at booking."
            collapsible
            expanded={waiverExpanded}
            onToggle={() => setWaiverExpanded(!waiverExpanded)}
            collapsedLabel="+ Add waiver & policies"
            doneSummary={
              data.policy_liability_waiver ||
              data.policy_travel_insurance ||
              data.policy_age_requirement ||
              data.policy_custom ||
              data.waiver_required
                ? "Policies configured ✓"
                : undefined
            }
            showDoneBadge={
              waiverExpanded &&
              (data.policy_liability_waiver ||
                data.policy_travel_insurance ||
                data.policy_age_requirement ||
                data.policy_custom ||
                data.waiver_required)
            }
          >
          <div className="space-y-6">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={data.policy_liability_waiver}
                onChange={(e) => update("policy_liability_waiver", e.target.checked)}
                onBlur={handleBlur}
                className="h-4 w-4 rounded border-[#D8D2C4] text-[#4A6741] focus:ring-[#4A6741]/20"
              />
              <span className="text-sm text-[#1A1A14]">Liability waiver</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={data.policy_travel_insurance}
                onChange={(e) => update("policy_travel_insurance", e.target.checked)}
                onBlur={handleBlur}
                className="h-4 w-4 rounded border-[#D8D2C4] text-[#4A6741] focus:ring-[#4A6741]/20"
              />
              <span className="text-sm text-[#1A1A14]">Travel insurance recommended</span>
            </label>
            <div>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={data.policy_age_requirement}
                  onChange={(e) => update("policy_age_requirement", e.target.checked)}
                  onBlur={handleBlur}
                  className="h-4 w-4 rounded border-[#D8D2C4] text-[#4A6741] focus:ring-[#4A6741]/20"
                />
                <span className="text-sm text-[#1A1A14]">Age requirement</span>
              </label>
              {data.policy_age_requirement && (
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={data.policy_age_min}
                  onChange={(e) => update("policy_age_min", e.target.value)}
                  onBlur={handleBlur}
                  placeholder="Min age"
                  className="mt-2 w-24 rounded-lg border border-[#D8D2C4] bg-white px-3 py-2 text-sm"
                />
              )}
            </div>
            <div>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={data.policy_custom}
                  onChange={(e) => update("policy_custom", e.target.checked)}
                  onBlur={handleBlur}
                  className="h-4 w-4 rounded border-[#D8D2C4] text-[#4A6741] focus:ring-[#4A6741]/20"
                />
                <span className="text-sm text-[#1A1A14]">Custom policy</span>
              </label>
              {data.policy_custom && (
                <textarea
                  value={data.policy_custom_text}
                  onChange={(e) => update("policy_custom_text", e.target.value)}
                  onBlur={handleBlur}
                  rows={3}
                  placeholder="Paste or type policy text"
                  className="mt-2 w-full rounded-lg border border-[#D8D2C4] bg-white px-4 py-2.5 text-sm"
                />
              )}
            </div>
            <div>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={data.waiver_required}
                  onChange={(e) => update("waiver_required", e.target.checked)}
                  onBlur={handleBlur}
                  className="h-4 w-4 rounded border-[#D8D2C4] text-[#4A6741] focus:ring-[#4A6741]/20"
                />
                <span className="text-sm text-[#1A1A14]">Require guests to sign a full waiver document</span>
              </label>
              {data.waiver_required && (
                <div className="mt-4 space-y-2">
                  <textarea
                    value={data.waiver_text}
                    onChange={(e) => update("waiver_text", e.target.value)}
                    onBlur={handleBlur}
                    rows={6}
                    placeholder="Paste waiver text or leave blank to use Outpost default"
                    className="w-full rounded-lg border border-[#D8D2C4] bg-white px-4 py-2.5 text-sm"
                  />
                  <button
                    type="button"
                    className="text-sm font-semibold text-[#4A6741] hover:underline"
                  >
                    Use Outpost default waiver
                  </button>
                </div>
              )}
            </div>
          </div>
        </FormSection>
        )}

        {/* 7. PHOTOS — cover always visible; gallery collapsible in Full mode */}
        <FormSection title="Photos" subtitle="Cover photo required; gallery optional." required>
          <PhotoUpload
            coverUrl={data.cover_image_url}
            galleryUrls={data.gallery_urls}
            onCoverChange={(url) => update("cover_image_url", url)}
            onGalleryChange={(urls) => update("gallery_urls", urls)}
            retreatId={retreatId}
            disabled={isSaving}
            galleryCollapsed={!galleryExpanded}
            onGalleryExpand={() => setGalleryExpanded(true)}
          />
        </FormSection>

        {/* Bottom CTA — Quick mode shows hint; Full mode shows status + Publish */}
        <div className="rounded-2xl border border-[#D8D2C4] p-6" style={{ background: "#FDFAF5" }}>
          {mode === "quick" && (
            <p className="mb-4 text-sm text-[#8A8478]">You can add highlights, FAQs, and more photos later from your retreat page.</p>
          )}
          <p className="mb-3 text-sm font-medium text-[#1A1A14]">
            {!coverOk ? "Add a cover photo to publish" : !priceOk && (!data.price || isNaN(parseFloat(data.price)) || parseFloat(data.price) < 0) ? "Fill in price to publish" : canPublish ? "Ready to publish" : `${requiredFieldsLeft} required fields left`}
          </p>
          <button
            type="button"
            onClick={handlePublish}
            disabled={!canPublish || isSaving}
            className="rounded-lg bg-[#4A6741] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6B8F62] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {publishLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
