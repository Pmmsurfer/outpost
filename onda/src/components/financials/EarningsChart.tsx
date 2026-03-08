"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/financials";

export interface EarningsChartProps {
  monthlyData: { month: string; gross: number; net: number }[];
  className?: string;
}

function formatMonth(key: string): string {
  const [y, m] = key.split("-");
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export function EarningsChart({ monthlyData, className = "" }: EarningsChartProps) {
  const data = monthlyData.map((d) => ({
    ...d,
    monthLabel: formatMonth(d.month),
    grossDisplay: formatCurrency(d.gross),
    netDisplay: formatCurrency(d.net),
  }));

  if (data.length < 2) {
    return (
      <section className={`rounded-2xl border border-onda-border bg-card-bg p-8 ${className}`}>
        <h2 className="font-serif text-xl text-ink">Earnings over time</h2>
        <p className="mt-6 text-warm-gray">
          More data will appear here as you get bookings.
        </p>
      </section>
    );
  }

  return (
    <section className={`rounded-2xl border border-onda-border bg-card-bg p-6 ${className}`}>
      <h2 className="font-serif text-xl text-ink mb-6">Earnings over time</h2>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D8D2C4" vertical={false} />
            <XAxis
              dataKey="monthLabel"
              tick={{ fill: "#8A8478", fontSize: 12 }}
              axisLine={{ stroke: "#D8D2C4" }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `$${v / 100}`}
              tick={{ fill: "#8A8478", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FDFAF5",
                border: "1px solid #D8D2C4",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [formatCurrency(value), ""]}
              labelFormatter={(label) => label}
            />
            <Legend
              formatter={(value) => (
                <span className="text-sm text-ink">{value}</span>
              )}
            />
            <Bar
              dataKey="gross"
              name="Gross revenue"
              fill="#1A1A14"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
            <Bar
              dataKey="net"
              name="Net earnings"
              fill="#4A6741"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
