import Link from "next/link";
import { notFound } from "next/navigation";
import { getRetreatDetailFromSupabase } from "@/lib/retreatDetails";
import RetreatDetailClient from "./RetreatDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ retreatId: string }>;
}) {
  const { retreatId } = await params;
  const detail = await getRetreatDetailFromSupabase(retreatId);
  if (!detail) return { title: "Retreat not found" };
  return {
    title: `${detail.title} — Outpost`,
    description: detail.description.slice(0, 160),
  };
}

export default async function RetreatDetailPage({
  params,
}: {
  params: Promise<{ retreatId: string }>;
}) {
  const { retreatId } = await params;
  const detail = await getRetreatDetailFromSupabase(retreatId);
  if (!detail) notFound();

  const bookHref = `/book/${detail.id}`;

  return (
    <div className="min-h-screen bg-cream">
      {/* Nav */}
      <nav className="sticky top-0 z-[200] flex items-center justify-between border-b border-onda-border bg-white px-4 py-3 md:px-8">
        <Link href="/" className="font-serif text-[22px] tracking-tight text-ink">
          Outpos<span className="text-sage">t</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium text-ink hover:text-sage">
            ← Discover
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-ink hover:text-sage">
            For hosts
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-[900px] px-4 pb-16 pt-6 md:px-8">
        {/* Back to retreats — prominent */}
        <Link
          href="/explore"
          className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-onda-border bg-white px-5 py-2.5 text-sm font-semibold text-ink shadow-sm transition-colors hover:border-sage hover:bg-sage/5 hover:text-sage"
        >
          <span aria-hidden>←</span>
          Back to retreats
        </Link>

        {/* Hero */}
        <div className="overflow-hidden rounded-2xl flex items-center justify-center h-[280px] md:h-[340px] text-7xl md:text-8xl bg-gradient-to-br from-sage to-sage-light">
          {detail.coverImageUrl ? (
            <img src={detail.coverImageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            detail.emoji
          )}
        </div>
        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sage">
              {detail.activityLabel}
            </span>
            <h1 className="mt-1 font-serif text-3xl tracking-tight text-ink md:text-4xl">
              {detail.title}
            </h1>
            <p className="mt-2 text-warm-gray">{detail.location}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-warm-gray">
              {detail.startDate && detail.endDate && (
                <span>
                  {new Date(detail.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {" – "}
                  {new Date(detail.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
              <span>{detail.days} days</span>
              <span>{detail.meta}</span>
              <span className="font-medium text-ink">
                {detail.rating} · {detail.reviews} reviews
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-serif text-2xl text-ink">
              From ${detail.priceFrom.toLocaleString()}
              <span className="text-base font-normal text-warm-gray"> / person</span>
            </p>
            {detail.priceNote && (
              <p className="mt-1 text-sm text-warm-gray">{detail.priceNote}</p>
            )}
            <Link
              href={bookHref}
              className="mt-4 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-sage"
            >
              Reserve your spot
            </Link>
          </div>
        </div>

        {/* What's included — Wild Things / Thermal style */}
        <section className="mt-12">
          <h2 className="font-serif text-2xl text-ink">What&apos;s included</h2>
          <ul className="mt-4 space-y-2">
            {detail.whatIncluded.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-ink">
                <span className="text-sage mt-0.5">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Trip highlights — Thermal style */}
        {detail.highlights.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl text-ink">Trip highlights</h2>
            <div className="mt-6 space-y-8">
              {detail.highlights.map((h, i) => (
                <div key={i}>
                  <h3 className="font-semibold text-ink">{h.title}</h3>
                  <p className="mt-2 text-warm-gray leading-relaxed">{h.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Location / About the place — Wild Things + Airbnb */}
        {detail.locationDescription && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl text-ink">About the location</h2>
            <p className="mt-4 leading-relaxed text-warm-gray">{detail.locationDescription}</p>
          </section>
        )}

        {/* A typical day — Wild Things / Thermal */}
        {detail.typicalDay && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl text-ink">A typical day</h2>
            <p className="mt-4 leading-relaxed text-warm-gray">{detail.typicalDay}</p>
          </section>
        )}

        {/* Accommodation / Pick your room — Wild Things + Thermal */}
        {(detail.roomTypes?.length ?? 0) > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl text-ink">Pick your room</h2>
            {detail.accommodationNote && (
              <p className="mt-2 text-sm text-warm-gray">{detail.accommodationNote}</p>
            )}
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
                      <span className="ml-2 text-xs font-semibold text-warm-gray">Sold out</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* FAQs — Thermal style */}
        {detail.faqs.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl text-ink">FAQs</h2>
            <RetreatDetailClient faqs={detail.faqs} />
          </section>
        )}

        {/* Payment & cancellation — Thermal / Wild Things */}
        {(detail.depositPolicy || detail.cancellationPolicy) && (
          <section className="mt-12 rounded-2xl border border-onda-border bg-card-bg p-6">
            <h2 className="font-serif text-2xl text-ink">Payment & cancellation</h2>
            {detail.depositPolicy && (
              <p className="mt-4 text-sm text-warm-gray"><strong className="text-ink">Deposit:</strong> {detail.depositPolicy}</p>
            )}
            {detail.cancellationPolicy && (
              <p className="mt-2 text-sm text-warm-gray"><strong className="text-ink">Cancellation:</strong> {detail.cancellationPolicy}</p>
            )}
          </section>
        )}

        {/* COVID policy — Wild Things */}
        {detail.covidPolicy && (
          <div className="mt-8 rounded-xl border border-clay/30 bg-status-pending/30 px-4 py-3">
            <p className="text-sm text-ink"><strong>COVID-19:</strong> {detail.covidPolicy}</p>
          </div>
        )}

        {/* CTA + Contact */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-6 border-t border-onda-border pt-10">
          <div>
            <Link
              href={bookHref}
              className="inline-block rounded-full bg-sage px-8 py-4 text-base font-semibold text-white hover:bg-sage-light"
            >
              Reserve your spot
            </Link>
            <p className="mt-3 text-sm text-warm-gray">
              Secure your spot with a deposit. Balance due before the retreat.
            </p>
          </div>
          {detail.contactEmail && (
            <p className="text-sm text-warm-gray">
              Questions? <a href={`mailto:${detail.contactEmail}`} className="text-sage hover:underline">{detail.contactEmail}</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
