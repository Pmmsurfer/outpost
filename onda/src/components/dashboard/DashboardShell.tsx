"use client";

import { useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-cream">
      <DashboardSidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopBar onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="min-w-0 flex-1 px-4 pt-6 pb-12 sm:px-6 sm:pt-8 lg:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}
