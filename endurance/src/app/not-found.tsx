import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6">
      <h1 className="font-serif text-3xl text-ink">Page not found</h1>
      <p className="mt-2 text-center text-warm-gray">
        The page you’re looking for doesn’t exist or has been moved.
      </p>
      <p className="mt-4 text-center text-sm text-warm-gray">
        Try one of these:
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        <Link
          href="/"
          className="rounded-xl border border-onda-border bg-white px-6 py-3 font-semibold text-ink hover:bg-[#F5F0E8]"
        >
          Home
        </Link>
        <Link
          href="/dashboard"
          className="rounded-xl bg-sage px-6 py-3 font-semibold text-white hover:bg-sage-light"
        >
          Dashboard
        </Link>
        <Link
          href="/dashboard/settings"
          className="rounded-xl border border-sage bg-white px-6 py-3 font-semibold text-sage hover:bg-sage/5"
        >
          Settings
        </Link>
      </div>
    </div>
  );
}
