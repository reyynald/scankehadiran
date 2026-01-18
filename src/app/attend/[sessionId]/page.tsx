import { getSession } from "@/lib/data";
import { notFound } from "next/navigation";
import { isPast } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import AttendanceForm from "./form";
import { PageHeader } from "@/components/common/page-header";

export default async function AttendPage({ params }: { params: { sessionId: string } }) {
  const session = await getSession(params.sessionId);

  if (!session) {
    notFound();
  }

  const sessionExpired = isPast(session.expiresAt);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        <PageHeader title="Formulir Kehadiran" subtitle={session.title} />

        {sessionExpired ? (
          <Card className="w-full border-destructive bg-destructive/10 text-destructive-foreground">
            <CardHeader className="items-center text-center">
              <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
              <CardTitle className="font-headline text-2xl text-destructive">
                Sesi Telah Berakhir
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-destructive">
                Mohon maaf, sesi kehadiran ini telah ditutup dan tidak dapat menerima masukan lagi.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Isi Data Diri Anda</CardTitle>
              <CardDescription>
                Pastikan semua data yang Anda masukkan sudah benar sebelum mengirim.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AttendanceForm sessionId={session.id} />
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
