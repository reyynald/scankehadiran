import DashboardClient from "@/components/dashboard/dashboard-client";
import { PageHeader } from "@/components/common/page-header";

export default function AdminDashboardPage() {
  return (
    <main className="flex flex-col flex-1 bg-muted/40 p-4 md:p-8">
      <PageHeader
        title="Dasbor Admin"
        subtitle="Kelola sesi kehadiran, lihat data peserta, dan ekspor laporan."
      />
      <DashboardClient />
    </main>
  );
}
