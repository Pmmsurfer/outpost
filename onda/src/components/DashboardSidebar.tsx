"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/retreats", label: "My Retreats" },
  { href: "/dashboard/bookings", label: "Bookings" },
  { href: "/dashboard/financials", label: "Financials" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/share", label: "Share & Promote" },
];

export default function DashboardSidebar() {
  return (
    <aside className="flex w-[260px] flex-shrink-0 flex-col border-r border-onda-border bg-card-bg">
      <div className="border-b border-onda-border p-6">
        <Link href="/dashboard" className="font-serif text-[22px] tracking-tight text-ink">
          Outpos<span className="text-sage">t</span>
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-0 py-5">
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(href + "/"));

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 border-l-4 py-3 pl-6 pr-6 text-sm font-medium transition-colors ${
        isActive
          ? "border-sage bg-[rgba(74,103,65,0.1)] text-sage"
          : "border-transparent text-warm-gray hover:bg-[rgba(74,103,65,0.06)] hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
