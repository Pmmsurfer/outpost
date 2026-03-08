import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-cream">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopBar />
        <main className="min-w-0 flex-1 pt-8 px-12 pb-12">{children}</main>
      </div>
    </div>
  );
}
