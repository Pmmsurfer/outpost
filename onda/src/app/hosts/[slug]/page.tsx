import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getHostBySlug,
  fetchHostBySlugFromSupabase,
  getUpcomingRetreatsForHost,
  getPastRetreatsForHost,
  getPublicReviewsForHost,
} from "@/lib/host-profile";
import { RetreatCard } from "@/components/host/RetreatCard";
import { HostProfilePastRetreats } from "@/components/host/HostProfilePastRetreats";
import { HostProfileReviews } from "@/components/host/HostProfileReviews";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const host = (await fetchHostBySlugFromSupabase(slug)) ?? getHostBySlug(slug);
  if (!host) return { title: "Host not found" };
  return {
    title: `${host.full_name} — Retreat Host`,
    description: host.short_bio ?? undefined,
  };
}

export default async function HostProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const host = (await fetchHostBySlugFromSupabase(slug)) ?? getHostBySlug(slug);
  if (!host) notFound();

  const upcoming = getUpcomingRetreatsForHost(host.id);
  const past = getPastRetreatsForHost(host.id);
  const reviews = getPublicReviewsForHost(host.id);

  const retreatsHosted = host.retreats_hosted ?? 2;
  const totalGuests = host.total_guests ?? 12;
  const totalReviews = host.total_reviews ?? 8;
  const hostWithStats = { ...host, retreats_hosted: retreatsHosted, total_guests: totalGuests, total_reviews: totalReviews };

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* Public nav */}
      <nav className="sticky top-0 z-[200] flex items-center justify-between border-b border-[#D8D2C4] bg-white px-6 py-3 md:px-8">
        <Link href="/" className="font-serif text-[22px] tracking-tight text-[#1A1A14]">
          Outpos<span className="text-[#4A6741]">t</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium text-[#1A1A14] hover:text-[#4A6741]">
            Discover
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-[#1A1A14] hover:text-[#4A6741]">
            For hosts
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-[860px] px-6 pb-16 pt-10 md:px-8">
        {/* Hero */}
        <section className="flex flex-col items-center text-center">
          <div className="h-[120px] w-[120px] flex-shrink-0 overflow-hidden rounded-full border-2 border-[#D8D2C4] bg-[#FDFAF5]">
            {hostWithStats.avatar_url ? (
              <img
                src={hostWithStats.avatar_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl text-[#8A8478]">
                {hostWithStats.full_name.charAt(0)}
              </div>
            )}
          </div>
          <h1 className="mt-6 font-serif text-[32px] tracking-tight text-[#1A1A14] md:text-4xl">
            {hostWithStats.full_name}
          </h1>
          {hostWithStats.short_bio && (
            <p className="mt-2 max-w-xl text-[#8A8478]">{hostWithStats.short_bio}</p>
          )}
          {hostWithStats.specialties.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {hostWithStats.specialties.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-[#4A6741] px-4 py-1.5 text-sm font-medium text-white"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
          <div className="mt-6 flex items-center justify-center gap-6">
            {hostWithStats.instagram_handle && (
              <a
                href={`https://instagram.com/${hostWithStats.instagram_handle.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1A1A14] hover:text-[#4A6741]"
                aria-label="Instagram"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.268 4.771 1.691 5.02 4.92.06 1.265.061 1.645.061 4.849 0 3.205-.012 3.584-.061 4.849-.269 3.225-1.664 4.771-4.92 5.02-1.266.06-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.249-4.771-1.691-5.02-4.92-.06-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.249-3.227 1.664-4.771 4.919-5.02 1.266-.06 1.644-.07 4.849-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            )}
            {hostWithStats.website_url && (
              <a
                href={hostWithStats.website_url.startsWith("http") ? hostWithStats.website_url : `https://${hostWithStats.website_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1A1A14] hover:text-[#4A6741]"
                aria-label="Website"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </a>
            )}
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#8A8478]">
            <span>{hostWithStats.retreats_hosted ?? 0} retreats hosted</span>
            <span aria-hidden>·</span>
            <span>{hostWithStats.total_guests ?? 0} guests</span>
            <span aria-hidden>·</span>
            <span>{hostWithStats.total_reviews ?? 0} reviews</span>
          </div>
        </section>

        {/* Upcoming Retreats */}
        <section className="mt-14">
          <h2 className="font-serif text-2xl text-[#1A1A14]">Upcoming Retreats</h2>
          {upcoming.length > 0 ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {upcoming.map((retreat) => (
                <RetreatCard
                  key={retreat.id}
                  retreat={retreat}
                  href={`/retreat/${retreat.id}`}
                />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-[#8A8478]">No upcoming retreats — check back soon.</p>
          )}
        </section>

        {/* Past Retreats (collapsed by default) */}
        {past.length > 0 && (
          <HostProfilePastRetreats pastRetreats={past} />
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <HostProfileReviews reviews={reviews} />
        )}

        {/* Long bio + certifications */}
        {(hostWithStats.long_bio || hostWithStats.certifications.length > 0) && (
          <section className="mt-14">
            {hostWithStats.long_bio && (
              <>
                <h2 className="font-serif text-2xl text-[#1A1A14]">About</h2>
                <p className="mt-4 whitespace-pre-wrap text-[#1A1A14] leading-relaxed">
                  {hostWithStats.long_bio}
                </p>
              </>
            )}
            {hostWithStats.certifications.length > 0 && (
              <div className={hostWithStats.long_bio ? "mt-8" : ""}>
                <h3 className="font-serif text-xl text-[#1A1A14]">Certifications</h3>
                <ul className="mt-3 list-inside list-disc space-y-1 text-[#8A8478]">
                  {hostWithStats.certifications.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
