import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_noStore } from "next/cache";
import { getRetreatDetailFromSupabase } from "@/lib/retreatDetails";
import type { RetreatDetail } from "@/lib/retreatDetails";
import RetreatDetailClient from "./RetreatDetailClient";

export const dynamic = "force-dynamic";

const SKILL_LEVEL_LABEL: Record<string, string> = {
  "all-levels": "All levels",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ retreatId: string }>;
}) {
  const { retreatId } = await params;
  unstable_noStore();
  const detail = await getRetreatDetailFromSupabase(retreatId);
  if (!detail) return { title: "Retreat not found" };
  return {
    title: `${detail.title} — Outpost`,
    description: (detail.shortDescription || detail.description).slice(0, 160),
  };
}

export default async function RetreatDetailPage({
  params,
}: {
  params: Promise<{ retreatId: string }>;
}) {
  const { retreatId } = await params;
  unstable_noStore();
  const detail = await getRetreatDetailFromSupabase(retreatId);
  if (!detail) notFound();

  const bookHref = `/book/${detail.id}`;
  const activityPill = detail.activityLabel.toUpperCase();
  const skillLabel = detail.skillLevel ? SKILL_LEVEL_LABEL[detail.skillLevel] ?? detail.skillLevel : null;
  const spotsPct = detail.spotsTotal > 0 ? (detail.spotsRemaining / detail.spotsTotal) * 100 : 0;

  return (
    <div className="min-h-screen bg-cream">
      <nav className="sticky top-0 z-[200] flex items-center justify-between border-b border-onda-border bg-card-bg px-4 py-3 md:px-8">
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

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <Link
          href="/explore"
          className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-onda-border bg-white px-5 py-2.5 text-sm font-semibold text-ink shadow-sm transition-colors hover:border-sage hover:bg-sage/5 hover:text-sage"
        >
          <span aria-hidden>←</span>
          Back to retreats
        </Link>

        <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-10 lg:items-start">
          {/* Left column — 60% content */}
          <div className="lg:min-w-0">
            {/* 1. Hero image */}
            <div className="overflow-hidden rounded-xl max-h-96 bg-onda-border">
              {detail.coverImageUrl ? (
                <img
                  src={detail.coverImageUrl}
                  alt=""
                  className="h-full w-full object-cover max-h-96"
                />
              ) : (
                <div className="flex h-64 md:h-80 items-center justify-center text-6xl bg-gradient-to-br from-sage/20 to-clay/10">
                  {detail.emoji}
                </div>
              )}
            </div>

            {/* 2. Title block */}
            <div className="mt-6">
              <span
                className="text-xs font-semibold uppercase tracking-wider text-clay"
                style={{ color: "#C4793A" }}
              >
                {activityPill}
              </span>
              <h1 className="mt-2 font-serif text-4xl tracking-tight text-ink">
                {detail.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-warm-gray">
                <span>{detail.location}</span>
                {detail.startDate && detail.endDate && (
                  <>
                    <span aria-hidden>·</span>
                    <span>
                      {new Date(detail.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      –{" "}
                      {new Date(detail.endDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </>
                )}
                <span aria-hidden>·</span>
                <span>{detail.days} days</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <span className="font-medium text-ink">
                  {detail.rating} · {detail.reviews} reviews
                </span>
                {detail.spotsTotal > 0 && (
                  <span className="text-warm-gray">
                    {detail.spotsRemaining} of {detail.spotsTotal} spots remaining
                  </span>
                )}
              </div>
              {detail.spotsTotal > 0 && (
                <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-onda-border">
                  <div
                    className="h-full rounded-full bg-sage transition-all"
                    style={{ width: `${spotsPct}%` }}
                  />
                </div>
              )}
            </div>

            {/* 3. Photo gallery — max 4 */}
            {(detail.galleryUrls?.length ?? 0) > 0 && (
              <section className="mt-8">
                <h2 className="font-serif text-xl text-ink">Photos</h2>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {detail.galleryUrls!.slice(0, 4).map((url, i) => (
                    <div
                      key={i}
                      className="aspect-[4/3] overflow-hidden rounded-lg bg-onda-border"
                    >
                      <img
                        src={url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 4. About — full + short */}
            <section className="mt-10">
              <h2 className="font-serif text-2xl text-ink">About</h2>
              {detail.shortDescription && (
                <p className="mt-3 text-warm-gray leading-relaxed">
                  {detail.shortDescription}
                </p>
              )}
              <p className="mt-3 text-ink leading-relaxed">
                {detail.description}
              </p>
            </section>

            {/* What's included */}
            <section className="mt-10">
              <h2 className="font-serif text-2xl text-ink">What&apos;s included</h2>
              <ul className="mt-3 space-y-2">
                {detail.whatIncluded.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-ink">
                    <span className="mt-0.5 text-sage">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* What's not included */}
            {(detail.whatNotIncluded?.length ?? 0) > 0 && (
              <section className="mt-8">
                <h2 className="font-serif text-xl text-ink">What&apos;s not included</h2>
                <ul className="mt-3 space-y-1 text-warm-gray">
                  {detail.whatNotIncluded!.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Skill level */}
            {skillLabel && (
              <section className="mt-8">
                <h2 className="font-serif text-xl text-ink">Skill level</h2>
                <p className="mt-2 text-warm-gray">{skillLabel}</p>
              </section>
            )}

            {/* Typical day */}
            {detail.typicalDay && (
              <section className="mt-10">
                <h2 className="font-serif text-2xl text-ink">A typical day</h2>
                <p className="mt-3 whitespace-pre-wrap text-warm-gray leading-relaxed">
                  {detail.typicalDay}
                </p>
              </section>
            )}

            {/* Accommodation note + room types */}
            {(detail.accommodationNote || (detail.roomTypes?.length ?? 0) > 0) && (
              <section className="mt-10">
                <h2 className="font-serif text-2xl text-ink">Accommodation</h2>
                {detail.accommodationNote && (
                  <p className="mt-3 text-warm-gray">{detail.accommodationNote}</p>
                )}
                {(detail.roomTypes?.length ?? 0) > 0 && (
                  <ul className="mt-4 space-y-3">
                    {detail.roomTypes!.map((room, i) => (
                      <li
                        key={i}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-onda-border bg-card-bg px-4 py-3"
                      >
                        <span className="font-medium text-ink">{room.name}</span>
                        <span className="text-ink">
                          ${room.price.toLocaleString()}
                          {room.soldOut && (
                            <span className="ml-2 text-xs font-semibold text-warm-gray">
                              Sold out
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* Trip highlights */}
            {detail.highlights.length > 0 && (
              <section className="mt-10">
                <h2 className="font-serif text-2xl text-ink">Trip highlights</h2>
                <div className="mt-4 space-y-6">
                  {detail.highlights.map((h, i) => (
                    <div key={i}>
                      {h.title && (
                        <h3 className="font-semibold text-ink">{h.title}</h3>
                      )}
                      <p className="mt-1 text-warm-gray leading-relaxed">{h.body}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* FAQs */}
            {detail.faqs.length > 0 && (
              <section className="mt-10">
                <h2 className="font-serif text-2xl text-ink">FAQs</h2>
                <RetreatDetailClient faqs={detail.faqs} />
              </section>
            )}

            {/* Payment & cancellation */}
            {(detail.depositPolicy || detail.cancellationPolicy) && (
              <section className="mt-10 rounded-2xl border border-onda-border bg-card-bg p-6">
                <h2 className="font-serif text-2xl text-ink">Payment & cancellation</h2>
                {detail.depositPolicy && (
                  <p className="mt-3 text-sm text-warm-gray">
                    <strong className="text-ink">Deposit:</strong> {detail.depositPolicy}
                  </p>
                )}
                {detail.cancellationPolicy && (
                  <p className="mt-2 text-sm text-warm-gray">
                    <strong className="text-ink">Cancellation:</strong>{" "}
                    {detail.cancellationPolicy}
                  </p>
                )}
              </section>
            )}

            {/* Host section */}
            {detail.host && (
              <section className="mt-10 rounded-2xl border border-onda-border bg-card-bg p-6">
                <h2 className="font-serif text-2xl text-ink">Your host</h2>
                <Link
                  href={`/hosts/${detail.host.slug}`}
                  className="mt-4 flex items-center gap-4 no-underline text-inherit hover:opacity-90"
                >
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border-2 border-onda-border bg-card-bg">
                    {detail.host.avatarUrl ? (
                      <img
                        src={detail.host.avatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl text-warm-gray font-serif">
                        {detail.host.fullName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-ink">{detail.host.fullName}</p>
                    {detail.host.tagline && (
                      <p className="mt-0.5 text-sm text-warm-gray">{detail.host.tagline}</p>
                    )}
                    <span className="mt-1 inline-block text-sm font-medium text-sage">
                      View profile →
                    </span>
                  </div>
                </Link>
              </section>
            )}

            {/* Mobile CTA (only on small screens) */}
            <div className="mt-10 lg:hidden">
              <StickyBookingCard detail={detail} bookHref={bookHref} />
            </div>
          </div>

          {/* Right column — sticky booking card (desktop) */}
          <aside className="hidden lg:block lg:sticky lg:top-24">
            <StickyBookingCard detail={detail} bookHref={bookHref} />
          </aside>
        </div>
      </div>
    </div>
  );
}

function StickyBookingCard({
  detail,
  bookHref,
}: {
  detail: RetreatDetail;
  bookHref: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-onda-border bg-card-bg p-6 shadow-sm">
      <p className="font-serif text-2xl text-ink">
        From ${detail.priceFrom.toLocaleString()}
        <span className="text-base font-normal text-warm-gray"> / person</span>
      </p>
      {detail.priceNote && (
        <p className="mt-1 text-sm text-warm-gray">{detail.priceNote}</p>
      )}
      <Link
        href={bookHref}
        className="mt-6 block w-full rounded-full bg-sage py-4 text-center text-base font-semibold text-white transition-colors hover:bg-sage-light"
      >
        Reserve your spot
      </Link>
      <p className="mt-3 text-center text-sm text-warm-gray">
        Secure your spot with a deposit. Balance due before the retreat.
      </p>
      {detail.contactEmail && (
        <p className="mt-4 text-center text-sm text-warm-gray">
          Questions?{" "}
          <a
            href={`mailto:${detail.contactEmail}`}
            className="text-sage hover:underline"
          >
            {detail.contactEmail}
          </a>
        </p>
      )}
    </div>
  );
}
