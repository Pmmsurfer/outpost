import Link from "next/link";
import Image from "next/image";
import { Globe, CreditCard, Users, Share2, MessageCircle, BarChart2 } from "lucide-react";

const HERO_RETREATS = [
  {
    title: "Cascadia 50K Trail Run",
    host: "Northwest Endurance",
    location: "Cascade Mountains, USA",
    price: "189",
    image: "https://images.unsplash.com/photo-1527489377706-5bf97e608852?w=800&q=80",
  },
  {
    title: "Coastal Marathon Weekend",
    host: "Blue Shore Events",
    location: "San Sebastian, Spain",
    price: "129",
    image: "https://images.unsplash.com/photo-1546484959-f9a9ae384058?w=800&q=80",
  },
  {
    title: "Alpine Triathlon Camp",
    host: "Summit Performance",
    location: "St. Moritz, Switzerland",
    price: "849",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80",
  },
];

const FEATURES = [
  { Icon: Globe, title: "Race sites that convert", description: "A public listing page athletes trust. Distances, course maps, cutoffs, and one-click registration." },
  { Icon: CreditCard, title: "Payments & add-ons", description: "Sell entries, merch, and extras. Stripe-powered with automatic payouts to your bank account." },
  { Icon: Users, title: "Participant management", description: "See who&apos;s registered, pace goals, waivers, emergency contacts, and corral assignments in one place." },
  { Icon: Share2, title: "Share tools", description: "Custom registration link, embeddable widget, and ready-to-post assets for your social channels." },
  { Icon: MessageCircle, title: "Message your athletes", description: "Broadcast race week updates, logistics, and last-minute changes to the right segments." },
  { Icon: BarChart2, title: "Financials dashboard", description: "Track entries, revenue, fees, and payouts across your entire race calendar." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      {/* 1. Nav */}
      <nav className="sticky top-0 z-[200] flex flex-wrap items-center justify-between gap-4 border-b border-onda-border bg-card-bg px-6 py-4 sm:px-8">
        <Link href="/" className="font-serif text-[22px] tracking-tight text-ink">
          Outpost Endurance
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/explore" className="text-sm font-medium text-warm-gray hover:text-ink transition-colors">
            Explore events
          </Link>
          <Link href="/login" className="text-sm font-medium text-warm-gray hover:text-ink transition-colors">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage-light transition-colors"
          >
            List your event
          </Link>
        </div>
      </nav>

      {/* 2. Hero */}
      <section className="bg-cream px-6 pt-24 pb-20 sm:px-8 sm:pt-24 sm:pb-28">
        <div className="mx-auto max-w-6xl">
          <h1 className="font-serif text-5xl leading-tight tracking-tight text-ink sm:text-[64px] lg:text-7xl">
            Your endurance event, beautifully managed
          </h1>
          <p className="mt-6 max-w-lg text-lg text-warm-gray font-sans">
            Outpost Endurance gives race directors and event organizers a registration site, participant management, and payments — purpose-built for endurance events.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/signup"
              className="inline-flex rounded-full bg-sage px-6 py-3 text-sm font-semibold text-white hover:bg-sage-light transition-colors"
            >
              List your event free →
            </Link>
            <Link
              href="/explore"
              className="inline-flex rounded-full border-2 border-onda-border bg-transparent px-6 py-3 text-sm font-semibold text-ink hover:border-warm-gray hover:bg-card-bg transition-colors"
            >
              Browse events
            </Link>
          </div>
          <p className="mt-4 text-sm text-warm-gray">
            Free to start · No credit card required
          </p>

          {/* Hero retreat cards */}
          <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {HERO_RETREATS.map((r) => (
              <Link
                key={r.title}
                href="/explore"
                className="group block overflow-hidden rounded-2xl border border-onda-border bg-card-bg text-left no-underline text-inherit transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="h-48 min-h-[12rem] overflow-hidden bg-onda-border relative">
                  <Image
                    src={r.image}
                    alt=""
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-lg font-normal text-ink">{r.title}</h3>
                  <p className="mt-1 text-sm text-warm-gray">{r.host} · {r.location}</p>
                  <p className="mt-2 text-[15px] font-semibold text-ink">
                    ${r.price} <span className="font-normal text-warm-gray">per person</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Social proof bar */}
      <section className="border-t border-onda-border bg-[#EDE8DF] py-6">
        <p className="text-center text-sm text-warm-gray font-sans">
          Built for marathons · half marathons · trail ultras · triathlons · cycling fondos · endurance camps
        </p>
      </section>

      {/* 4. How it works */}
      <section className="border-t border-onda-border bg-card-bg px-6 py-24 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-3xl tracking-tight text-ink sm:text-4xl">
            From race idea to sold out in minutes
          </h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            <div>
              <span className="font-serif text-3xl text-clay">01</span>
              <h3 className="mt-3 font-sans text-lg font-semibold text-ink">
                Create your event listing
              </h3>
              <p className="mt-2 text-warm-gray font-sans">
                Add distances, course details, pricing, and cutoffs. Your public registration page is live instantly.
              </p>
            </div>
            <div>
              <span className="font-serif text-3xl text-clay">02</span>
              <h3 className="mt-3 font-sans text-lg font-semibold text-ink">
                Share with your audience
              </h3>
              <p className="mt-2 text-warm-gray font-sans">
                Get a custom booking link and a ready-to-post Instagram card. One tap to share with your followers.
              </p>
            </div>
            <div>
              <span className="font-serif text-3xl text-clay">03</span>
              <h3 className="mt-3 font-sans text-lg font-semibold text-ink">
                Manage everything in one dashboard
              </h3>
              <p className="mt-2 text-warm-gray font-sans">
                Participant list, payments, waivers, and race-day logistics — all in your Outpost dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Features */}
      <section className="border-t border-onda-border bg-cream px-6 py-24 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-3xl tracking-tight text-ink sm:text-4xl">
            Everything you need, nothing you don&apos;t
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.Icon;
              return (
                <div
                  key={f.title}
                  className="rounded-xl border border-onda-border bg-card-bg p-6 transition-shadow hover:shadow-lg"
                >
                  <Icon className="h-8 w-8 text-sage" aria-hidden />
                  <h3 className="mt-3 font-sans text-lg font-semibold text-ink">{f.title}</h3>
                  <p className="mt-2 text-sm text-warm-gray font-sans">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Pricing */}
      <section className="border-t border-onda-border bg-card-bg px-6 py-24 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-3xl tracking-tight text-ink sm:text-4xl">
            Start free. Grow your race series.
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3 items-stretch">
            <div className="rounded-2xl border border-onda-border bg-card-bg p-6 flex flex-col">
              <h3 className="font-sans text-lg font-semibold text-ink">Starter</h3>
              <p className="mt-2 font-serif text-2xl text-ink">
                $0<span className="text-base font-sans font-normal text-warm-gray">/mo</span>
              </p>
              <p className="mt-1 text-sm text-warm-gray">6% fee per entry</p>
              <p className="mt-4 text-sm text-ink flex-1">Unlimited events, registration page, participant management</p>
            </div>
            <div className="rounded-2xl border-2 border-sage bg-card-bg p-6 flex flex-col shadow-lg relative sm:-mt-2 sm:mb-2">
              <h3 className="font-sans text-lg font-semibold text-ink">Growth</h3>
              <p className="mt-2 font-serif text-2xl text-ink">
                $49<span className="text-base font-sans font-normal text-warm-gray">/mo</span>
              </p>
              <p className="mt-1 text-sm text-warm-gray">4% fee per entry</p>
              <p className="mt-4 text-sm text-ink flex-1">Everything in Starter + priority support, custom domain</p>
            </div>
            <div className="rounded-2xl border border-onda-border bg-card-bg p-6 flex flex-col">
              <h3 className="font-sans text-lg font-semibold text-ink">Scale</h3>
              <p className="mt-2 font-serif text-2xl text-ink">
                $149<span className="text-base font-sans font-normal text-warm-gray">/mo</span>
              </p>
              <p className="mt-1 text-sm text-warm-gray">2% fee per entry</p>
              <p className="mt-4 text-sm text-ink flex-1">Everything in Growth + team seats, white-label options</p>
            </div>
          </div>
          <p className="mt-6 text-center text-sm text-warm-gray">
            First 60 days free on any paid plan. Stripe fees (2.9% + 30¢) are passed through.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/signup"
              className="inline-flex rounded-full bg-sage px-6 py-3 text-sm font-semibold text-white hover:bg-sage-light transition-colors"
            >
              Get started for free →
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Final CTA */}
      <section className="border-t border-onda-border bg-ink px-6 py-24 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl tracking-tight text-card-bg sm:text-4xl">
            Ready to fill your next start line?
          </h2>
          <p className="mt-4 text-lg text-card-bg/90 font-sans">
            Join organizers already using Outpost Endurance to manage registrations, participants, and payments.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex rounded-full bg-sage px-6 py-3 text-sm font-semibold text-white hover:bg-sage-light transition-colors"
          >
            List your event free →
          </Link>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-onda-border bg-card-bg px-6 py-6 sm:px-8">
        <div className="flex gap-6 text-sm text-warm-gray">
          <Link href="/dashboard" className="hover:text-ink transition-colors">For hosts</Link>
          <a href="#" className="hover:text-ink transition-colors">Privacy</a>
          <a href="#" className="hover:text-ink transition-colors">Terms</a>
        </div>
        <span className="text-sm text-warm-gray">© 2026 Outpost</span>
      </footer>
    </div>
  );
}
