"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { TagInput } from "@/components/retreat/TagInput";
import { nameToSlug } from "@/lib/slug";

const BUCKET = "avatars";
const SHORT_BIO_MAX = 160;

export function AvatarUpload({
  avatarUrl,
  onUpload,
  onRemove,
  disabled,
}: {
  avatarUrl: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      if (!supabase) {
        setError("Supabase is not configured.");
        return;
      }
      const ext = file.name.split(".").pop() || "jpg";
      const path = `public/${Date.now()}.${ext}`;
      setUploading(true);
      setError(null);
      const { data, error: err } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
      setUploading(false);
      if (err) {
        setError(err.message);
        return;
      }
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
      onUpload(urlData.publicUrl);
    },
    [onUpload]
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    upload(file);
    e.target.value = "";
  };

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-ink">Profile photo</p>
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border-2 border-onda-border bg-card-bg">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl text-warm-gray">
              ?
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={disabled || uploading}
            className="hidden"
            aria-hidden
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
            className="rounded-lg border border-onda-border bg-transparent px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-[rgba(74,103,65,0.06)] disabled:opacity-60"
          >
            Upload photo
          </button>
          {avatarUrl && (
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled || uploading}
              className="text-left text-sm text-warm-gray underline hover:text-ink disabled:opacity-60"
            >
              Remove
            </button>
          )}
          {uploading && <p className="text-sm text-warm-gray">Uploading…</p>}
          {error && <p className="text-sm text-clay">{error}</p>}
        </div>
      </div>
    </div>
  );
}

interface HostProfileFormData {
  full_name: string;
  short_bio: string;
  long_bio: string;
  avatar_url: string | null;
  specialties: string[];
  certifications: string[];
  instagram_handle: string;
  website_url: string;
}

const emptyForm: HostProfileFormData = {
  full_name: "",
  short_bio: "",
  long_bio: "",
  avatar_url: null,
  specialties: [],
  certifications: [],
  instagram_handle: "",
  website_url: "",
};

export function HostProfileSettings() {
  const [form, setForm] = useState<HostProfileFormData>(emptyForm);
  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (data) {
      const row = data as Record<string, unknown>;
      setForm({
        full_name: (row.full_name as string) ?? "",
        short_bio: (row.short_bio as string) ?? "",
        long_bio: (row.long_bio as string) ?? "",
        avatar_url: (row.avatar_url as string) ?? null,
        specialties: Array.isArray(row.specialties) ? (row.specialties as string[]) : [],
        certifications: Array.isArray(row.certifications) ? (row.certifications as string[]) : [],
        instagram_handle: (row.instagram_handle as string) ?? "",
        website_url: (row.website_url as string) ?? "",
      });
      setSlug((row.slug as string) ?? nameToSlug((row.full_name as string) ?? ""));
    } else {
      setSlug(nameToSlug(user.user_metadata?.full_name ?? ""));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const save = useCallback(async () => {
    if (!supabase) {
      setToast("Supabase not configured.");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setToast("You must be signed in to save.");
      return;
    }
    setSaving(true);
    const slugValue = nameToSlug(form.full_name) || slug || `host-${user.id.toString().slice(0, 8)}`;
    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          full_name: form.full_name || null,
          short_bio: form.short_bio.slice(0, SHORT_BIO_MAX) || null,
          long_bio: form.long_bio || null,
          avatar_url: form.avatar_url || null,
          specialties: form.specialties,
          certifications: form.certifications,
          instagram_handle: form.instagram_handle.replace(/^@/, "").trim() || null,
          website_url: form.website_url.trim() || null,
          slug: slugValue,
        },
        { onConflict: "id" }
      );
    setSaving(false);
    if (error) {
      setToast(error.message);
      return;
    }
    setSlug(slugValue);
    setToast("Profile saved.");
  }, [form, slug]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-onda-border bg-card-bg p-6">
        <p className="text-warm-gray">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-onda-border bg-card-bg p-6">
      <h2 className="font-serif text-xl text-ink">Host Profile</h2>
      <p className="mt-1 text-sm text-warm-gray">Your public host page. Share the link with guests.</p>

      <div className="mt-6 space-y-6">
        <AvatarUpload
          avatarUrl={form.avatar_url}
          onUpload={(url) => setForm((f) => ({ ...f, avatar_url: url }))}
          onRemove={() => setForm((f) => ({ ...f, avatar_url: null }))}
          disabled={saving}
        />

        <div>
          <label className="block text-sm font-semibold text-ink">Full name</label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            placeholder="Sofia Martinez"
            className="mt-1 w-full rounded-lg border border-onda-border bg-white px-4 py-2.5 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink">Short bio (max 160 characters)</label>
          <textarea
            value={form.short_bio}
            onChange={(e) => setForm((f) => ({ ...f, short_bio: e.target.value.slice(0, SHORT_BIO_MAX) }))}
            maxLength={SHORT_BIO_MAX}
            rows={2}
            placeholder="One line that appears under your name on your profile."
            className="mt-1 w-full rounded-lg border border-onda-border bg-white px-4 py-2.5 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
          />
          <p className="mt-1 text-xs text-warm-gray">
            {form.short_bio.length} / {SHORT_BIO_MAX}
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink">Long bio</label>
          <textarea
            value={form.long_bio}
            onChange={(e) => setForm((f) => ({ ...f, long_bio: e.target.value }))}
            rows={5}
            placeholder="Full story, experience, and what you offer."
            className="mt-1 w-full rounded-lg border border-onda-border bg-white px-4 py-2.5 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink">Specialties</label>
          <TagInput
            value={form.specialties}
            onChange={(specialties) => setForm((f) => ({ ...f, specialties }))}
            placeholder="e.g. Surf Instruction, Yoga"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink">Certifications</label>
          <TagInput
            value={form.certifications}
            onChange={(certifications) => setForm((f) => ({ ...f, certifications }))}
            placeholder="e.g. 200hr RYT, ISA Level 1"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink">Instagram handle</label>
          <input
            type="text"
            value={form.instagram_handle}
            onChange={(e) => setForm((f) => ({ ...f, instagram_handle: e.target.value.replace(/^@/, "") }))}
            placeholder="sofiamartinez"
            className="mt-1 w-full rounded-lg border border-onda-border bg-white px-4 py-2.5 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
          />
          <p className="mt-1 text-xs text-warm-gray">Stored without @</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink">Website URL</label>
          <input
            type="url"
            value={form.website_url}
            onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))}
            placeholder="https://yourwebsite.com"
            className="mt-1 w-full rounded-lg border border-onda-border bg-white px-4 py-2.5 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage-light disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
          {slug && (
            <a
              href={`/hosts/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-sage hover:underline"
            >
              View my profile →
            </a>
          )}
        </div>
      </div>

      {toast && (
        <div className="mt-4 rounded-lg border border-onda-border bg-cream px-4 py-3 text-sm text-ink">
          {toast}
        </div>
      )}
    </div>
  );
}
