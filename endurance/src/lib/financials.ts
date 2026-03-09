/**
 * Types and helpers for the Financials page.
 */

export type DateRangeKey = "this_month" | "last_month" | "last_3_months" | "last_12_months" | "all_time";

export type HostPlan = "free" | "pro" | "studio";

export const PLATFORM_FEE_RATE: Record<HostPlan, number> = {
  free: 0.1,
  pro: 0.05,
  studio: 0.03,
};

export const STRIPE_FEE_PERCENT = 0.029;
export const STRIPE_FEE_FIXED_CENTS = 30;

export function getPlatformFeeCents(grossCents: number, plan: HostPlan): number {
  return Math.round(grossCents * PLATFORM_FEE_RATE[plan]);
}

export function getStripeFeeCents(grossCents: number): number {
  return Math.round(grossCents * STRIPE_FEE_PERCENT) + STRIPE_FEE_FIXED_CENTS;
}

export function getNetCents(
  grossCents: number,
  platformFeeCents: number,
  stripeFeeCents: number
): number {
  return grossCents - platformFeeCents - stripeFeeCents;
}

export interface FinancialsBooking {
  id: string;
  retreatId: string;
  retreatName: string;
  retreatStartDate: string;
  retreatEndDate: string;
  guestName: string;
  totalCents: number;
  status: "confirmed" | "pending" | "cancelled";
  bookedAt: string;
  stripeFeeCents: number | null;
  stripePaymentId: string | null;
  paymentType: "deposit" | "balance" | "refund";
  paymentStatus: "paid" | "pending" | "refunded";
}

export interface RetreatWithEarnings {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  capacity: number;
  confirmedCount: number;
  grossCents: number;
  platformFeeCents: number;
  stripeFeeCents: number;
  netCents: number;
  status: "upcoming" | "in_progress" | "completed";
}

export function getRetreatStatus(startDate: string, endDate: string): "upcoming" | "in_progress" | "completed" {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "in_progress";
  return "completed";
}

export function getDateRangeBounds(key: DateRangeKey): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  let start: Date;
  switch (key) {
    case "this_month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "last_month":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end.setTime(new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).getTime());
      break;
    case "last_3_months":
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      break;
    case "last_12_months":
      start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      break;
    case "all_time":
      start = new Date(2010, 0, 1);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return { start, end };
}

export function formatCurrency(cents: number, signed = false): string {
  const n = cents / 100;
  const str = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(n));
  if (signed && n < 0) return `−$${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return str;
}
