'use client';

import { useState, useEffect } from 'react';
import type { Attendee } from '@/lib/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { removeAttendee } from '@/lib/actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import Image from 'next/image';

interface AttendeesTableProps {
  attendees: Attendee[];
}

export function AttendeesTable({ attendees }: AttendeesTableProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDelete = async (attendeeId: string) => {
    setIsDeleting(attendeeId);
    const result = await removeAttendee(attendeeId);
    if (result.message) {
      toast({
        title: result.message,
        variant: result.message.includes('Gagal') ? 'destructive' : 'default',
      });
    }
    setIsDeleting(null);
  };
  
  if (attendees.length === 0) {
    return (
      <div className="text-center py-12 px-6 bg-card rounded-lg border border-dashed">
        <h3 className="text-xl font-medium text-muted-foreground">Belum ada peserta</h3>
        <p className="text-muted-foreground mt-2">Data peserta akan muncul di sini setelah mereka mengisi absensi.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Lengkap</TableHead>
            <TableHead>Jurusan/Jabatan</TableHead>
            <TableHead>NIM/NIP</TableHead>
            <TableHead>Jam Datang</TableHead>
            <TableHead>Tanda Tangan</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendees.map((attendee) => (
            <TableRow key={attendee.id}>
              <TableCell className="font-medium">{attendee.name}</TableCell>
              <TableCell>{attendee.department}</TableCell>
              <TableCell>{attendee.studentId}</TableCell>
              <TableCell>{isClient ? format(new Date(attendee.arrivalTime), 'HH:mm:ss', { locale: id }) : '...'}</TableCell>
              <TableCell>
                <Image
                  src={attendee.signature}
                  alt={`Tanda tangan ${attendee.name}`}
                  width={120}
                  height={60}
                  className="bg-secondary p-1 rounded-md"
                />
              </TableCell>
              <TableCell className="text-right">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus Data Peserta?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Anda yakin ingin menghapus data kehadiran untuk <strong>{attendee.name}</strong>? Tindakan ini tidak dapat diurungkan.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting === attendee.id}>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(attendee.id)} disabled={isDeleting === attendee.id} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting === attendee.id ? 'Menghapus...' : 'Hapus'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
