'use server';

import { headers } from 'next/headers';
import { getSessions, getAttendees } from "@/lib/data";
import DashboardClient from "@/components/dashboard/dashboard-client";
import { PageHeader } from "@/components/common/page-header";

export default async function AdminDashboardPage() {
  const sessions = await getSessions();
  const attendees = await getAttendees();
  
  const headersList = headers();
  const host = headersList.get('host') || 'localhost:8000';
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const baseUrl = `${protocol}://${host}`;

  return (
    <main className="flex flex-col flex-1 bg-muted/40 p-4 md:p-8">
      <PageHeader
        title="Dasbor Admin"
        subtitle="Kelola sesi kehadiran, lihat data peserta, dan ekspor laporan."
      />
      <DashboardClient 
        initialSessions={sessions} 
        initialAttendees={attendees}
        baseUrl={baseUrl}
      />
    </main>
  );
}
