"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!supabase) {
      setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    const destination =
      next && next.startsWith("/") && !next.startsWith("//") ? next : "/onboarding";
    router.push(destination);
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F0E8] px-4">
      <div className="w-full max-w-[400px] rounded-xl border border-[#D8D2C4] bg-[#FDFAF5] p-10">
        <Link href="/" className="font-serif text-2xl tracking-tight text-[#1A1A14]">
          Outpos<span className="text-[#4A6741]">t</span>
        </Link>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#1A1A14]">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-[#D8D2C4] bg-white px-4 py-2.5 text-sm text-[#1A1A14] placeholder:text-[#8A8478] focus:border-[#4A6741] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/20"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#1A1A14]">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-[#D8D2C4] bg-white px-4 py-2.5 text-sm text-[#1A1A14] placeholder:text-[#8A8478] focus:border-[#4A6741] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/20"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-[#FFF4E5] px-3 py-2 text-sm text-[#C4793A]">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#4A6741] py-2.5 text-sm font-semibold text-white hover:bg-[#6B8F62] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[#8A8478]">
          Don&apos;t have an account?{" "}
          <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="font-medium text-[#4A6741] hover:underline">
            Sign up
          </Link>
        </p>
        <Link href="/" className="mt-4 block text-center text-sm font-medium text-[#4A6741] hover:underline">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#F5F0E8]">
        <span className="text-warm-gray">Loading…</span>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
