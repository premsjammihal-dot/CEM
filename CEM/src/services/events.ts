import { db, mutateDb, nowIso, uid } from "./db";
import type { EventItem, EventStatus } from "./types";
import { activeRegCount, attendedCount, eventById, profileById, venueById } from "./lookups";
import { fail, ok, type ServiceResult } from "./auth";
import { notify, notifyMany } from "./notify";
import type { EventFormValues } from "@/lib/validators";
import { isPast, todayIso } from "@/lib/utils";

export function publishedEvents(): EventItem[] {
  return db()
    .events.filter((e) => e.status === "published" || e.status === "completed")
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function upcomingPublished(): EventItem[] {
  const t = todayIso();
  return publishedEvents().filter((e) => e.date >= t);
}

export function featuredEvents(): EventItem[] {
  return publishedEvents().filter((e) => e.featured && e.date >= todayIso());
}

export function eventsByCoordinator(coordinatorId: string): EventItem[] {
  return db()
    .events.filter((e) => e.coordinatorId === coordinatorId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function eventsForFaculty(facultyId: string): EventItem[] {
  return db()
    .events.filter((e) => e.facultyId === facultyId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function pendingEvents(): EventItem[] {
  return db().events.filter((e) => e.status === "pending");
}

export interface EventDetail {
  event: EventItem;
  venueName: string;
  coordinatorName: string;
  facultyName: string;
  registered: number;
  attended: number;
  spotsLeft: number;
  avgRating: number | null;
  feedbackCount: number;
}

export function eventDetail(id: string): EventDetail | null {
  const event = eventById(id);
  if (!event) return null;
  const fb = db().feedback.filter((f) => f.eventId === id);
  const avg = fb.length ? fb.reduce((s, f) => s + f.rating, 0) / fb.length : null;
  return {
    event,
    venueName: venueById(event.venueId)?.name ?? "TBA",
    coordinatorName: profileById(event.coordinatorId)?.name ?? "—",
    facultyName: profileById(event.facultyId)?.name ?? "—",
    registered: activeRegCount(id),
    attended: attendedCount(id),
    spotsLeft: Math.max(0, event.capacity - activeRegCount(id)),
    avgRating: avg,
    feedbackCount: fb.length,
  };
}

export interface RegistrationGate {
  open: boolean;
  reason: string | null;
}

/** Server-side-equivalent gate mirrored by the DB CHECK/trigger in SQL. */
export function registrationGate(event: EventItem): RegistrationGate {
  if (!db().settings.allowRegistrations) return { open: false, reason: "Registrations are temporarily disabled by the administrator." };
  if (event.status !== "published") return { open: false, reason: "This event is not open for registration." };
  if (isPast(event.date)) return { open: false, reason: "This event has already taken place." };
  if (todayIso() > event.regDeadline) return { open: false, reason: "The registration deadline has passed." };
  if (activeRegCount(event.id) >= event.capacity) return { open: false, reason: "This event is at full capacity." };
  return { open: true, reason: null };
}

export function createEvent(coordinatorId: string, values: EventFormValues): ServiceResult<EventItem> {
  if (!db().venues.some((v) => v.id === values.venueId)) return fail("Invalid venue.");
  const faculty = profileById(values.facultyId);
  if (!faculty || faculty.role !== "faculty") return fail("Assigned judge must be a faculty member.");
  const id = uid("e");
  const event: EventItem = {
    id,
    ...values,
    coordinatorId,
    status: "pending",
    featured: values.featured,
    resultsPublished: false,
    scoresSubmitted: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  mutateDb((state) => {
    state.events.push(event);
  });
  notifyMany(
    db().profiles.filter((p) => p.role === "admin").map((p) => p.id),
    "Approval requested",
    `${profileById(coordinatorId)?.name ?? "A coordinator"} submitted “${event.title}” for approval.`,
    "approval",
  );
  return ok(event);
}

export function updateEvent(eventId: string, values: EventFormValues): ServiceResult<EventItem> {
  const existing = eventById(eventId);
  if (!existing) return fail("Event not found.");
  if (activeRegCount(eventId) > existing.capacity && values.capacity < existing.capacity) {
    // capacity shrinks are allowed only above current registration count
  }
  if (values.capacity < activeRegCount(eventId)) {
    return fail(`Capacity cannot be below current registrations (${activeRegCount(eventId)}).`);
  }
  let updated: EventItem | undefined;
  mutateDb((state) => {
    state.events = state.events.map((e) => {
      if (e.id !== eventId) return e;
      updated = { ...e, ...values, updatedAt: nowIso() };
      return updated;
    });
  });
  return updated ? ok(updated) : fail("Update failed.");
}

export function approveEvent(eventId: string): ServiceResult<true> {
  const e = eventById(eventId);
  if (!e) return fail("Event not found.");
  mutateDb((state) => {
    state.events = state.events.map((x) => (x.id === eventId ? { ...x, status: "published" as EventStatus, updatedAt: nowIso() } : x));
  });
  notify(e.coordinatorId, "Event approved", `“${e.title}” is approved and now live for registrations.`, "approval");
  return ok(true);
}

export function rejectEvent(eventId: string, reason: string): ServiceResult<true> {
  const e = eventById(eventId);
  if (!e) return fail("Event not found.");
  mutateDb((state) => {
    state.events = state.events.map((x) => (x.id === eventId ? { ...x, status: "rejected" as EventStatus, updatedAt: nowIso() } : x));
  });
  notify(e.coordinatorId, "Event rejected", `“${e.title}” was rejected. Reason: ${reason}`, "approval");
  return ok(true);
}

export function deleteEvent(eventId: string): ServiceResult<true> {
  if (activeRegCount(eventId) > 0) return fail("Cannot delete an event with registrations. Cancel registrations first.");
  mutateDb((state) => {
    state.events = state.events.filter((e) => e.id !== eventId);
    state.announcements = state.announcements.filter((a) => a.eventId !== eventId);
    state.expenses = state.expenses.filter((x) => x.eventId !== eventId);
  });
  return ok(true);
}

/* ---------------- Analytics (real figures from the local dataset) ---------------- */

export interface PlatformStats {
  totalUsers: number;
  students: number;
  coordinators: number;
  faculty: number;
  totalEvents: number;
  liveEvents: number;
  totalRegistrations: number;
  attendanceRate: number;
  revenue: number;
  pendingApprovals: number;
  certificatesIssued: number;
}

export function platformStats(): PlatformStats {
  const d = db();
  const regs = d.registrations.filter((r) => r.status !== "cancelled");
  const attended = d.registrations.filter((r) => r.status === "attended").length;
  return {
    totalUsers: d.profiles.length,
    students: d.profiles.filter((p) => p.role === "student").length,
    coordinators: d.profiles.filter((p) => p.role === "coordinator").length,
    faculty: d.profiles.filter((p) => p.role === "faculty").length,
    totalEvents: d.events.length,
    liveEvents: d.events.filter((e) => e.status === "published" && e.date >= todayIso()).length,
    totalRegistrations: regs.length,
    attendanceRate: regs.length ? Math.round((attended / regs.length) * 100) : 0,
    revenue: d.payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0),
    pendingApprovals: d.events.filter((e) => e.status === "pending").length,
    certificatesIssued: d.certificates.length,
  };
}

export function registrationsByMonth(): { month: string; count: number }[] {
  const out: { month: string; count: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-IN", { month: "short" });
    const count = db().registrations.filter((r) => r.createdAt.startsWith(key) && r.status !== "cancelled").length;
    out.push({ month: label, count });
  }
  return out;
}

export function eventsByCategory(): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const e of db().events) map.set(e.category, (map.get(e.category) ?? 0) + 1);
  return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

export function revenueByCategory(): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const p of db().payments.filter((x) => x.status === "paid")) {
    const ev = eventById(p.eventId);
    if (!ev) continue;
    map.set(ev.category, (map.get(ev.category) ?? 0) + p.amount);
  }
  return [...map.entries()].map(([name, value]) => ({ name, value }));
}
