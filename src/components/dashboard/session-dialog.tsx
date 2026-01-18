'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Session } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';

interface SessionDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  session: Session | null;
}

const sessionSchema = z.object({
  title: z.string().min(3, 'Judul harus memiliki minimal 3 karakter.'),
  expiresAt: z.coerce.date({
    required_error: 'Tanggal dan waktu berakhir wajib diisi.',
  }),
});

type SessionFormData = z.infer<typeof sessionSchema>;

export function SessionDialog({ isOpen, setIsOpen, session }: SessionDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  
  // Format date for datetime-local input
  const formatDateTimeLocal = (date: Date) => {
    const d = new Date(date);
    // Adjust for timezone offset to display correctly in local time
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };
  
  const defaultExpiresAt = new Date();
  defaultExpiresAt.setHours(defaultExpiresAt.getHours() + 1);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      title: session?.title || '',
      expiresAt: session?.expiresAt || defaultExpiresAt,
    },
  });

  useEffect(() => {
    if (session) {
      reset({
        title: session.title,
        expiresAt: session.expiresAt,
      });
    } else {
      reset({
        title: '',
        expiresAt: defaultExpiresAt,
      });
    }
  }, [session, reset, defaultExpiresAt]);

  const onSubmit = (data: SessionFormData) => {
    if (!firestore) {
        toast({ title: 'Database tidak terhubung', variant: 'destructive' });
        return;
    }

    try {
        if (session) {
          // Update existing session
          const sessionRef = doc(firestore, 'sessions', session.id);
          updateDocumentNonBlocking(sessionRef, data);
          toast({ title: 'Sesi berhasil diperbarui.' });
        } else {
          // Create new session
          const sessionsCollection = collection(firestore, 'sessions');
          addDocumentNonBlocking(sessionsCollection, { ...data, createdAt: serverTimestamp() });
          toast({ title: 'Sesi baru berhasil dibuat.' });
        }
        setIsOpen(false);
    } catch(e) {
        toast({ title: 'Gagal menyimpan sesi.', variant: 'destructive'});
    }
  };

  const dialogTitle = session ? 'Edit Sesi' : 'Buat Sesi Baru';
  const dialogDescription = session
    ? 'Ubah detail sesi kehadiran Anda.'
    : 'Buat sesi baru untuk mulai mengumpulkan data kehadiran.';


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Judul Sesi</Label>
            <Input
              id="title"
              placeholder="cth. Rapat Bulanan"
              {...register('title')}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="expiresAt">Waktu Berakhir</Label>
            <Input
              id="expiresAt"
              type="datetime-local"
              defaultValue={formatDateTimeLocal(session?.expiresAt || defaultExpiresAt)}
              {...register('expiresAt')}
            />
            {errors.expiresAt && <p className="text-sm text-destructive">{errors.expiresAt.message}</p>}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
