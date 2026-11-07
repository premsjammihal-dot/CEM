import { db, demoHash, mutateDb, nowIso, uid } from "./db";
import type { Profile, Role, Student } from "./types";
import { addDaysIso } from "@/lib/utils";

/**
 * Auth service. The demo backend stores a salted-style demo hash locally and
 * keeps the session in localStorage. In production all functions here are
 * re-implemented with supabase.auth.* — signatures stay identical.
 */

const SESSION_KEY = "campusphere.session";

export interface SessionUser {
  profile: Profile;
  student: Student | null;
}

export interface ServiceResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export function ok<T>(data: T): ServiceResult<T> {
  return { ok: true, data };
}
export function fail<T>(error: string): ServiceResult<T> {
  return { ok: false, error };
}

export function currentUser(): SessionUser | null {
  const pid = localStorage.getItem(SESSION_KEY);
  if (!pid) return null;
  const profile = db().profiles.find((p) => p.id === pid && p.active);
  if (!profile) return null;
  const student = db().students.find((s) => s.profileId === pid) ?? null;
  return { profile, student };
}

export function login(email: string, password: string): ServiceResult<SessionUser> {
  const em = email.trim().toLowerCase();
  const auth = db().authUsers.find((a) => a.email.toLowerCase() === em);
  if (!auth || auth.passwordHash !== demoHash(password)) {
    return fail("Invalid email or password.");
  }
  const profile = db().profiles.find((p) => p.id === auth.profileId);
  if (!profile) return fail("Account not found.");
  if (!profile.active) return fail("This account has been deactivated. Contact the administrator.");
  localStorage.setItem(SESSION_KEY, profile.id);
  const student = db().students.find((s) => s.profileId === profile.id) ?? null;
  return ok({ profile, student });
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export interface StudentRegistrationInput {
  name: string;
  usn: string;
  email: string;
  phone: string;
  departmentId: string;
  semester: number;
  password: string;
}

export function registerStudent(input: StudentRegistrationInput): ServiceResult<SessionUser> {
  const email = input.email.trim().toLowerCase();
  const usn = input.usn.trim().toUpperCase();
  const d = db();
  if (d.authUsers.some((a) => a.email.toLowerCase() === email)) return fail("An account with this email already exists.");
  if (d.students.some((s) => s.usn.toUpperCase() === usn)) return fail("This USN is already registered.");
  if (!d.departments.some((dep) => dep.id === input.departmentId)) return fail("Invalid department.");

  const pid = uid("u");
  mutateDb((state) => {
    state.profiles.push({
      id: pid,
      name: input.name.trim(),
      email,
      phone: input.phone.trim(),
      role: "student",
      active: true,
      createdAt: nowIso(),
    });
    state.students.push({ profileId: pid, usn, departmentId: input.departmentId, semester: input.semester });
    state.authUsers.push({ profileId: pid, email, passwordHash: demoHash(input.password) });
    state.notifications.push({
      id: uid("n"),
      userId: pid,
      title: "Welcome to CampusSphere",
      body: "Your student account is ready. Explore events and register from the dashboard.",
      kind: "system",
      read: false,
      createdAt: nowIso(),
    });
  });
  localStorage.setItem(SESSION_KEY, pid);
  return ok(currentUser()!);
}

/** Creates a coordinator/faculty account (Super Admin only, enforced by caller + RLS in SQL). */
export function adminCreateUser(name: string, email: string, phone: string, role: Role, password: string): ServiceResult<Profile> {
  const em = email.trim().toLowerCase();
  if (db().authUsers.some((a) => a.email.toLowerCase() === em)) return fail("Email already in use.");
  const pid = uid("u");
  const profile: Profile = { id: pid, name: name.trim(), email: em, phone: phone.trim(), role, active: true, createdAt: nowIso() };
  mutateDb((state) => {
    state.profiles.push(profile);
    state.authUsers.push({ profileId: pid, email: em, passwordHash: demoHash(password) });
  });
  return ok(profile);
}

export function changePassword(userId: string, current: string, next: string): ServiceResult<true> {
  const auth = db().authUsers.find((a) => a.profileId === userId);
  if (!auth || auth.passwordHash !== demoHash(current)) return fail("Current password is incorrect.");
  mutateDb((state) => {
    state.authUsers = state.authUsers.map((a) => (a.profileId === userId ? { ...a, passwordHash: demoHash(next) } : a));
  });
  return ok(true);
}

/** Demo reset: a real deployment emails this link via Supabase. Here the code is returned to the UI. */
export function requestPasswordReset(email: string): ServiceResult<{ demoCode: string }> {
  const em = email.trim().toLowerCase();
  const auth = db().authUsers.find((a) => a.email.toLowerCase() === em);
  if (!auth) return fail("No account found with this email.");
  const code = String(Math.floor(100000 + Math.random() * 900000));
  mutateDb((state) => {
    state.passwordResets = state.passwordResets.filter((r) => r.email !== em);
    state.passwordResets.push({ email: em, code, expiresAt: Date.now() + 15 * 60_000 });
  });
  return ok({ demoCode: code });
}

export function resetPassword(email: string, code: string, newPassword: string): ServiceResult<true> {
  const em = email.trim().toLowerCase();
  const reset = db().passwordResets.find((r) => r.email === em && r.code === code.trim());
  if (!reset) return fail("Invalid reset code.");
  if (reset.expiresAt < Date.now()) return fail("Reset code expired. Request a new one.");
  mutateDb((state) => {
    state.authUsers = state.authUsers.map((a) => (a.email.toLowerCase() === em ? { ...a, passwordHash: demoHash(newPassword) } : a));
    state.passwordResets = state.passwordResets.filter((r) => r.email !== em);
  });
  return ok(true);
}

export function updateProfile(userId: string, patch: { name: string; phone: string; semester?: number }): ServiceResult<Profile> {
  let updated: Profile | undefined;
  mutateDb((state) => {
    state.profiles = state.profiles.map((p) => {
      if (p.id !== userId) return p;
      updated = { ...p, name: patch.name.trim(), phone: patch.phone.trim() };
      return updated;
    });
    if (patch.semester !== undefined) {
      state.students = state.students.map((s) => (s.profileId === userId ? { ...s, semester: patch.semester! } : s));
    }
  });
  return updated ? ok(updated) : fail("Profile not found.");
}

export function studentsByIds(ids: string[]): Student[] {
  return db().students.filter((s) => ids.includes(s.profileId));
}

export function demoAccounts(): { label: string; email: string; password: string }[] {
  return [
    { label: "Student", email: "student@campussphere.edu", password: "student123" },
    { label: "Coordinator", email: "coordinator@campussphere.edu", password: "coord123" },
    { label: "Faculty / Judge", email: "faculty@campussphere.edu", password: "faculty123" },
    { label: "Super Admin", email: "admin@campussphere.edu", password: "admin123" },
  ];
}

export { addDaysIso };
