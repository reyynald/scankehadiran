'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { submitAttendance } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SignaturePad } from '@/components/attendance/signature-pad';

interface AttendanceFormProps {
  sessionId: string;
}

const formSchema = z.object({
  name: z.string().min(3, 'Nama lengkap minimal 3 karakter.'),
  department: z.string().min(2, 'Jurusan/Jabatan minimal 2 karakter.'),
  studentId: z.string().min(3, 'NIM/NIP minimal 3 karakter.'),
  signature: z.string().nonempty('Tanda tangan tidak boleh kosong.'),
  arrivalTime: z.string(),
});

type FormData = z.infer<typeof formSchema>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Mengirim...' : 'Kirim Kehadiran'}
    </Button>
  );
}

export default function AttendanceForm({ sessionId }: AttendanceFormProps) {
  const { toast } = useToast();
  const [arrivalTime, setArrivalTime] = useState('');

  useEffect(() => {
    setArrivalTime(new Date().toISOString());
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      department: '',
      studentId: '',
      signature: '',
      arrivalTime: '',
    },
  });

  useEffect(() => {
    if (arrivalTime) {
      form.setValue('arrivalTime', arrivalTime);
    }
  }, [arrivalTime, form]);
  
  const submitAttendanceWithId = submitAttendance.bind(null, sessionId);
  const [state, dispatch] = useActionState(submitAttendanceWithId, { message: null, errors: {} });

  useEffect(() => {
    if (state.message && !state.errors) {
        toast({ title: state.message, variant: 'destructive' });
    }
  }, [state, toast]);
  

  return (
    <Form {...form}>
      <form action={dispatch} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap</FormLabel>
              <FormControl>
                <Input placeholder="cth. John Doe" {...field} />
              </FormControl>
              <FormMessage />
              {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jurusan / Jabatan</FormLabel>
              <FormControl>
                <Input placeholder="cth. Teknik Informatika / Staf" {...field} />
              </FormControl>
              <FormMessage />
              {state.errors?.department && <p className="text-sm text-destructive">{state.errors.department[0]}</p>}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>NIM / NIP</FormLabel>
              <FormControl>
                <Input placeholder="cth. 123456789" {...field} />
              </FormControl>
              <FormMessage />
               {state.errors?.studentId && <p className="text-sm text-destructive">{state.errors.studentId[0]}</p>}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="signature"
          render={() => (
            <FormItem>
              <FormLabel>Tanda Tangan Digital</FormLabel>
              <FormControl>
                <>
                  <SignaturePad name="signature" />
                  <input type="hidden" {...form.register('signature')} />
                </>
              </FormControl>
              <FormMessage />
               {state.errors?.signature && <p className="text-sm text-destructive">{state.errors.signature[0]}</p>}
            </FormItem>
          )}
        />
        <input type="hidden" {...form.register('arrivalTime')} />

        <SubmitButton />
      </form>
    </Form>
  );
}
