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

export default function DashboardSidebar({
  mobileOpen = false,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
        />
      )}
      <aside
        className={`flex w-[260px] flex-shrink-0 flex-col border-r border-onda-border bg-card-bg transition-transform duration-200 ease-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-40 md:relative md:translate-x-0`}
      >
        <div className="flex items-center justify-between border-b border-onda-border p-4 pr-4 md:p-6">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="font-serif text-[22px] tracking-tight text-ink"
          >
            Outpos<span className="text-sage">t</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded p-2 text-warm-gray hover:bg-warm-gray/10 hover:text-ink md:hidden"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-0 py-5">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} onClick={onClose}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(href + "/"));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex min-h-[44px] items-center gap-3 border-l-4 py-3 pl-6 pr-6 text-sm font-medium transition-colors ${
        isActive
          ? "border-sage bg-[rgba(74,103,65,0.1)] text-sage"
          : "border-transparent text-warm-gray hover:bg-[rgba(74,103,65,0.06)] hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
