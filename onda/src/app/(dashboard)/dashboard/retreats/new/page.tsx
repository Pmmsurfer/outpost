"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RetreatForm } from "@/components/retreat/RetreatForm";
import { supabase } from "@/lib/supabase";

export default function NewRetreatPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setAuthChecked(true);
      setIsLoggedIn(false);
      return;
    }
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      setAuthChecked(true);
      setIsLoggedIn(!!user && !error);
      if (user && typeof window !== "undefined") {
        (window as unknown as Record<string, unknown>).__hostId = user.id;
      }
    });
  }, []);

  if (!authChecked) {
    return (
      <div className="flex flex-col p-6">
        <p className="text-warm-gray">Checking login…</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col p-6">
        <Link href="/dashboard/retreats" className="mb-4 inline-block text-sm font-semibold text-[#4A6741] hover:underline">
          ← My Retreats
        </Link>
        <div className="rounded-lg border border-[#D8D2C4] bg-[#FDFAF5] p-6">
          <p className="font-medium text-[#1A1A14]">You need to be logged in to create a retreat.</p>
          <p className="mt-2 text-sm text-warm-gray">Log in first, then come back to this page.</p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-lg bg-[#4A6741] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6B8F62]"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Link href="/dashboard/retreats" className="mb-4 inline-block text-sm font-semibold text-[#4A6741] hover:underline">
        ← My Retreats
      </Link>
      <RetreatForm />
    </div>
  );
}
