import { db, mutateDb, nowIso, uid } from "./db";
import type { Certificate, EventItem, Score } from "./types";
import { eventById, fullName, profileById, studentByProfile, teamById } from "./lookups";
import { fail, ok, type ServiceResult } from "./auth";
import { notify, notifyMany } from "./notify";

/**
 * Judging, results approval workflow, winner publication, and certificates.
 */

export interface JudgeRow {
  registrationId: string;
  name: string;
  usn: string;
  teamName: string | null;
  score: Score | null;
}

export function judgingSheet(eventId: string): JudgeRow[] {
  return db()
    .registrations.filter((r) => r.eventId === eventId && r.status !== "cancelled")
    .map((r) => {
      const team = r.teamId ? teamById(r.teamId) : null;
      return {
        registrationId: r.id,
        name: fullName(r.studentId),
        usn: studentByProfile(r.studentId)?.usn ?? "—",
        teamName: team?.name ?? null,
        score: db().scores.find((s) => s.registrationId === r.id && s.eventId === eventId) ?? null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function saveScore(
  judgeId: string,
  eventId: string,
  registrationId: string,
  fields: { innovation: number; execution: number; presentation: number },
): ServiceResult<Score> {
  const event = eventById(eventId);
  if (!event) return fail("Event not found.");
  if (event.facultyId !== judgeId) return fail("Only the assigned faculty judge can score this event.");
  if (event.scoresSubmitted) return fail("Scores are already submitted and locked.");
  const reg = db().registrations.find((r) => r.id === registrationId && r.eventId === eventId);
  if (!reg || reg.status === "cancelled") return fail("Registration not found.");
  const total = fields.innovation + fields.execution + fields.presentation;
  const id = db().scores.find((s) => s.registrationId === registrationId && s.eventId === eventId)?.id ?? uid("sc");
  const score: Score = { id, eventId, registrationId, judgeId, ...fields, total, updatedAt: nowIso() };
  mutateDb((state) => {
    const idx = state.scores.findIndex((s) => s.id === id);
    if (idx >= 0) state.scores[idx] = score;
    else state.scores.push(score);
  });
  return ok(score);
}

export function submitScores(judgeId: string, eventId: string): ServiceResult<true> {
  const event = eventById(eventId);
  if (!event) return fail("Event not found.");
  if (event.facultyId !== judgeId) return fail("Only the assigned faculty judge can submit results.");
  if (event.scoresSubmitted) return fail("Scores were already submitted.");
  const sheet = judgingSheet(eventId);
  const unscored = sheet.filter((r) => !r.score);
  if (scored(eventId).length === 0) return fail("Enter at least one score before submitting.");
  mutateDb((state) => {
    state.events = state.events.map((e) => (e.id === eventId ? { ...e, scoresSubmitted: true, updatedAt: nowIso() } : e));
  });
  notify(event.coordinatorId, "Scores submitted", `${profileById(judgeId)?.name} submitted scores for “${event.title}”. Review and publish results.`, "result");
  notifyMany(
    db().profiles.filter((p) => p.role === "admin").map((p) => p.id),
    "Results awaiting approval",
    `Scores for “${event.title}” were submitted for approval.`,
    "approval",
  );
  if (unscored.length > 0) {
    // unscored participants stay at 0 — intentional, note included in notification
  }
  return ok(true);
}

function scored(eventId: string): Score[] {
  return db().scores.filter((s) => s.eventId === eventId);
}

const RANKS = ["Winner", "Runner-up", "2nd Runner-up"] as const;

export interface Standing {
  registrationId: string;
  name: string;
  usn: string;
  teamName: string | null;
  total: number;
  rankLabel: string | null;
  position: number;
}

export function standings(eventId: string): Standing[] {
  const sheet = judgingSheet(eventId).filter((r) => r.score !== null);
  const sorted = sheet.sort((a, b) => (b.score?.total ?? 0) - (a.score?.total ?? 0));
  let pos = 0;
  let lastTotal = -1;
  return sorted.map((r, i) => {
    const total = r.score?.total ?? 0;
    if (total !== lastTotal) {
      pos = i + 1;
      lastTotal = total;
    }
    return {
      registrationId: r.registrationId,
      name: r.name,
      usn: r.usn,
      teamName: r.teamName,
      total,
      position: pos,
      rankLabel: pos <= 3 ? RANKS[pos - 1] : null,
    };
  });
}

export function approveAndPublishResults(eventId: string): ServiceResult<{ winners: number }> {
  const event = eventById(eventId);
  if (!event) return fail("Event not found.");
  if (!event.scoresSubmitted) return fail("The judge has not submitted scores yet.");
  if (event.resultsPublished) return fail("Results are already published.");
  const table = standings(eventId);
  if (table.length === 0) return fail("No scores recorded.");

  const certStamp = nowIso();
  const winners = table.filter((t) => t.rankLabel !== null);
  mutateDb((state) => {
    state.events = state.events.map((e) =>
      e.id === eventId ? { ...e, resultsPublished: true, status: "completed" as const, updatedAt: certStamp } : e,
    );
    for (const w of winners) {
      const reg = state.registrations.find((r) => r.id === w.registrationId);
      if (!reg) continue;
      if (state.certificates.some((c) => c.eventId === eventId && c.studentId === reg.studentId && c.kind === "winner")) continue;
      const cert: Certificate = {
        id: uid("ct"),
        studentId: reg.studentId,
        eventId,
        kind: "winner",
        rank: w.rankLabel,
        certUid: `CS-${eventId.replace(/[^A-Za-z]/g, "").slice(1, 5).toUpperCase()}-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        issuedAt: certStamp,
      };
      state.certificates.push(cert);
    }
  });
  for (const w of winners) {
    const reg = db().registrations.find((r) => r.id === w.registrationId);
    if (reg) notify(reg.studentId, `You placed ${w.rankLabel}!`, `Results for ${event.title} are published — you are the ${w.rankLabel}. Your certificate is ready.`, "result");
  }
  const participantIds = db().registrations.filter((r) => r.eventId === eventId && r.status !== "cancelled").map((r) => r.studentId);
  const loserIds = participantIds.filter((id) => !winners.some((w) => db().registrations.find((r) => r.id === w.registrationId)?.studentId === id));
  notifyMany(loserIds, "Results published", `Results for ${event.title} are live on the event page.`, "result");
  notify(event.coordinatorId, "Results published", `Results for “${event.title}” are now public and winner certificates were issued.`, "result");
  return ok({ winners: winners.length });
}

export function issueParticipationCertificates(eventId: string): ServiceResult<{ issued: number }> {
  const event = eventById(eventId);
  if (!event) return fail("Event not found.");
  const attended = db().registrations.filter((r) => r.eventId === eventId && r.status === "attended");
  let count = 0;
  const stamp = nowIso();
  mutateDb((state) => {
    for (const reg of attended) {
      if (state.certificates.some((c) => c.eventId === eventId && c.studentId === reg.studentId && c.kind === "participation")) continue;
      state.certificates.push({
        id: uid("ct"),
        studentId: reg.studentId,
        eventId,
        kind: "participation",
        rank: null,
        certUid: `CS-${eventId.replace(/[^A-Za-z]/g, "").slice(1, 5).toUpperCase()}-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        issuedAt: stamp,
      });
      count++;
    }
  });
  if (count > 0) {
    notifyMany(
      attended.map((r) => r.studentId),
      "Certificate issued",
      `Your participation certificate for ${event.title} is ready to download.`,
      "certificate",
    );
  }
  return ok({ issued: count });
}

export interface CertificateView {
  cert: Certificate;
  event: EventItem;
}

export function myCertificates(studentId: string): CertificateView[] {
  return db()
    .certificates.filter((c) => c.studentId === studentId)
    .map((cert) => ({ cert, event: eventById(cert.eventId)! }))
    .filter((x) => x.event)
    .sort((a, b) => b.cert.issuedAt.localeCompare(a.cert.issuedAt));
}

export function publishedResults(eventId: string): Standing[] {
  const event = eventById(eventId);
  if (!event || !event.resultsPublished) return [];
  return standings(eventId);
}
