export interface Session {
  id: string;
  title: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface Attendee {
  id: string;
  sessionId: string;
  name: string;
  department: string;
  studentId: string;
  arrivalTime: Date;
  signature: string; // base64 data URL
}
