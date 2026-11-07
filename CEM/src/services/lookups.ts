import { db } from "./db";
import type { Department, EventItem, Profile, Registration, Student, Team, Venue } from "./types";

/** Cross-table lookup helpers (JOIN equivalents for the local backend). */

export const profileById = (id: string): Profile | undefined => db().profiles.find((p) => p.id === id);
export const studentByProfile = (pid: string): Student | undefined => db().students.find((s) => s.profileId === pid);
export const departmentById = (id: string): Department | undefined => db().departments.find((d) => d.id === id);
export const venueById = (id: string): Venue | undefined => db().venues.find((v) => v.id === id);
export const eventById = (id: string): EventItem | undefined => db().events.find((e) => e.id === id);
export const teamById = (id: string): Team | undefined => db().teams.find((t) => t.id === id);

export function teamMembers(teamId: string): { student: Student; profile: Profile }[] {
  const rows: { student: Student; profile: Profile }[] = [];
  for (const tm of db().teamMembers.filter((t) => t.teamId === teamId)) {
    const student = studentByProfile(tm.studentId);
    const profile = profileById(tm.studentId);
    if (student && profile) rows.push({ student, profile });
  }
  return rows;
}

export function teamForRegistration(reg: Registration): Team | null {
  return reg.teamId ? teamById(reg.teamId) ?? null : null;
}

/** Active registrations (confirmed or attended) for an event. */
export function activeRegs(eventId: string): Registration[] {
  return db().registrations.filter((r) => r.eventId === eventId && r.status !== "cancelled");
}

export function activeRegCount(eventId: string): number {
  return activeRegs(eventId).length;
}

export function attendedCount(eventId: string): number {
  return db().registrations.filter((r) => r.eventId === eventId && r.status === "attended").length;
}

export function fullName(pid: string): string {
  return profileById(pid)?.name ?? "Unknown";
}

export function studentLabel(pid: string): { name: string; usn: string } {
  return { name: fullName(pid), usn: studentByProfile(pid)?.usn ?? "—" };
}
