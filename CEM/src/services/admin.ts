import { db, mutateDb, nowIso, uid } from "./db";
import type { Department, Role, Venue } from "./types";
import { eventById } from "./lookups";
import { fail, ok, type ServiceResult } from "./auth";
import { notify } from "./notify";

/** Super Admin operations: users, org structure, settings. */

export interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  active: boolean;
  usn: string | null;
  department: string | null;
  semester: number | null;
  registrations: number;
  createdAt: string;
}

export function userRows(): UserRow[] {
  return db()
    .profiles.map((p) => {
      const st = db().students.find((s) => s.profileId === p.id);
      const dept = st ? db().departments.find((d) => d.id === st.departmentId) : null;
      return {
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        role: p.role,
        active: p.active,
        usn: st?.usn ?? null,
        department: dept?.code ?? null,
        semester: st?.semester ?? null,
        registrations: db().registrations.filter((r) => r.studentId === p.id && r.status !== "cancelled").length,
        createdAt: p.createdAt,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function setUserRole(actorId: string, userId: string, role: Role): ServiceResult<true> {
  if (actorId === userId) return fail("You cannot change your own role.");
  const target = db().profiles.find((p) => p.id === userId);
  if (!target) return fail("User not found.");
  if (target.role === "admin" && db().profiles.filter((p) => p.role === "admin" && p.active).length <= 1) {
    return fail("At least one active Super Admin is required.");
  }
  mutateDb((state) => {
    state.profiles = state.profiles.map((p) => (p.id === userId ? { ...p, role } : p));
  });
  notify(userId, "Role updated", `Your role is now ${role}. Sign out and back in to refresh your dashboard.`, "system");
  return ok(true);
}

export function setUserActive(actorId: string, userId: string, active: boolean): ServiceResult<true> {
  if (actorId === userId) return fail("You cannot deactivate your own account.");
  const target = db().profiles.find((p) => p.id === userId);
  if (!target) return fail("User not found.");
  if (target.role === "admin" && db().profiles.filter((p) => p.role === "admin" && p.active).length <= 1 && !active) {
    return fail("At least one active Super Admin is required.");
  }
  mutateDb((state) => {
    state.profiles = state.profiles.map((p) => (p.id === userId ? { ...p, active } : p));
  });
  return ok(true);
}

/* -------------------------------- Departments ----------------------------- */

export function addDepartment(name: string, code: string): ServiceResult<Department> {
  if (db().departments.some((d) => d.code.toUpperCase() === code.toUpperCase())) return fail("Department code already exists.");
  const dept: Department = { id: uid("d"), name: name.trim(), code: code.trim().toUpperCase() };
  mutateDb((state) => {
    state.departments.push(dept);
  });
  return ok(dept);
}

export function deleteDepartment(id: string): ServiceResult<true> {
  if (db().students.some((s) => s.departmentId === id)) return fail("Students are mapped to this department — cannot delete.");
  mutateDb((state) => {
    state.departments = state.departments.filter((d) => d.id !== id);
  });
  return ok(true);
}

/* ---------------------------------- Venues -------------------------------- */

export function addVenue(name: string, location: string, capacity: number): ServiceResult<Venue> {
  const venue: Venue = { id: uid("v"), name: name.trim(), location: location.trim(), capacity };
  mutateDb((state) => {
    state.venues.push(venue);
  });
  return ok(venue);
}

export function deleteVenue(id: string): ServiceResult<true> {
  if (db().events.some((e) => e.venueId === id)) return fail("Events are scheduled at this venue — cannot delete.");
  mutateDb((state) => {
    state.venues = state.venues.filter((v) => v.id !== id);
  });
  return ok(true);
}

/* --------------------------------- Settings ------------------------------- */

export function saveSettings(patch: Partial<{ siteName: string; collegeName: string; contactEmail: string; allowRegistrations: boolean }>): void {
  mutateDb((state) => {
    state.settings = { ...state.settings, ...patch };
  });
}

/* --------------------- Coordinator dashboard convenience ------------------- */

export function coordinationStats(coordinatorId: string): {
  events: number;
  live: number;
  registrations: number;
  attendance: number;
  pending: number;
} {
  const mine = db().events.filter((e) => e.coordinatorId === coordinatorId);
  const regs = db().registrations.filter((r) => mine.some((e) => e.id === r.eventId) && r.status !== "cancelled");
  return {
    events: mine.length,
    live: mine.filter((e) => e.status === "published" && e.date >= nowIso().slice(0, 10)).length,
    registrations: regs.length,
    attendance: regs.filter((r) => r.status === "attended").length,
    pending: mine.filter((e) => e.status === "pending").length,
  };
}

export function recentActivity(limit = 8): { id: string; text: string; at: string }[] {
  const rows: { id: string; text: string; at: string }[] = [];
  for (const r of db().registrations.slice(-40)) {
    const ev = eventById(r.eventId);
    const name = db().profiles.find((p) => p.id === r.studentId)?.name ?? "Someone";
    rows.push({ id: r.id, text: `${name} registered for ${ev?.title ?? "an event"}`, at: r.createdAt });
  }
  for (const n of db().notifications.filter((x) => x.kind === "certificate")) {
    rows.push({ id: `cert-${n.id}`, text: n.body, at: n.createdAt });
  }
  return rows.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}
