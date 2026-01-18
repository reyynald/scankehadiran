'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Session } from '@/lib/types';
import { saveSession } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface SessionDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  session: Session | null;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Menyimpan...' : 'Simpan'}
    </Button>
  );
}

export function SessionDialog({ isOpen, setIsOpen, session }: SessionDialogProps) {
  const { toast } = useToast();
  const initialState = { message: null, errors: {}, success: false };
  const [state, dispatch] = useActionState(saveSession, initialState);

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.message,
        variant: state.errors ? 'destructive' : 'default',
      });
    }
    if (state.success) {
      setIsOpen(false);
    }
  }, [state, toast, setIsOpen]);

  const dialogTitle = session ? 'Edit Sesi' : 'Buat Sesi Baru';
  const dialogDescription = session
    ? 'Ubah detail sesi kehadiran Anda.'
    : 'Buat sesi baru untuk mulai mengumpulkan data kehadiran.';

  // Format date for datetime-local input
  const formatDateTimeLocal = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };
  
  const defaultExpiresAt = new Date();
  defaultExpiresAt.setHours(defaultExpiresAt.getHours() + 1);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <form action={dispatch} className="grid gap-6 py-4">
          {session?.id && <input type="hidden" name="id" value={session.id} />}
          <div className="grid gap-2">
            <Label htmlFor="title">Judul Sesi</Label>
            <Input
              id="title"
              name="title"
              defaultValue={session?.title || ''}
              placeholder="cth. Rapat Bulanan"
              required
            />
            {state.errors?.title && <p className="text-sm text-destructive">{state.errors.title[0]}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="expiresAt">Waktu Berakhir</Label>
            <Input
              id="expiresAt"
              name="expiresAt"
              type="datetime-local"
              defaultValue={formatDateTimeLocal(session?.expiresAt || defaultExpiresAt)}
              required
            />
             {state.errors?.expiresAt && <p className="text-sm text-destructive">{state.errors.expiresAt[0]}</p>}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
            <SubmitButton />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
