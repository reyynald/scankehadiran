'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Session, Attendee } from '@/lib/types';
import { exportToCsv, exportToPdf } from '@/lib/export';
import { useToast } from '@/hooks/use-toast';
import { format, isPast } from 'date-fns';
import { id } from 'date-fns/locale';
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, collectionGroup, query, orderBy, doc, Timestamp, getDocs } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PlusCircle, FileDown, FileText, Edit, QrCode as QrCodeIcon, Trash2, Users } from 'lucide-react';
import { SessionDialog } from './session-dialog';
import { AttendeesTable } from './attendees-table';
import { QrCode as QrCodeComponent } from '@/components/common/qr-code';
import { Skeleton } from '../ui/skeleton';

function DashboardLoadingSkeleton() {
  return (
    <>
      <div className="flex justify-end mb-8">
        <Skeleton className="h-10 w-40" />
      </div>
       <div className="w-full space-y-4">
          {[...Array(2)].map((_, i) => (
             <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
      </div>
    </>
  );
}


export default function DashboardClient() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const sessionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'sessions'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const attendeesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collectionGroup(firestore, 'attendance_records');
  }, [firestore]);

  const { data: sessionsData, isLoading: sessionsLoading } = useCollection<Omit<Session, 'expiresAt' | 'createdAt'> & { expiresAt: Timestamp, createdAt: Timestamp }>(sessionsQuery);
  const { data: attendeesData, isLoading: attendeesLoading } = useCollection<Omit<Attendee, 'arrivalTime'> & { arrivalTime: Timestamp }>(attendeesQuery);
  
  const sessions: Session[] = useMemo(() => {
    return sessionsData?.map(s => ({
      ...s,
      createdAt: s.createdAt.toDate(),
      expiresAt: s.expiresAt.toDate(),
    })) ?? [];
  }, [sessionsData]);

  const attendees: Attendee[] = useMemo(() => {
    return attendeesData?.map(a => ({
      ...a,
      arrivalTime: a.arrivalTime.toDate(),
    })) ?? [];
  }, [attendeesData]);

  const [isSessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [attendUrl, setAttendUrl] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setBaseUrl(window.location.origin);
  }, []);

  const handleOpenCreateDialog = () => {
    setEditingSession(null);
    setSessionDialogOpen(true);
  };

  const handleOpenEditDialog = (session: Session) => {
    setEditingSession(session);
    setSessionDialogOpen(true);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!firestore) return;
    
    try {
      const attendeesRef = collection(firestore, 'sessions', sessionId, 'attendance_records');
      const attendeesSnapshot = await getDocs(attendeesRef);

      attendeesSnapshot.docs.forEach(docSnapshot => {
          deleteDocumentNonBlocking(docSnapshot.ref);
      });
      
      const sessionRef = doc(firestore, 'sessions', sessionId);
      deleteDocumentNonBlocking(sessionRef);
      
      toast({ title: 'Sesi dan semua data terkait akan dihapus.' });
    } catch(e: any) {
        toast({
            title: "Gagal menghapus data sesi.",
            description: e.message,
            variant: "destructive",
        });
    }
  };

  if (sessionsLoading || attendeesLoading) {
    return <DashboardLoadingSkeleton />;
  }

  return (
    <>
      <div className="flex justify-end mb-8">
        <Button onClick={handleOpenCreateDialog}>
          <PlusCircle className="mr-2" />
          Buat Sesi Baru
        </Button>
      </div>
      
      {sessions.length > 0 ? (
        <Accordion type="single" collapsible className="w-full space-y-4" defaultValue={sessions[0]?.id}>
          {sessions.map((session) => {
            const sessionAttendees = attendees.filter(att => att.sessionId === session.id);
            const sessionExpired = isClient ? isPast(new Date(session.expiresAt)) : false;

            return (
              <AccordionItem value={session.id} key={session.id} className="border-b-0 rounded-lg border bg-card text-card-foreground shadow-sm data-[state=open]:ring-2 data-[state=open]:ring-primary">
                <AccordionTrigger className="p-0 hover:no-underline [&>svg]:mx-4 [&[data-state=open]>div>div>h3]:text-primary">
                  <div className="flex flex-1 items-center justify-between p-4">
                      <div className="flex-1 pr-4">
                          <div className="flex items-center gap-4 mb-2">
                              <h3 className="font-headline text-lg text-left">{session.title}</h3>
                              <Badge variant={sessionExpired ? "destructive" : "secondary"} className="shrink-0">
                                  {sessionExpired ? 'Berakhir' : 'Aktif'}
                              </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1 text-left">
                              <p>Berakhir pada: {isClient ? format(new Date(session.expiresAt), "d MMMM yyyy, HH:mm", { locale: id }) : '...'}</p>
                              <div className="flex items-center">
                                  <Users className="w-4 h-4 mr-2" />
                                  <span>{sessionAttendees.length} Peserta</span>
                              </div>
                          </div>
                      </div>
                      <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                          <Dialog onOpenChange={(open) => open && setAttendUrl(`${baseUrl}/attend/${session.id}`)}>
                              <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                                  <QrCodeIcon className="w-4 h-4 sm:mr-2" />
                                  <span className="hidden sm:inline">Lihat QR</span>
                                  </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
                                  <DialogHeader>
                                  <DialogTitle>Scan untuk Absen</DialogTitle>
                                  <DialogDescription>
                                      Pindai kode QR ini untuk mengisi formulir kehadiran atau unduh untuk dibagikan.
                                  </DialogDescription>
                                  </DialogHeader>
                                  <div className="flex flex-col items-center justify-center p-4 gap-4">
                                      {attendUrl && <QrCodeComponent value={attendUrl} downloadFileName={`qr_${session.title}`} />}
                                  </div>
                                  <DialogFooter>
                                      <DialogClose asChild>
                                          <Button type="button" variant="secondary">Tutup</Button>
                                      </DialogClose>
                                  </DialogFooter>
                              </DialogContent>
                          </Dialog>

                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={(e) => { e.stopPropagation(); handleOpenEditDialog(session); }}>
                              <Edit className="w-4 h-4" />
                          </Button>

                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={(e) => { e.stopPropagation(); }}>
                                      <Trash2 className="w-4 h-4" />
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          Tindakan ini tidak dapat diurungkan. Ini akan menghapus sesi dan semua data kehadiran yang terkait secara permanen.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Batal</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteSession(session.id)} className="bg-destructive hover:bg-destructive/90">
                                          Hapus
                                      </AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                      </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="px-4 pb-4 pt-0">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center py-4 border-t gap-4">
                            <h4 className="font-semibold text-card-foreground">Data Peserta: {session.title}</h4>
                            <div className="flex gap-2 shrink-0">
                                <Button variant="outline" size="sm" onClick={() => exportToCsv(sessionAttendees, session.title)}>
                                    <FileDown className="mr-2" />
                                    Ekspor CSV
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => exportToPdf(sessionAttendees, session.title)}>
                                    <FileText className="mr-2" />
                                    Ekspor PDF
                                </Button>
                            </div>
                        </div>
                        <AttendeesTable attendees={sessionAttendees} />
                    </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      ) : (
        <div className="text-center py-12 px-6 rounded-lg border border-dashed bg-card">
            <h3 className="text-xl font-medium text-muted-foreground">Belum ada sesi</h3>
            <p className="text-muted-foreground mt-2">Buat sesi baru untuk memulai absensi.</p>
            <Button onClick={handleOpenCreateDialog} className="mt-4">
            <PlusCircle className="mr-2" />
            Buat Sesi
            </Button>
        </div>
      )}

      <SessionDialog
        isOpen={isSessionDialogOpen}
        setIsOpen={setSessionDialogOpen}
        session={editingSession}
      />
    </>
  );
}
