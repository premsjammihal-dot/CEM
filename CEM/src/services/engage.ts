import { db, mutateDb, nowIso, uid } from "./db";
import type { Announcement, Expense, Feedback, Payment } from "./types";
import { eventById, fullName } from "./lookups";
import { fail, ok, type ServiceResult } from "./auth";
import { notifyMany } from "./notify";
import type { ExpenseFormValues } from "./forms-extra";

/** Feedback, announcements, budgets, payments and contact messages. */

/* -------------------------------- Feedback -------------------------------- */

export function submitFeedback(studentId: string, eventId: string, rating: number, comment: string): ServiceResult<Feedback> {
  const event = eventById(eventId);
  if (!event) return fail("Event not found.");
  const reg = db().registrations.find((r) => r.studentId === studentId && r.eventId === eventId && r.status === "attended");
  if (!reg) return fail("Feedback opens after you attend the event.");
  if (db().feedback.some((f) => f.eventId === eventId && f.studentId === studentId)) {
    return fail("You have already shared feedback for this event.");
  }
  const fb: Feedback = { id: uid("f"), eventId, studentId, rating, comment: comment.trim(), createdAt: nowIso() };
  mutateDb((state) => {
    state.feedback.push(fb);
  });
  return ok(fb);
}

export function myFeedback(studentId: string): Feedback[] {
  return db().feedback.filter((f) => f.studentId === studentId);
}

export function feedbackForEvent(eventId: string): (Feedback & { studentName: string })[] {
  return db()
    .feedback.filter((f) => f.eventId === eventId)
    .map((f) => ({ ...f, studentName: fullName(f.studentId) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function feedbackReport(): { eventId: string; title: string; count: number; avg: number }[] {
  const byEvent = new Map<string, Feedback[]>();
  for (const f of db().feedback) {
    const arr = byEvent.get(f.eventId) ?? [];
    arr.push(f);
    byEvent.set(f.eventId, arr);
  }
  return [...byEvent.entries()].map(([eventId, arr]) => ({
    eventId,
    title: eventById(eventId)?.title ?? "Unknown event",
    count: arr.length,
    avg: Math.round((arr.reduce((s, f) => s + f.rating, 0) / arr.length) * 10) / 10,
  }));
}

/* ------------------------------ Announcements ----------------------------- */

export function announcementsFor(eventId: string): Announcement[] {
  return db()
    .announcements.filter((a) => a.eventId === eventId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function postAnnouncement(eventId: string, title: string, body: string): ServiceResult<Announcement> {
  const event = eventById(eventId);
  if (!event) return fail("Event not found.");
  const ann: Announcement = { id: uid("an"), eventId, title: title.trim(), body: body.trim(), createdAt: nowIso() };
  mutateDb((state) => {
    state.announcements.push(ann);
  });
  const recipientIds = db()
    .registrations.filter((r) => r.eventId === eventId && r.status !== "cancelled")
    .map((r) => r.studentId);
  notifyMany(recipientIds, `${event.title}: ${ann.title}`, ann.body, "announcement");
  return ok(ann);
}

/* --------------------------------- Budgets -------------------------------- */

export function expensesFor(eventId: string): Expense[] {
  return db()
    .expenses.filter((e) => e.eventId === eventId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function budgetSummary(eventId: string): { income: number; spend: number; balance: number } {
  const rows = expensesFor(eventId);
  const income = rows.filter((r) => r.kind === "income").reduce((s, r) => s + r.amount, 0);
  const spend = rows.filter((r) => r.kind === "expense").reduce((s, r) => s + r.amount, 0);
  return { income, spend, balance: income - spend };
}

export function addBudgetEntry(eventId: string, input: ExpenseFormValues): ServiceResult<Expense> {
  if (!eventById(eventId)) return fail("Event not found.");
  const entry: Expense = { id: uid("ex"), eventId, ...input, label: input.label.trim(), category: input.category.trim() };
  mutateDb((state) => {
    state.expenses.push(entry);
  });
  return ok(entry);
}

export function deleteBudgetEntry(id: string): ServiceResult<true> {
  mutateDb((state) => {
    state.expenses = state.expenses.filter((e) => e.id !== id);
  });
  return ok(true);
}

/* --------------------------------- Payments ------------------------------- */

export interface PaymentRow extends Payment {
  studentName: string;
  usn: string;
  eventTitle: string;
}

export function paymentRows(): PaymentRow[] {
  return db()
    .payments.map((p) => ({
      ...p,
      studentName: fullName(p.studentId),
      usn: db().students.find((s) => s.profileId === p.studentId)?.usn ?? "—",
      eventTitle: eventById(p.eventId)?.title ?? "—",
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ------------------------------ Contact inbox ----------------------------- */

export function sendContactMessage(input: { name: string; email: string; subject: string; message: string }): ServiceResult<true> {
  mutateDb((state) => {
    state.contactMessages.push({
      id: uid("cm"),
      name: input.name.trim(),
      email: input.email.trim(),
      subject: input.subject.trim(),
      message: input.message.trim(),
      handled: false,
      createdAt: nowIso(),
    });
  });
  return ok(true);
}

export function contactMessages() {
  return db()
    .contactMessages.slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function markContactHandled(id: string): void {
  mutateDb((state) => {
    state.contactMessages = state.contactMessages.map((m) => (m.id === id ? { ...m, handled: true } : m));
  });
}
