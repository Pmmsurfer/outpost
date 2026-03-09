import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getHostBySlug,
  fetchHostBySlugFromSupabase,
  getUpcomingRetreatsForHost,
  getPastRetreatsForHost,
  getPublicReviewsForHost,
  fetchUpcomingRetreatsForHostFromSupabase,
  fetchPastRetreatsForHostFromSupabase,
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
    description: host.tagline ?? host.short_bio ?? undefined,
  };
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.268 4.771 1.691 5.02 4.92.06 1.265.061 1.645.061 4.849 0 3.205-.012 3.584-.061 4.849-.269 3.225-1.664 4.771-4.92 5.02-1.266.06-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.249-4.771-1.691-5.02-4.92-.06-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.249-3.227 1.664-4.771 4.919-5.02 1.266-.06 1.644-.07 4.849-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  );
}

export default async function HostProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const host = (await fetchHostBySlugFromSupabase(slug)) ?? getHostBySlug(slug);
  if (!host) notFound();

  const [upcoming, past] = await Promise.all([
    fetchUpcomingRetreatsForHostFromSupabase(host.id).then((r) => r.length > 0 ? r : getUpcomingRetreatsForHost(host.id)),
    fetchPastRetreatsForHostFromSupabase(host.id).then((r) => r.length > 0 ? r : getPastRetreatsForHost(host.id)),
  ]);
  const reviews = getPublicReviewsForHost(host.id);

  const retreatsHosted = host.retreat_count ?? host.retreats_hosted ?? 0;
  const totalGuests = host.total_guests ?? 0;
  const totalReviews = host.total_reviews ?? 0;
  const hostWithStats = { ...host, retreats_hosted: retreatsHosted, total_guests: totalGuests, total_reviews: totalReviews };

  const instagramHref =
    host.instagram_url?.trim() ||
    (host.instagram_handle ? `https://instagram.com/${host.instagram_handle.replace(/^@/, "")}` : null);
  const websiteHref = host.website_url?.trim()
    ? (host.website_url.startsWith("http") ? host.website_url : `https://${host.website_url}`)
    : null;

  return (
    <div className="min-h-screen bg-cream">
      {/* Public nav */}
      <nav className="sticky top-0 z-[200] flex items-center justify-between border-b border-onda-border bg-card-bg px-6 py-3 md:px-8">
        <Link href="/" className="font-serif text-[22px] tracking-tight text-ink">
          Outpos<span className="text-sage">t</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/explore" className="text-sm font-medium text-warm-gray hover:text-ink transition-colors">
            Explore retreats
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-warm-gray hover:text-ink transition-colors">
            For hosts
          </Link>
        </div>
      </nav>

      {/* Full-width cover with overlapping avatar */}
      <div className="relative w-full bg-warm-gray/20">
        <div className="aspect-[3/1] min-h-[200px] w-full overflow-hidden bg-onda-border">
          {hostWithStats.cover_image_url ? (
            <img
              src={hostWithStats.cover_image_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-sage/20 to-clay/10" />
          )}
        </div>
        <div className="mx-auto max-w-[860px] px-6 md:px-8">
          <div className="relative -mb-16 h-0">
            <div className="absolute left-0 bottom-0 h-32 w-32 overflow-hidden rounded-full border-4 border-card-bg bg-card-bg shadow-lg">
              {hostWithStats.avatar_url ? (
                <img
                  src={hostWithStats.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl font-serif text-warm-gray">
                  {hostWithStats.full_name.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[860px] px-6 pb-16 pt-20 md:px-8">
        {/* Name, tagline, pills, stat, social */}
        <header className="flex flex-col">
          <h1 className="font-serif text-3xl tracking-tight text-ink md:text-4xl lg:text-[42px]">
            {hostWithStats.full_name}
          </h1>
          {hostWithStats.tagline && (
            <p className="mt-2 text-lg text-warm-gray">{hostWithStats.tagline}</p>
          )}
          {!hostWithStats.tagline && hostWithStats.short_bio && (
            <p className="mt-2 text-lg text-warm-gray">{hostWithStats.short_bio}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {hostWithStats.location && (
              <span className="rounded-full border border-onda-border bg-card-bg px-3 py-1 text-sm text-warm-gray">
                {hostWithStats.location}
              </span>
            )}
            {hostWithStats.languages?.length > 0 &&
              hostWithStats.languages.map((lang) => (
                <span
                  key={lang}
                  className="rounded-full border border-onda-border bg-card-bg px-3 py-1 text-sm text-warm-gray"
                >
                  {lang}
                </span>
              ))}
          </div>
          <p className="mt-3 text-sm text-warm-gray">
            {retreatsHosted} retreat{retreatsHosted !== 1 ? "s" : ""} hosted
            {totalGuests > 0 && (
              <>
                <span aria-hidden> · </span>
                {totalGuests} guest{totalGuests !== 1 ? "s" : ""}
              </>
            )}
            {totalReviews > 0 && (
              <>
                <span aria-hidden> · </span>
                {totalReviews} review{totalReviews !== 1 ? "s" : ""}
              </>
            )}
          </p>
          <div className="mt-4 flex items-center gap-3">
            {instagramHref && (
              <a
                href={instagramHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-onda-border bg-card-bg text-ink transition-colors hover:border-sage hover:text-sage"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-5 w-5" />
              </a>
            )}
            {websiteHref && (
              <a
                href={websiteHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-onda-border bg-card-bg text-ink transition-colors hover:border-sage hover:text-sage"
                aria-label="Website"
              >
                <GlobeIcon className="h-5 w-5" />
              </a>
            )}
          </div>
        </header>

        {/* Philosophy — My approach */}
        {hostWithStats.philosophy && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl text-ink">My approach</h2>
            <p className="mt-4 whitespace-pre-wrap text-ink/90 leading-relaxed">
              {hostWithStats.philosophy}
            </p>
          </section>
        )}

        {/* Specialties (legacy) */}
        {hostWithStats.specialties.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {hostWithStats.specialties.map((s) => (
              <span
                key={s}
                className="rounded-full bg-sage/15 px-4 py-1.5 text-sm font-medium text-sage"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Upcoming Retreats */}
        <section className="mt-14">
          <h2 className="font-serif text-2xl text-ink">Upcoming Retreats</h2>
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
            <p className="mt-4 text-warm-gray">No upcoming retreats — check back soon.</p>
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
                <h2 className="font-serif text-2xl text-ink">About</h2>
                <p className="mt-4 whitespace-pre-wrap text-ink/90 leading-relaxed">
                  {hostWithStats.long_bio}
                </p>
              </>
            )}
            {hostWithStats.certifications.length > 0 && (
              <div className={hostWithStats.long_bio ? "mt-8" : ""}>
                <h3 className="font-serif text-xl text-ink">Certifications</h3>
                <ul className="mt-3 list-inside list-disc space-y-1 text-warm-gray">
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
