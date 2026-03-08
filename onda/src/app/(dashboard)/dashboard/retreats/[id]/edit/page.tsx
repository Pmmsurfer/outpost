"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { mockRetreats } from "@/lib/bookings";
import { getRetreatDetail } from "@/lib/retreatDetails";
import {
  mockAccommodationTypes,
  mockActivityOptions,
  mockConsentCheckboxes,
} from "@/lib/retreats";
import { supabase } from "@/lib/supabase";
import { PhotoUpload } from "@/components/retreat/PhotoUpload";

type Highlight = { id: string; title: string; body: string };
type Faq = { id: string; question: string; answer: string };
type AccommodationRow = { id: string; name: string; capacity: string; priceDollars: string };
type ConsentRow = { id: string; label: string; required: boolean };

function nextId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildInitialState(retreatId: string) {
  const retreat = mockRetreats.find((r) => r.id === retreatId);
  const detail = getRetreatDetail(retreatId);
  const acc = mockAccommodationTypes.filter((a) => a.retreatId === retreatId);
  const acts = mockActivityOptions.filter((a) => a.retreatId === retreatId);
  const cons = mockConsentCheckboxes.filter((c) => c.retreatId === retreatId);

  return {
    name: retreat?.name ?? "",
    location: detail?.location ?? "",
    startDate: retreat?.startDate ?? "",
    endDate: retreat?.endDate ?? "",
    depositDollars: retreat?.depositCents != null ? String(retreat.depositCents / 100) : "",
    balanceDueDays: retreat?.balanceDueDaysBeforeStart != null ? String(retreat.balanceDueDaysBeforeStart) : "",
    contactEmail: (detail as { contactEmail?: string })?.contactEmail ?? "",
    description: detail?.description ?? "",
    whatIncluded: Array.isArray(detail?.whatIncluded) ? (detail.whatIncluded as string[]).join("\n") : "",
    typicalDay: detail?.typicalDay ?? "",
    accommodationNote: detail?.accommodationNote ?? "",
    highlights: (detail?.highlights ?? []).map((h: { title: string; body: string }) => ({
      id: nextId("hl"),
      title: h.title,
      body: h.body,
    })),
    faqs: (detail?.faqs ?? []).map((f: { question: string; answer: string }) => ({
      id: nextId("faq"),
      question: f.question,
      answer: f.answer,
    })),
    depositPolicy: detail?.depositPolicy ?? "",
    cancellationPolicy: detail?.cancellationPolicy ?? "",
    covidPolicy: detail?.covidPolicy ?? "",
    accommodations:
      acc.length > 0
        ? acc.map((a) => ({
            id: a.id,
            name: a.name,
            capacity: String(a.capacity),
            priceDollars: String(a.priceCents / 100),
          }))
        : [{ id: nextId("room"), name: "", capacity: "", priceDollars: "" }],
    activityLabels: acts.map((a) => a.label).join("\n"),
    consents: cons.map((c) => ({ id: c.id, label: c.label, required: c.required })),
    coverImageUrl: "",
    galleryUrls: [] as string[],
  };
}

/** Build form initial state from a Supabase retreat row (for retreats not in mock). */
function buildInitialStateFromSupabase(row: Record<string, unknown>) {
  const loc = [row.location_city, row.location_country].filter(Boolean).join(", ");
  const included = Array.isArray(row.included) ? (row.included as string[]).join("\n") : "";
  const highlights = Array.isArray(row.highlights)
    ? (row.highlights as { title?: string; body?: string }[]).map((h) => ({
        id: nextId("hl"),
        title: h?.title ?? "",
        body: h?.body ?? "",
      }))
    : [];
  const faqsRaw = Array.isArray(row.faqs) ? row.faqs : [];
  const faqs = (faqsRaw as { question?: string; answer?: string }[]).map((f) => ({
    id: nextId("faq"),
    question: f?.question ?? "",
    answer: f?.answer ?? "",
  }));
  const depositAmount = typeof row.deposit_amount === "number" ? row.deposit_amount : null;
  return {
    name: String(row.name ?? ""),
    location: loc,
    startDate: row.start_date != null ? String(row.start_date) : "",
    endDate: row.end_date != null ? String(row.end_date) : "",
    depositDollars: depositAmount != null ? String(depositAmount) : "",
    balanceDueDays: row.balance_due_days != null ? String(row.balance_due_days) : "",
    contactEmail: String(row.contact_email ?? ""),
    description: String(row.short_description ?? row.full_description ?? ""),
    whatIncluded: included,
    typicalDay: String(row.typical_day ?? ""),
    accommodationNote: String(row.accommodation_notes ?? ""),
    highlights: highlights.length ? highlights : [{ id: nextId("hl"), title: "", body: "" }],
    faqs: faqs.length ? faqs : [{ id: nextId("faq"), question: "", answer: "" }],
    depositPolicy: "",
    cancellationPolicy: String(row.cancellation_policy ?? ""),
    covidPolicy: String(row.covid_policy ?? ""),
    accommodations: [{ id: nextId("room"), name: "", capacity: "", priceDollars: "" }],
    activityLabels: "",
    consents: [] as ConsentRow[],
    coverImageUrl: String(row.cover_image_url ?? ""),
    galleryUrls: Array.isArray(row.gallery_urls) ? (row.gallery_urls as string[]) : [],
  };
}

export default function EditRetreatPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const retreatFromMock = mockRetreats.find((r) => r.id === id);
  const [supabaseRow, setSupabaseRow] = useState<Record<string, unknown> | null>(null);
  const [loadingSupabase, setLoadingSupabase] = useState(!retreatFromMock && !!id);

  const retreat = retreatFromMock ?? (supabaseRow ? { id, name: String(supabaseRow.name), startDate: String(supabaseRow.start_date ?? ""), endDate: String(supabaseRow.end_date ?? "") } : null);

  const initialState = useMemo(() => buildInitialState(id), [id]);

  const [name, setName] = useState(initialState.name);
  const [location, setLocation] = useState(initialState.location);
  const [startDate, setStartDate] = useState(initialState.startDate);
  const [endDate, setEndDate] = useState(initialState.endDate);
  const [depositDollars, setDepositDollars] = useState(initialState.depositDollars);
  const [balanceDueDays, setBalanceDueDays] = useState(initialState.balanceDueDays);
  const [contactEmail, setContactEmail] = useState(initialState.contactEmail);
  const [description, setDescription] = useState(initialState.description);
  const [whatIncluded, setWhatIncluded] = useState(initialState.whatIncluded);
  const [typicalDay, setTypicalDay] = useState(initialState.typicalDay);
  const [accommodationNote, setAccommodationNote] = useState(initialState.accommodationNote);
  const [highlights, setHighlights] = useState<Highlight[]>(initialState.highlights);
  const [faqs, setFaqs] = useState<Faq[]>(initialState.faqs);
  const [depositPolicy, setDepositPolicy] = useState(initialState.depositPolicy);
  const [cancellationPolicy, setCancellationPolicy] = useState(initialState.cancellationPolicy);
  const [covidPolicy, setCovidPolicy] = useState(initialState.covidPolicy);
  const [accommodations, setAccommodations] = useState<AccommodationRow[]>(initialState.accommodations);
  const [activityLabels, setActivityLabels] = useState(initialState.activityLabels);
  const [consents, setConsents] = useState<ConsentRow[]>(initialState.consents);
  const [coverImageUrl, setCoverImageUrl] = useState(initialState.coverImageUrl);
  const [galleryUrls, setGalleryUrls] = useState<string[]>(initialState.galleryUrls);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [savingPhotos, setSavingPhotos] = useState(false);
  const [photoToast, setPhotoToast] = useState<string | null>(null);

  useEffect(() => {
    if (retreatFromMock || !id || !supabase) {
      if (!retreatFromMock && id) setLoadingSupabase(false);
      return;
    }
    let mounted = true;
    supabase
      .from("retreats")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (!mounted) return;
        setLoadingSupabase(false);
        if (!error && data) setSupabaseRow(data as Record<string, unknown>);
      });
    return () => { mounted = false; };
  }, [id, retreatFromMock]);

  useEffect(() => {
    if (!supabaseRow) return;
    const s = buildInitialStateFromSupabase(supabaseRow);
    setName(s.name);
    setLocation(s.location);
    setStartDate(s.startDate);
    setEndDate(s.endDate);
    setDepositDollars(s.depositDollars);
    setBalanceDueDays(s.balanceDueDays);
    setContactEmail(s.contactEmail);
    setDescription(s.description);
    setWhatIncluded(s.whatIncluded);
    setTypicalDay(s.typicalDay);
    setAccommodationNote(s.accommodationNote);
    setHighlights(s.highlights);
    setFaqs(s.faqs);
    setDepositPolicy(s.depositPolicy);
    setCancellationPolicy(s.cancellationPolicy);
    setCovidPolicy(s.covidPolicy);
    setAccommodations(s.accommodations);
    setActivityLabels(s.activityLabels);
    setConsents(s.consents);
    setCoverImageUrl(s.coverImageUrl);
    setGalleryUrls(s.galleryUrls);
  }, [supabaseRow]);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    if (hash === "accommodation" || hash === "activities" || hash === "photos") {
      const el = document.getElementById(hash);
      el?.scrollIntoView({ behavior: "smooth" });
    }
  }, [supabaseRow]);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    if (hash === "accommodation" || hash === "activities" || hash === "photos") {
      const el = document.getElementById(hash);
      el?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  if (loadingSupabase && !retreat) {
    return (
      <div>
        <p className="text-warm-gray">Loading retreat…</p>
        <Link href="/dashboard/retreats" className="mt-4 inline-block font-semibold text-sage hover:underline">
          ← My Retreats
        </Link>
      </div>
    );
  }

  if (!retreat) {
    return (
      <div>
        <p className="text-warm-gray">Retreat not found.</p>
        <Link href="/dashboard/retreats" className="mt-4 inline-block font-semibold text-sage hover:underline">
          ← My Retreats
        </Link>
      </div>
    );
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Retreat name is required.";
    if (!location.trim()) next.location = "Location is required.";
    if (!startDate) next.startDate = "Start date is required.";
    if (!endDate) next.endDate = "End date is required.";
    if (startDate && endDate && endDate < startDate) next.endDate = "End date must be on or after start date.";
    if (depositDollars.trim()) {
      const d = parseFloat(depositDollars);
      if (isNaN(d) || d < 0) next.depositDollars = "Enter a valid amount (e.g. 500).";
    }
    if (balanceDueDays.trim()) {
      const n = parseInt(balanceDueDays, 10);
      if (isNaN(n) || n < 1 || n > 365) next.balanceDueDays = "Enter 1–365.";
    }
    const completeRooms = accommodations.filter((r) => {
      const cap = parseInt(r.capacity, 10);
      const price = parseFloat(r.priceDollars);
      return r.name.trim() && r.capacity !== "" && !isNaN(cap) && cap >= 1 && r.priceDollars !== "" && !isNaN(price) && price >= 0;
    });
    if (completeRooms.length === 0) next.accommodations = "Add at least one room type with name, capacity, and price.";
    accommodations.forEach((r) => {
      const hasAny = r.name.trim() || r.capacity !== "" || r.priceDollars !== "";
      if (!hasAny) return;
      if (!r.name.trim()) next[`room-name-${r.id}`] = "Room name required.";
      const cap = parseInt(r.capacity, 10);
      if (!r.capacity || isNaN(cap) || cap < 1) next[`room-cap-${r.id}`] = "Capacity ≥ 1.";
      const price = parseFloat(r.priceDollars);
      if (r.priceDollars !== "" && (isNaN(price) || price < 0)) next[`room-price-${r.id}`] = "Valid price.";
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSavePhotos() {
    if (!supabase || !id || savingPhotos) return;
    setSavingPhotos(true);
    setPhotoToast(null);
    const { data, error } = await supabase
      .from("retreats")
      .update({
        cover_image_url: coverImageUrl.trim() || null,
        gallery_urls: Array.isArray(galleryUrls) ? galleryUrls : [],
      })
      .eq("id", id)
      .select("id")
      .maybeSingle();
    setSavingPhotos(false);
    if (error) {
      setPhotoToast(error.message);
      return;
    }
    if (!data) {
      setPhotoToast("Could not save. Make sure you're the retreat host.");
      return;
    }
    setPhotoToast("Photos saved.");
    setTimeout(() => setPhotoToast(null), 3000);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || submitting) return;
    setSubmitting(true);
    setTimeout(() => router.push(`/dashboard/retreats/${id}?updated=1`), 400);
  }

  const inputClass =
    "mt-2 w-full rounded-lg border border-onda-border bg-white px-4 py-3 text-sm text-ink placeholder:text-warm-gray focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20";
  const labelClass = "block text-sm font-semibold text-ink";

  return (
    <div className="flex flex-col px-4 sm:px-0">
      <Link href={`/dashboard/retreats/${id}`} className="mb-6 inline-block text-sm font-semibold text-sage hover:underline">
        ← Manage retreat
      </Link>
      <h1 className="font-serif text-[24px] sm:text-[28px] tracking-tight text-ink">Edit retreat</h1>
      <p className="mt-2 text-warm-gray">
        Update what guests see and what they complete at registration.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 sm:mt-8 max-w-2xl space-y-8 sm:space-y-10">
        <section className="rounded-2xl border border-onda-border bg-card-bg p-4 sm:p-6">
          <h2 className="font-serif text-lg text-ink">Basics</h2>
          <p className="mt-1 text-sm text-warm-gray">Name, location, dates, and payment terms.</p>
          <div className="mt-6 space-y-6">
            <div>
              <label htmlFor="name" className={labelClass}>Retreat name</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 7-Day Surf & Yoga Retreat" className={inputClass} />
              {errors.name && <p className="mt-1.5 text-sm text-clay">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="location" className={labelClass}>Location</label>
              <input id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Nosara, Costa Rica" className={inputClass} />
              {errors.location && <p className="mt-1.5 text-sm text-clay">{errors.location}</p>}
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="startDate" className={labelClass}>Start date</label>
                <input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
                {errors.startDate && <p className="mt-1.5 text-sm text-clay">{errors.startDate}</p>}
              </div>
              <div>
                <label htmlFor="endDate" className={labelClass}>End date</label>
                <input id="endDate" type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
                {errors.endDate && <p className="mt-1.5 text-sm text-clay">{errors.endDate}</p>}
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="depositDollars" className={labelClass}>Deposit (USD, optional)</label>
                <input id="depositDollars" type="number" min={0} step={50} value={depositDollars} onChange={(e) => setDepositDollars(e.target.value)} placeholder="e.g. 500" className={inputClass} />
                {errors.depositDollars && <p className="mt-1.5 text-sm text-clay">{errors.depositDollars}</p>}
              </div>
              <div>
                <label htmlFor="balanceDueDays" className={labelClass}>Balance due (days before start, optional)</label>
                <input id="balanceDueDays" type="number" min={1} max={365} value={balanceDueDays} onChange={(e) => setBalanceDueDays(e.target.value)} placeholder="e.g. 60" className={inputClass} />
                {errors.balanceDueDays && <p className="mt-1.5 text-sm text-clay">{errors.balanceDueDays}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="contactEmail" className={labelClass}>Contact email</label>
              <input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="hello@example.com" className={inputClass} />
              <p className="mt-1.5 text-xs text-warm-gray">Shown on the retreat page for questions.</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-onda-border bg-card-bg p-4 sm:p-6">
          <h2 className="font-serif text-lg text-ink">Listing copy</h2>
          <p className="mt-1 text-sm text-warm-gray">Description and what&apos;s included on the public retreat page.</p>
          <div className="mt-6 space-y-6">
            <div>
              <label htmlFor="description" className={labelClass}>Description</label>
              <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="A short paragraph about the retreat..." className={inputClass} />
            </div>
            <div>
              <label htmlFor="whatIncluded" className={labelClass}>What&apos;s included</label>
              <textarea id="whatIncluded" value={whatIncluded} onChange={(e) => setWhatIncluded(e.target.value)} rows={4} placeholder="One item per line" className={inputClass} />
            </div>
            <div>
              <label htmlFor="typicalDay" className={labelClass}>A typical day (optional)</label>
              <textarea id="typicalDay" value={typicalDay} onChange={(e) => setTypicalDay(e.target.value)} rows={3} placeholder="Morning yoga, then breakfast..." className={inputClass} />
            </div>
            <div>
              <label htmlFor="accommodationNote" className={labelClass}>Accommodation note (optional)</label>
              <input id="accommodationNote" type="text" value={accommodationNote} onChange={(e) => setAccommodationNote(e.target.value)} placeholder="e.g. Pick your room when you book." className={inputClass} />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-onda-border bg-card-bg p-4 sm:p-6">
          <h2 className="font-serif text-lg text-ink">Trip highlights</h2>
          <p className="mt-1 text-sm text-warm-gray">Title + short body for each highlight.</p>
          <div className="mt-6 space-y-4">
            {highlights.map((h) => (
              <div key={h.id} className="flex flex-wrap gap-3 rounded-lg border border-onda-border bg-cream/30 p-4">
                <input type="text" value={h.title} onChange={(e) => setHighlights((prev) => prev.map((x) => (x.id === h.id ? { ...x, title: e.target.value } : x)))} placeholder="Title" className="flex-1 min-w-[120px] rounded-lg border border-onda-border bg-white px-3 py-2 text-sm" />
                <input type="text" value={h.body} onChange={(e) => setHighlights((prev) => prev.map((x) => (x.id === h.id ? { ...x, body: e.target.value } : x)))} placeholder="Body" className="flex-[2] min-w-[160px] rounded-lg border border-onda-border bg-white px-3 py-2 text-sm" />
                <button type="button" onClick={() => setHighlights((prev) => prev.filter((x) => x.id !== h.id))} className="text-sm font-medium text-warm-gray hover:text-clay">Remove</button>
              </div>
            ))}
            <button type="button" onClick={() => setHighlights((prev) => [...prev, { id: nextId("hl"), title: "", body: "" }])} className="text-sm font-semibold text-sage hover:underline">+ Add highlight</button>
          </div>
        </section>

        <section className="rounded-2xl border border-onda-border bg-card-bg p-4 sm:p-6">
          <h2 className="font-serif text-lg text-ink">FAQs</h2>
          <p className="mt-1 text-sm text-warm-gray">Question and answer pairs shown on the retreat page.</p>
          <div className="mt-6 space-y-4">
            {faqs.map((f) => (
              <div key={f.id} className="flex flex-wrap gap-3 rounded-lg border border-onda-border bg-cream/30 p-4">
                <input type="text" value={f.question} onChange={(e) => setFaqs((prev) => prev.map((x) => (x.id === f.id ? { ...x, question: e.target.value } : x)))} placeholder="Question" className="flex-1 min-w-[140px] rounded-lg border border-onda-border bg-white px-3 py-2 text-sm" />
                <input type="text" value={f.answer} onChange={(e) => setFaqs((prev) => prev.map((x) => (x.id === f.id ? { ...x, answer: e.target.value } : x)))} placeholder="Answer" className="flex-[2] min-w-[160px] rounded-lg border border-onda-border bg-white px-3 py-2 text-sm" />
                <button type="button" onClick={() => setFaqs((prev) => prev.filter((x) => x.id !== f.id))} className="text-sm font-medium text-warm-gray hover:text-clay">Remove</button>
              </div>
            ))}
            <button type="button" onClick={() => setFaqs((prev) => [...prev, { id: nextId("faq"), question: "", answer: "" }])} className="text-sm font-semibold text-sage hover:underline">+ Add FAQ</button>
          </div>
        </section>

        <section className="rounded-2xl border border-onda-border bg-card-bg p-4 sm:p-6">
          <h2 className="font-serif text-lg text-ink">Payment & cancellation</h2>
          <p className="mt-1 text-sm text-warm-gray">Shown in the Payment & cancellation section and optionally as COVID note.</p>
          <div className="mt-6 space-y-6">
            <div>
              <label htmlFor="depositPolicy" className={labelClass}>Deposit policy (optional)</label>
              <input id="depositPolicy" type="text" value={depositPolicy} onChange={(e) => setDepositPolicy(e.target.value)} placeholder="e.g. $500 non-refundable deposit; balance invoiced 60 days before start." className={inputClass} />
            </div>
            <div>
              <label htmlFor="cancellationPolicy" className={labelClass}>Cancellation policy (optional)</label>
              <input id="cancellationPolicy" type="text" value={cancellationPolicy} onChange={(e) => setCancellationPolicy(e.target.value)} placeholder="e.g. Deposit non-refundable; balance refunds up to 30 days before." className={inputClass} />
            </div>
            <div>
              <label htmlFor="covidPolicy" className={labelClass}>COVID-19 policy (optional)</label>
              <input id="covidPolicy" type="text" value={covidPolicy} onChange={(e) => setCovidPolicy(e.target.value)} placeholder="e.g. Negative test within 48 hours of arrival required." className={inputClass} />
            </div>
          </div>
        </section>

        <section id="accommodation" className="rounded-2xl border border-onda-border bg-card-bg p-4 sm:p-6 scroll-mt-4">
          <h2 className="font-serif text-lg text-ink">Rooms & pricing</h2>
          <p className="mt-1 text-sm text-warm-gray">Room types guests can choose at registration. At least one required.</p>
          {errors.accommodations && <p className="mt-2 text-sm text-clay">{errors.accommodations}</p>}
          <div className="mt-6 space-y-4">
            {accommodations.map((r) => (
              <div key={r.id} className="grid gap-4 rounded-lg border border-onda-border bg-cream/30 p-4 sm:grid-cols-[1fr_80px_100px_auto]">
                <div>
                  <input type="text" value={r.name} onChange={(e) => setAccommodations((prev) => prev.map((x) => (x.id === r.id ? { ...x, name: e.target.value } : x)))} placeholder="Room type name" className="w-full rounded-lg border border-onda-border bg-white px-3 py-2 text-sm" />
                  {errors[`room-name-${r.id}`] && <p className="mt-1 text-xs text-clay">{errors[`room-name-${r.id}`]}</p>}
                </div>
                <div>
                  <input type="number" min={1} value={r.capacity} onChange={(e) => setAccommodations((prev) => prev.map((x) => (x.id === r.id ? { ...x, capacity: e.target.value } : x)))} placeholder="Cap." className="w-full rounded-lg border border-onda-border bg-white px-3 py-2 text-sm" />
                  {errors[`room-cap-${r.id}`] && <p className="mt-1 text-xs text-clay">{errors[`room-cap-${r.id}`]}</p>}
                </div>
                <div>
                  <input type="number" min={0} step={50} value={r.priceDollars} onChange={(e) => setAccommodations((prev) => prev.map((x) => (x.id === r.id ? { ...x, priceDollars: e.target.value } : x)))} placeholder="Price $" className="w-full rounded-lg border border-onda-border bg-white px-3 py-2 text-sm" />
                  {errors[`room-price-${r.id}`] && <p className="mt-1 text-xs text-clay">{errors[`room-price-${r.id}`]}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setAccommodations((prev) => prev.filter((x) => x.id !== r.id))} className="text-sm font-medium text-warm-gray hover:text-clay">Remove</button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setAccommodations((prev) => [...prev, { id: nextId("room"), name: "", capacity: "", priceDollars: "" }])} className="text-sm font-semibold text-sage hover:underline">+ Add room type</button>
          </div>
        </section>

        <section id="activities" className="rounded-2xl border border-onda-border bg-card-bg p-4 sm:p-6 scroll-mt-4">
          <h2 className="font-serif text-lg text-ink">Activity options</h2>
          <p className="mt-1 text-sm text-warm-gray">Activities guests can select at registration (e.g. Surf lessons, Yoga). One per line or comma-separated.</p>
          <textarea value={activityLabels} onChange={(e) => setActivityLabels(e.target.value)} rows={3} placeholder="Surf lessons&#10;Yoga&#10;Inversion workshop" className={`mt-4 ${inputClass}`} />
        </section>

        <section id="photos" className="rounded-2xl border border-onda-border bg-card-bg p-4 sm:p-6 scroll-mt-4">
          <h2 className="font-serif text-lg text-ink">Photos</h2>
          <p className="mt-1 text-sm text-warm-gray">Cover photo is shown on your listing; gallery appears on the retreat page.</p>
          <div className="mt-6">
            <PhotoUpload
              coverUrl={coverImageUrl}
              galleryUrls={galleryUrls}
              onCoverChange={setCoverImageUrl}
              onGalleryChange={setGalleryUrls}
              retreatId={id}
              disabled={savingPhotos}
              galleryCollapsed={false}
            />
          </div>
          {supabase && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSavePhotos}
                disabled={savingPhotos}
                className="min-h-[44px] rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sage-light disabled:opacity-60"
              >
                {savingPhotos ? "Saving…" : "Save photos"}
              </button>
              {photoToast && (
                <span className={`text-sm ${photoToast.startsWith("Photos saved") ? "text-sage" : "text-clay"}`}>
                  {photoToast}
                </span>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-onda-border bg-card-bg p-4 sm:p-6">
          <h2 className="font-serif text-lg text-ink">Policies & consent</h2>
          <p className="mt-1 text-sm text-warm-gray">Checkboxes guests must agree to at registration (e.g. deposit charge, COVID policy).</p>
          <div className="mt-6 space-y-4">
            {consents.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-lg border border-onda-border bg-cream/30 p-4">
                <input type="checkbox" checked={c.required} onChange={(e) => setConsents((prev) => prev.map((x) => (x.id === c.id ? { ...x, required: e.target.checked } : x)))} className="h-4 w-4 rounded border-onda-border text-sage" />
                <input type="text" value={c.label} onChange={(e) => setConsents((prev) => prev.map((x) => (x.id === c.id ? { ...x, label: e.target.value } : x)))} placeholder="e.g. I consent to the deposit charge." className="flex-1 rounded-lg border border-onda-border bg-white px-3 py-2 text-sm" />
                <button type="button" onClick={() => setConsents((prev) => prev.filter((x) => x.id !== c.id))} className="text-sm font-medium text-warm-gray hover:text-clay">Remove</button>
              </div>
            ))}
            <button type="button" onClick={() => setConsents((prev) => [...prev, { id: nextId("consent"), label: "", required: true }])} className="text-sm font-semibold text-sage hover:underline">+ Add consent</button>
          </div>
        </section>

        <div className="flex flex-wrap gap-3 pb-6 sm:pb-0">
          <button type="submit" disabled={submitting} className="min-h-[44px] rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sage-light disabled:opacity-60">
            {submitting ? "Saving…" : "Save changes"}
          </button>
          <Link href={`/dashboard/retreats/${id}`} className="inline-flex items-center min-h-[44px] rounded-lg border-2 border-onda-border bg-transparent px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
