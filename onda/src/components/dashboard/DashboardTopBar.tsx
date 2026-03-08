"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function getInitials(fullName: string | null): string {
  if (!fullName || !fullName.trim()) return "?";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
  }
  return fullName.slice(0, 2).toUpperCase();
}

export default function DashboardTopBar() {
  const router = useRouter();
  const [profile, setProfile] = useState<{
    avatar_url: string | null;
    full_name: string | null;
    slug: string | null;
    email: string | null;
  } | null>(null);
  const [hasPublishedRetreat, setHasPublishedRetreat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!mounted) return;
      if (userError || !user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      if (typeof window !== "undefined") {
        (window as unknown as { __hostId?: string }).__hostId = user.id;
      }
      const profileRes = await supabase
        .from("profiles")
        .select("avatar_url, full_name, slug")
        .eq("id", user.id)
        .maybeSingle();
      if (!mounted) return;
      const row = profileRes.data as { avatar_url: string | null; full_name: string | null; slug: string | null } | null;
      const email = user.email ?? null;
      const fullName = row?.full_name?.trim() || (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : null) || null;
      setProfile({
        avatar_url: row?.avatar_url ?? null,
        full_name: fullName || null,
        slug: row?.slug ?? null,
        email,
      });

      const retreatsRes = await supabase
        .from("retreats")
        .select("id", { count: "exact", head: true })
        .eq("host_id", user.id)
        .eq("status", "published")
        .limit(1);
      if (mounted) {
        setHasPublishedRetreat(!retreatsRes.error && (retreatsRes.count ?? 0) > 0);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClickOutside]);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
  };

  const displayName = profile?.full_name?.trim() || profile?.email || "—";
  const displayEmail = profile?.email ?? "—";

  return (
    <div
      className="flex h-12 flex-shrink-0 items-center justify-end border-b border-[#D8D2C4] px-4"
      style={{ background: "#F5F0E8" }}
    >
      <div className="relative flex items-center justify-end" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-[#4A6741]/30 focus:ring-offset-2 focus:ring-offset-[#F5F0E8]"
          aria-label="Open menu"
          aria-expanded={open}
        >
          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-[#D8D2C4]" />
          ) : (
            <div className="h-8 w-8 overflow-hidden rounded-full bg-[#4A6741]">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className="flex h-full w-full items-center justify-center font-sans text-xs font-medium text-white"
                  style={{ fontSize: "12px" }}
                >
                  {getInitials(profile?.full_name ?? null)}
                </span>
              )}
            </div>
          )}
        </button>

        {open && (
          <div
            className="dashboard-dropdown-in absolute right-0 top-full z-50 mt-1 min-w-[200px] overflow-hidden rounded-lg border border-[#D8D2C4] py-2"
            style={{
              background: "#FDFAF5",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            {/* Header */}
            <div className="border-b border-[#D8D2C4] px-4 py-3">
              {loading ? (
                <>
                  <div className="h-4 w-32 animate-pulse rounded bg-[#D8D2C4]" />
                  <div className="mt-2 h-3 w-40 animate-pulse rounded bg-[#D8D2C4]" />
                </>
              ) : (
                <>
                  <p
                    className="font-sans text-sm font-medium text-[#1A1A14]"
                    style={{ fontSize: "14px" }}
                  >
                    {displayName}
                  </p>
                  <p
                    className="mt-0.5 font-sans text-[#8A8478]"
                    style={{ fontSize: "12px" }}
                  >
                    {displayEmail}
                  </p>
                </>
              )}
            </div>
            {/* Menu items */}
            {!loading && (
              <>
                {hasPublishedRetreat && profile?.slug ? (
                  <a
                    href={`/hosts/${profile.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className="block font-sans text-sm font-medium text-[#1A1A14] transition-colors hover:bg-[#F0EBE1]"
                    style={{ padding: "10px 16px" }}
                  >
                    View my profile →
                  </a>
                ) : null}
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="block font-sans text-sm font-medium text-[#1A1A14] transition-colors hover:bg-[#F0EBE1]"
                  style={{ padding: "10px 16px" }}
                >
                  Settings
                </Link>
                <div className="my-2 border-t border-[#D8D2C4]" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full text-left font-sans text-sm font-medium transition-colors hover:bg-[#F0EBE1]"
                  style={{ padding: "10px 16px", color: "#C4793A" }}
                >
                  Log out
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
