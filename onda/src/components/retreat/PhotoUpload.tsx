"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const BUCKET = "retreats";
const COVER_PREFIX = "cover";
const GALLERY_PREFIX = "gallery";

interface PhotoUploadProps {
  coverUrl: string;
  galleryUrls: string[];
  onCoverChange: (url: string) => void;
  onGalleryChange: (urls: string[]) => void;
  retreatId?: string | null;
  disabled?: boolean;
  /** When true, gallery is shown as a collapsed invite card instead of the full upload UI */
  galleryCollapsed?: boolean;
  onGalleryExpand?: () => void;
}

function generatePath(prefix: string, retreatId: string | null, file: File): string {
  const ext = file.name.split(".").pop() || "jpg";
  const id = retreatId || `new-${Date.now()}`;
  return `${id}/${prefix}-${Date.now()}.${ext}`;
}

export function PhotoUpload({
  coverUrl,
  galleryUrls,
  onCoverChange,
  onGalleryChange,
  retreatId = null,
  disabled = false,
  galleryCollapsed = false,
  onGalleryExpand,
}: PhotoUploadProps) {
  const [coverDragging, setCoverDragging] = useState(false);
  const [galleryDragging, setGalleryDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File, prefix: string): Promise<string | null> => {
      if (!supabase) {
        setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
        return null;
      }
      const path = generatePath(prefix, retreatId, file);
      setUploading(true);
      setError(null);
      const { data, error: err } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
      setUploading(false);
      if (err) {
        setError(err.message);
        return null;
      }
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
      return urlData.publicUrl;
    },
    [retreatId]
  );

  const handleCoverDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setCoverDragging(false);
      if (disabled || uploading) return;
      const file = e.dataTransfer.files[0];
      if (!file?.type.startsWith("image/")) return;
      const url = await upload(file, COVER_PREFIX);
      if (url) onCoverChange(url);
    },
    [disabled, uploading, upload, onCoverChange]
  );

  const handleCoverFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || disabled || uploading) return;
      const url = await upload(file, COVER_PREFIX);
      if (url) onCoverChange(url);
      e.target.value = "";
    },
    [disabled, uploading, upload, onCoverChange]
  );

  const handleGalleryDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setGalleryDragging(false);
      if (disabled || uploading) return;
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/")).slice(0, 8 - galleryUrls.length);
      const urls: string[] = [];
      for (const file of files) {
        const url = await upload(file, GALLERY_PREFIX);
        if (url) urls.push(url);
      }
      if (urls.length) onGalleryChange([...galleryUrls, ...urls]);
    },
    [disabled, uploading, galleryUrls, upload, onGalleryChange]
  );

  const handleGalleryFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/")).slice(0, 8 - galleryUrls.length);
      const urls: string[] = [];
      for (const file of files) {
        const url = await upload(file, GALLERY_PREFIX);
        if (url) urls.push(url);
      }
      if (urls.length) onGalleryChange([...galleryUrls, ...urls]);
      e.target.value = "";
    },
    [galleryUrls, upload, onGalleryChange]
  );

  const removeGallery = (index: number) => {
    onGalleryChange(galleryUrls.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-lg bg-[#FFF4E5] px-4 py-2 text-sm text-[#C4793A]">{error}</p>
      )}
      <div>
        <p className="mb-2 text-sm font-semibold text-[#1A1A14]">Cover photo (required)</p>
        <div
          onDragOver={(e) => { e.preventDefault(); setCoverDragging(true); }}
          onDragLeave={() => setCoverDragging(false)}
          onDrop={handleCoverDrop}
          className={`flex min-h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
            coverDragging ? "border-[#4A6741] bg-[#4A6741]/5" : "border-[#D8D2C4] bg-white"
          } ${disabled || uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          {coverUrl ? (
            <div className="relative w-full max-w-sm">
              <img src={coverUrl} alt="Cover" className="h-40 w-full rounded-lg object-cover" />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onCoverChange("")}
                  className="absolute right-2 top-2 rounded-full bg-[#1A1A14]/80 px-2 py-1 text-xs text-white hover:bg-[#1A1A14]"
                >
                  Remove
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-[#8A8478]">Drag and drop or click to upload</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverFile}
                className="mt-2 text-sm text-[#8A8478] file:mr-2 file:rounded-lg file:border-0 file:bg-[#F5F0E8] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#1A1A14]"
              />
            </>
          )}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-[#1A1A14]">Gallery (optional, up to 8)</p>
        {galleryCollapsed ? (
          <button
            type="button"
            onClick={onGalleryExpand}
            className="flex w-full items-center justify-center rounded-xl border border-dashed border-[#D8D2C4] bg-[#FDFAF5]/60 px-6 py-5 text-[#4A6741] transition-colors hover:border-[#4A6741]/50 hover:bg-[#F5F0E8]/50"
          >
            {galleryUrls.length > 0 ? (
              <span className="font-medium">{galleryUrls.length} photos added ✓</span>
            ) : (
              <span className="font-medium">+ Add more photos</span>
            )}
          </button>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setGalleryDragging(true); }}
            onDragLeave={() => setGalleryDragging(false)}
            onDrop={handleGalleryDrop}
            className={`flex min-h-[120px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
              galleryDragging ? "border-[#4A6741] bg-[#4A6741]/5" : "border-[#D8D2C4] bg-white"
            } ${disabled || uploading || galleryUrls.length >= 8 ? "pointer-events-none opacity-60" : ""}`}
          >
            {galleryUrls.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {galleryUrls.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover" />
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => removeGallery(i)}
                        className="absolute -right-1 -top-1 rounded-full bg-[#1A1A14]/80 p-1 text-white hover:bg-[#1A1A14]"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {galleryUrls.length < 8 && (
              <>
                <p className="text-sm text-[#8A8478]">Drag and drop or click to add photos</p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryFile}
                  className="mt-2 text-sm text-[#8A8478] file:mr-2 file:rounded-lg file:border-0 file:bg-[#F5F0E8] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#1A1A14]"
                />
              </>
            )}
          </div>
        )}
      </div>
      {uploading && <p className="text-sm text-[#8A8478]">Uploading…</p>}
    </div>
  );
}
