'use server';

import { z } from 'zod';
import { createSession, updateSession, deleteSession, createAttendee, deleteAttendee, getSession } from './data';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const sessionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, 'Judul harus memiliki minimal 3 karakter.'),
  expiresAt: z.coerce.date({
    required_error: 'Tanggal dan waktu berakhir wajib diisi.',
  }),
});

export async function saveSession(prevState: any, formData: FormData) {
  const validatedFields = sessionSchema.safeParse({
    id: formData.get('id') || undefined,
    title: formData.get('title'),
    expiresAt: formData.get('expiresAt'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Gagal menyimpan sesi. Mohon periksa kembali isian Anda.',
    };
  }
  
  const { id, ...data } = validatedFields.data;

  try {
    if (id) {
      await updateSession(id, data);
    } else {
      await createSession(data);
    }
  } catch (e) {
    return { message: 'Database Error: Gagal menyimpan sesi.' };
  }

  revalidatePath('/');
  return { message: 'Sesi berhasil disimpan.', success: true };
}

export async function removeSession(sessionId: string) {
    try {
        await deleteSession(sessionId);
        revalidatePath('/');
        return { message: 'Sesi berhasil dihapus.' };
    } catch (e) {
        return { message: 'Database Error: Gagal menghapus sesi.' };
    }
}

const attendeeSchema = z.object({
  name: z.string().min(3, 'Nama lengkap wajib diisi.'),
  department: z.string().min(2, 'Jurusan/Jabatan wajib diisi.'),
  studentId: z.string().min(3, 'NIM/NIP wajib diisi.'),
  signature: z.string().min(1, 'Tanda tangan wajib diisi.'),
  arrivalTime: z.coerce.date(),
});

export async function submitAttendance(sessionId: string, prevState: any, formData: FormData) {
  const session = await getSession(sessionId);
  if (!session || new Date() > session.expiresAt) {
    return { message: 'Sesi ini telah berakhir atau tidak valid.' };
  }

  const validatedFields = attendeeSchema.safeParse({
    name: formData.get('name'),
    department: formData.get('department'),
    studentId: formData.get('studentId'),
    signature: formData.get('signature'),
    arrivalTime: formData.get('arrivalTime'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Gagal mengirim kehadiran. Mohon periksa kembali isian Anda.',
    };
  }

  try {
    await createAttendee({
      ...validatedFields.data,
      sessionId,
    });
  } catch (e) {
    return { message: 'Database Error: Gagal menyimpan kehadiran.' };
  }
  
  revalidatePath('/');
  revalidatePath(`/attend/${sessionId}`);
  redirect(`/attend/${sessionId}/success`);
}

export async function removeAttendee(attendeeId: string) {
    try {
        await deleteAttendee(attendeeId);
        revalidatePath('/');
        return { message: 'Data peserta berhasil dihapus.' };
    } catch (e) {
        return { message: 'Database Error: Gagal menghapus data peserta.' };
    }
}
