"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { ActivityType } from "@/lib/retreat-types";

const ACTIVITY_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: "surf", label: "Surf" },
  { value: "yoga", label: "Yoga" },
  { value: "hiking", label: "Hiking" },
  { value: "multi-sport", label: "Multi-sport" },
  { value: "other", label: "Other" },
];

const BIO_MAX = 160;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasCheckedProfile, setHasCheckedProfile] = useState(false);
  const [alreadyOnboarded, setAlreadyOnboarded] = useState(false);

  // Step 1
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Step 2
  const [retreatName, setRetreatName] = useState("");
  const [activityType, setActivityType] = useState<ActivityType>("yoga");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("");
  const [createdRetreatId, setCreatedRetreatId] = useState<string | null>(null);
  const [skippedRetreat, setSkippedRetreat] = useState(false);

  const totalSteps = 3;
  const currentStep = skippedRetreat && step === 3 ? 0 : step;

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getUser().then(({ data: { user }, error: err }) => {
      setLoading(false);
      if (err || !user) {
        router.replace("/login?next=/onboarding");
        return;
      }
      setUserId(user.id);
    });
  }, [router]);

  useEffect(() => {
    if (!userId || !supabase) return;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setHasCheckedProfile(true);
        if (data?.full_name?.trim()) {
          setAlreadyOnboarded(true);
          router.replace("/dashboard");
        }
      });
  }, [userId, router]);

  const handleAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !userId || !supabase) return;
      setAvatarUploading(true);
      setError(null);
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: err } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      setAvatarUploading(false);
      if (err) {
        setError(err.message);
        return;
      }
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(urlData.publicUrl);
    },
    [userId]
  );

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !userId) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from("profiles")
      .upsert(
        { id: userId, full_name: fullName.trim(), short_bio: bio.trim() || null, avatar_url: avatarUrl || null },
        { onConflict: "id" }
      );
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !userId) return;
    setSaving(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("retreats")
      .insert({
        host_id: userId,
        name: retreatName.trim(),
        activity_type: activityType,
        location_city: city.trim() || null,
        location_country: country.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
        price: price ? parseFloat(price) : null,
        capacity: capacity ? parseInt(capacity, 10) : null,
        status: "draft",
      })
      .select("id")
      .single();
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setCreatedRetreatId(data?.id ?? null);
    setStep(3);
  };

  const handleSkipRetreat = () => {
    setSkippedRetreat(true);
    router.push("/dashboard");
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  const copyBookingUrl = () => {
    if (!createdRetreatId || typeof window === "undefined") return;
    const url = `${window.location.origin}/retreat/${createdRetreatId}`;
    navigator.clipboard.writeText(url);
  };

  const cardClass =
    "mx-auto w-full max-w-lg rounded-2xl border border-onda-border bg-card-bg p-8 sm:p-10 shadow-sm";
  const inputClass =
    "mt-2 w-full rounded-lg border border-onda-border bg-white px-4 py-3 text-sm text-ink placeholder:text-warm-gray focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20";
  const labelClass = "block text-sm font-semibold text-ink";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <span className="text-warm-gray">Loading…</span>
      </div>
    );
  }

  if (!userId) {
    return null;
  }

  if (!hasCheckedProfile || alreadyOnboarded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <span className="text-warm-gray">Loading…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-onda-border bg-card-bg px-6 py-4 sm:px-8">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link href="/" className="font-serif text-[22px] tracking-tight text-ink">
            Outpost
          </Link>
          {!skippedRetreat && step <= totalSteps && (
            <p className="text-sm text-warm-gray">
              Step {currentStep} of {totalSteps}
            </p>
          )}
        </div>
        {!skippedRetreat && step <= totalSteps && (
          <div className="mx-auto mt-3 max-w-lg">
            <div className="h-1.5 w-full rounded-full bg-onda-border">
              <div
                className="h-full rounded-full bg-sage transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}
      </header>

      <main className="px-6 py-12 sm:px-8 sm:py-16">
        {step === 1 && (
          <div className={cardClass}>
            <h1 className="font-serif text-2xl tracking-tight text-ink sm:text-3xl">Welcome to Outpost</h1>
            <p className="mt-2 text-warm-gray">Let&apos;s get your host profile set up. It takes about 2 minutes.</p>
            <form onSubmit={handleStep1} className="mt-8 space-y-6">
              <div>
                <label htmlFor="fullName" className={labelClass}>
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label htmlFor="bio" className={labelClass}>
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                  maxLength={BIO_MAX}
                  rows={3}
                  className={inputClass}
                  placeholder="A short bio for your host profile..."
                />
                <p className="mt-1 text-right text-xs text-warm-gray">
                  {bio.length}/{BIO_MAX}
                </p>
              </div>
              <div>
                <label className={labelClass}>Profile photo (optional)</label>
                <div className="mt-2 flex items-center gap-4">
                  {avatarUrl && (
                    <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover border border-onda-border" />
                  )}
                  <label className="cursor-pointer rounded-lg border border-onda-border bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-cream">
                    {avatarUploading ? "Uploading…" : "Choose photo"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                </div>
              </div>
              {error && <p className="text-sm text-clay">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-sage py-3 text-sm font-semibold text-white hover:bg-sage-light disabled:opacity-60"
              >
                {saving ? "Saving…" : "Continue →"}
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className={cardClass}>
            <h1 className="font-serif text-2xl tracking-tight text-ink sm:text-3xl">Create your first retreat</h1>
            <p className="mt-2 text-warm-gray">You can always edit this later — just get the basics down.</p>
            <form onSubmit={handleStep2} className="mt-8 space-y-6">
              <div>
                <label htmlFor="retreatName" className={labelClass}>
                  Retreat name
                </label>
                <input
                  id="retreatName"
                  type="text"
                  value={retreatName}
                  onChange={(e) => setRetreatName(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 7-Day Surf & Yoga Retreat"
                />
              </div>
              <div>
                <span className={labelClass}>Activity type</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ACTIVITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setActivityType(opt.value)}
                      className={`rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                        activityType === opt.value
                          ? "bg-sage text-white"
                          : "border border-onda-border bg-white text-ink hover:border-warm-gray"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="city" className={labelClass}>
                    City / Region
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={inputClass}
                    placeholder="Nosara"
                  />
                </div>
                <div>
                  <label htmlFor="country" className={labelClass}>
                    Country
                  </label>
                  <input
                    id="country"
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className={inputClass}
                    placeholder="Costa Rica"
                  />
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="startDate" className={labelClass}>
                    Start date
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className={labelClass}>
                    End date
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || undefined}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="price" className={labelClass}>
                    Price per person
                  </label>
                  <input
                    id="price"
                    type="number"
                    min={0}
                    step={50}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className={inputClass}
                    placeholder="1299"
                  />
                </div>
                <div>
                  <label htmlFor="capacity" className={labelClass}>
                    Capacity
                  </label>
                  <input
                    id="capacity"
                    type="number"
                    min={1}
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className={inputClass}
                    placeholder="12"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-clay">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-sage py-3 text-sm font-semibold text-white hover:bg-sage-light disabled:opacity-60"
              >
                {saving ? "Saving…" : "Continue →"}
              </button>
              <p className="text-center">
                <button type="button" onClick={handleSkipRetreat} className="text-sm font-medium text-warm-gray hover:text-ink underline">
                  Skip for now
                </button>
              </p>
            </form>
          </div>
        )}

        {step === 3 && createdRetreatId && (
          <div className={cardClass}>
            <h1 className="font-serif text-2xl tracking-tight text-ink sm:text-3xl">Your booking page is ready</h1>
            <p className="mt-2 text-warm-gray">
              Share this link with your audience to start taking bookings.
            </p>
            <div className="mt-6 rounded-lg border border-onda-border bg-cream/50 p-4 font-mono text-sm text-ink break-all">
              {typeof window !== "undefined" ? `${window.location.origin}/retreat/${createdRetreatId}` : `/retreat/${createdRetreatId}`}
            </div>
            <button
              type="button"
              onClick={copyBookingUrl}
              className="mt-4 w-full rounded-lg border-2 border-onda-border bg-white py-3 text-sm font-semibold text-ink hover:border-sage hover:bg-cream"
            >
              Copy link
            </button>
            <button
              type="button"
              onClick={handleGoToDashboard}
              className="mt-4 w-full rounded-lg bg-sage py-3 text-sm font-semibold text-white hover:bg-sage-light"
            >
              Go to my dashboard →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
