'use client';

import { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SignaturePad } from '@/components/attendance/signature-pad';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import type { Session } from '@/lib/types';
import { isPast } from 'date-fns';

interface AttendanceFormProps {
  session: Session;
}

const formSchema = z.object({
  name: z.string().min(3, 'Nama lengkap minimal 3 karakter.'),
  department: z.string().min(2, 'Jurusan/Jabatan minimal 2 karakter.'),
  studentId: z.string().min(3, 'NIM/NIP minimal 3 karakter.'),
  signature: z.string().nonempty('Tanda tangan tidak boleh kosong.'),
});

type FormData = z.infer<typeof formSchema>;

export default function AttendanceForm({ session }: AttendanceFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      department: '',
      studentId: '',
      signature: '',
    },
  });

  const { formState: { isSubmitting }, handleSubmit, register, control, setValue } = form;

  const onSubmit = (data: FormData) => {
    if (!firestore) {
        toast({ title: "Database tidak terhubung.", variant: "destructive" });
        return;
    }

    if (isPast(session.expiresAt)) {
        toast({ title: "Sesi telah berakhir.", variant: "destructive" });
        return;
    }

    const attendanceCollection = collection(firestore, 'sessions', session.id, 'attendance_records');
    
    addDocumentNonBlocking(attendanceCollection, {
        ...data,
        sessionId: session.id,
        arrivalTime: serverTimestamp()
    });

    toast({ title: "Kehadiran berhasil direkam!" });
    router.push(`/attend/${session.id}/success`);
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap</FormLabel>
              <FormControl>
                <Input placeholder="cth. John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jurusan / Jabatan</FormLabel>
              <FormControl>
                <Input placeholder="cth. Teknik Informatika / Staf" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>NIM / NIP</FormLabel>
              <FormControl>
                <Input placeholder="cth. 123456789" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="signature"
          render={() => (
            <FormItem>
              <FormLabel>Tanda Tangan Digital</FormLabel>
              <FormControl>
                <>
                  <SignaturePad name="signature" />
                  <input type="hidden" {...register('signature')} />
                </>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
       
        <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Mengirim...' : 'Kirim Kehadiran'}
        </Button>
      </form>
    </FormProvider>
  );
}
