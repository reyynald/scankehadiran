'use client';

import { notFound, useParams } from "next/navigation";
import { isPast } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, Loader } from "lucide-react";
import AttendanceForm from "./form";
import { PageHeader } from "@/components/common/page-header";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import type { Session } from "@/lib/types";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

function SessionLoadingSkeleton() {
    return (
        <div className="w-full max-w-2xl">
            <header className="mb-8">
                <Skeleton className="h-10 w-3/4 mb-4" />
                <Skeleton className="h-6 w-1/2" />
            </header>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="space-y-2">
                           <Skeleton className="h-4 w-24" />
                           <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                           <Skeleton className="h-4 w-24" />
                           <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                           <Skeleton className="h-4 w-24" />
                           <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                           <Skeleton className="h-4 w-24" />
                           <Skeleton className="h-48 w-full" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}


export default function AttendPage() {
    const params = useParams();
    const sessionId = params.sessionId as string;
    const firestore = useFirestore();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const sessionRef = useMemoFirebase(() => {
        if (!firestore || !sessionId) return null;
        return doc(firestore, 'sessions', sessionId);
    }, [firestore, sessionId]);

    const { data: sessionData, isLoading } = useDoc<Omit<Session, 'expiresAt' | 'createdAt'> & { expiresAt: any, createdAt: any }>(sessionRef);
    
    if (isLoading) {
        return (
             <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
                <SessionLoadingSkeleton />
            </main>
        );
    }
    
    const session = sessionData ? {
        ...sessionData,
        expiresAt: sessionData.expiresAt.toDate(),
        createdAt: sessionData.createdAt.toDate(),
    } : null;

    if (!session) {
        notFound();
    }

    const sessionExpired = isClient && isPast(session.expiresAt);

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
                <AttendanceForm session={session} />
                </CardContent>
            </Card>
            )}
        </div>
        </main>
    );
}
