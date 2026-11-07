/**
 * CampusSphere domain model.
 * Mirrors the Supabase schema in supabase/migrations/0001_init.sql
 * (SQL uses snake_case columns; services translate between the two).
 */

export type Role = "student" | "coordinator" | "faculty" | "admin";

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface Student {
  profileId: string;
  usn: string;
  departmentId: string;
  semester: number;
}

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface Venue {
  id: string;
  name: string;
  location: string;
  capacity: number;
}

export type EventStatus =
  | "draft"
  | "pending" // awaiting super admin approval
  | "rejected"
  | "published" // approved & visible
  | "completed";

export interface EventItem {
  id: string;
  title: string;
  category: string;
  description: string;
  poster: string; // asset key (see src/assets/posters.ts) or gradient key
  date: string; // ISO date YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;
  venueId: string;
  fee: number; // INR, 0 = free
  capacity: number;
  regDeadline: string; // ISO date
  eligibility: string;
  rules: string[];
  facultyId: string; // assigned judge
  coordinatorId: string;
  status: EventStatus;
  teamSizeMin: number;
  teamSizeMax: number;
  featured: boolean;
  resultsPublished: boolean;
  scoresSubmitted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RegStatus = "confirmed" | "cancelled" | "attended";

export interface Registration {
  id: string;
  eventId: string;
  studentId: string; // profile id
  teamId: string | null;
  status: RegStatus;
  qrCode: string; // unique per registration
  createdAt: string;
  attendedAt: string | null;
}

export interface Team {
  id: string;
  eventId: string;
  name: string;
  leaderId: string; // profile id
  createdAt: string;
}

export interface TeamMember {
  teamId: string;
  studentId: string;
}

export interface AttendanceRecord {
  id: string;
  registrationId: string;
  eventId: string;
  checkedInAt: string;
}

export interface Score {
  id: string;
  eventId: string;
  registrationId: string;
  judgeId: string;
  innovation: number; // 0-10
  execution: number; // 0-10
  presentation: number; // 0-10
  total: number; // computed
  updatedAt: string;
}

export interface Certificate {
  id: string;
  studentId: string;
  eventId: string;
  kind: "participation" | "winner";
  rank: string | null; // "Winner" | "Runner-up" | "2nd Runner-up"
  certUid: string; // unique public id printed on PDF
  issuedAt: string;
}

export interface Expense {
  id: string;
  eventId: string;
  kind: "income" | "expense";
  category: string;
  label: string;
  amount: number;
  date: string;
}

export interface Payment {
  id: string;
  registrationId: string;
  eventId: string;
  studentId: string;
  amount: number;
  status: "paid" | "waived";
  createdAt: string;
}

export type NotificationKind =
  | "registration"
  | "announcement"
  | "schedule"
  | "deadline"
  | "result"
  | "certificate"
  | "approval"
  | "system";

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  kind: NotificationKind;
  read: boolean;
  createdAt: string;
}

export interface Announcement {
  id: string;
  eventId: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface Feedback {
  id: string;
  eventId: string;
  studentId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  handled: boolean;
  createdAt: string;
}

export interface AuthUser {
  profileId: string;
  email: string;
  passwordHash: string; // DEMO ONLY — Supabase Auth replaces this in production
}

export interface PasswordReset {
  email: string;
  code: string;
  expiresAt: number;
}

export interface Settings {
  siteName: string;
  collegeName: string;
  contactEmail: string;
  allowRegistrations: boolean;
}

export interface DbShape {
  profiles: Profile[];
  students: Student[];
  departments: Department[];
  venues: Venue[];
  events: EventItem[];
  registrations: Registration[];
  teams: Team[];
  teamMembers: TeamMember[];
  attendance: AttendanceRecord[];
  scores: Score[];
  certificates: Certificate[];
  expenses: Expense[];
  payments: Payment[];
  notifications: AppNotification[];
  announcements: Announcement[];
  feedback: Feedback[];
  contactMessages: ContactMessage[];
  authUsers: AuthUser[];
  passwordResets: PasswordReset[];
  settings: Settings;
}
