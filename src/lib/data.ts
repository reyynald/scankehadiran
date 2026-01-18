'use server';

import type { Session, Attendee } from './types';

// In-memory store
let sessions: Session[] = [
  {
    id: '1',
    title: 'Rapat Koordinasi Awal Tahun',
    createdAt: new Date('2024-07-20T09:00:00'),
    expiresAt: new Date('2024-07-20T10:00:00'),
  },
  {
    id: '2',
    title: 'Workshop Pengembangan Kurikulum',
    createdAt: new Date('2024-07-21T13:00:00'),
    expiresAt: new Date('2024-07-31T14:00:00'),
  },
];

let attendees: Attendee[] = [];
let nextSessionId = 3;
let nextAttendeeId = 1;

// To prevent data loss on hot-reloads in development
if (process.env.NODE_ENV !== 'production') {
  if (!(global as any).sessions) {
    (global as any).sessions = sessions;
    (global as any).attendees = attendees;
  }
  sessions = (global as any).sessions;
  attendees = (global as any).attendees;
}

export async function getSessions(): Promise<Session[]> {
  return sessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getSession(id: string): Promise<Session | undefined> {
  return sessions.find((s) => s.id === id);
}

export async function createSession(data: Omit<Session, 'id' | 'createdAt'>): Promise<Session> {
  const newSession: Session = {
    ...data,
    id: String(nextSessionId++),
    createdAt: new Date(),
  };
  sessions.push(newSession);
  return newSession;
}

export async function updateSession(id: string, data: Partial<Omit<Session, 'id'>>): Promise<Session | null> {
  const sessionIndex = sessions.findIndex((s) => s.id === id);
  if (sessionIndex === -1) return null;

  sessions[sessionIndex] = { ...sessions[sessionIndex], ...data };
  return sessions[sessionIndex];
}

export async function deleteSession(id: string): Promise<boolean> {
  const initialLength = sessions.length;
  sessions = sessions.filter((s) => s.id !== id);
  // Also delete associated attendees
  attendees = attendees.filter((a) => a.sessionId !== id);
  return sessions.length < initialLength;
}

export async function getAttendees(): Promise<Attendee[]> {
  return attendees;
}


export async function getAttendeesForSession(sessionId: string): Promise<Attendee[]> {
  return attendees.filter((a) => a.sessionId === sessionId);
}

export async function createAttendee(data: Omit<Attendee, 'id'>): Promise<Attendee> {
  const newAttendee: Attendee = {
    ...data,
    id: String(nextAttendeeId++),
  };
  attendees.push(newAttendee);
  return newAttendee;
}

export async function deleteAttendee(id: string): Promise<boolean> {
  const initialLength = attendees.length;
  attendees = attendees.filter((a) => a.id !== id);
  return attendees.length < initialLength;
}
