"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function PayoutSummary() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [payouts, setPayouts] = useState<{ next?: { amount: number; date: string }; last?: { amount: number; date: string }; total?: number } | null>(null);

  useEffect(() => {
    // TODO: call API that checks Stripe Connect and fetches payouts from Stripe
    setConnected(false);
    setPayouts(null);
  }, []);

  return (
    <section className="rounded-2xl border border-onda-border bg-card-bg p-6">
      <h2 className="font-serif text-xl text-ink">Payouts</h2>
      {connected === true && payouts && (
        <div className="mt-6 space-y-3">
          {payouts.next && (
            <p className="text-ink">
              Next payout:{" "}
              <span className="font-semibold text-sage">
                ${(payouts.next.amount / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>{" "}
              on {new Date(payouts.next.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
          {payouts.last && (
            <p className="text-ink">
              Last payout:{" "}
              <span className="font-semibold text-sage">
                ${(payouts.last.amount / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>{" "}
              on {new Date(payouts.last.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
          {payouts.total != null && (
            <p className="text-ink">
              Total paid out:{" "}
              <span className="font-semibold text-sage">
                ${(payouts.total / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>{" "}
              all time
            </p>
          )}
          <p className="pt-2">
            <a
              href="https://dashboard.stripe.com/payouts"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-sage hover:underline"
            >
              Manage payouts →
            </a>
          </p>
        </div>
      )}
      {connected === false && (
        <div className="mt-6 rounded-xl border border-clay/40 bg-status-pending/20 p-6">
          <p className="font-medium text-ink">Connect your bank account to receive payouts</p>
          <p className="mt-1 text-sm text-warm-gray">
            Link your Stripe account to get paid for your retreat bookings.
          </p>
          <Link
            href="/dashboard/settings#payouts"
            className="mt-4 inline-block rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white hover:bg-sage-light"
          >
            Connect with Stripe →
          </Link>
        </div>
      )}
      {connected === null && (
        <p className="mt-6 text-warm-gray">Loading payout status…</p>
      )}
    </section>
  );
}
