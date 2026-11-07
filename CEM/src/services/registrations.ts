import { db, mutateDb, nowIso, qrCodeFor, uid } from "./db";
import type { EventItem, Registration, Team } from "./types";
import { activeRegCount, eventById, profileById, studentByProfile, teamMembers } from "./lookups";
import { fail, ok, type ServiceResult } from "./auth";
import { notify } from "./notify";
import { registrationGate } from "./events";
import { isPast } from "@/lib/utils";

/**
 * Registrations + Teams + QR Attendance.
 * Duplicate rule mirrors the SQL unique constraint on (event_id, student_id).
 */

export interface MyRegistration {
  reg: Registration;
  event: EventItem;
  team: Team | null;
}

export function myRegistrations(studentId: string): MyRegistration[] {
  return db()
    .registrations.filter((r) => r.studentId === studentId)
    .map((r) => ({ reg: r, event: eventById(r.eventId)!, team: r.teamId ? db().teams.find((t) => t.id === r.teamId) ?? null : null }))
    .filter((x) => x.event)
    .sort((a, b) => b.reg.createdAt.localeCompare(a.reg.createdAt));
}

export function isRegistered(studentId: string, eventId: string): boolean {
  return db().registrations.some((r) => r.studentId === studentId && r.eventId === eventId && r.status !== "cancelled");
}

function ensureRegisterable(studentId: string, event: EventItem): ServiceResult<true> {
  const gate = registrationGate(event);
  if (!gate.open) return fail(gate.reason ?? "Registration closed.");
  if (isRegistered(studentId, event.id)) return fail("You are already registered for this event.");
  return ok(true);
}

function createRegistrationRows(
  state: ReturnType<typeof db>,
  event: EventItem,
  members: string[],
  teamId: string | null,
): Registration[] {
  const rows: Registration[] = members.map((studentId) => ({
    id: uid("r"),
    eventId: event.id,
    studentId,
    teamId,
    status: "confirmed" as const,
    qrCode: qrCodeFor(event.id),
    createdAt: nowIso(),
    attendedAt: null,
  }));
  state.registrations.push(...rows);
  for (const r of rows) {
    if (event.fee > 0) {
      state.payments.push({
        id: uid("pay"),
        registrationId: r.id,
        eventId: event.id,
        studentId: r.studentId,
        amount: event.fee,
        status: "paid",
        createdAt: nowIso(),
      });
    }
  }
  return rows;
}

export function registerIndividual(studentId: string, eventId: string): ServiceResult<Registration> {
  const event = eventById(eventId);
  if (!event) return fail("Event not found.");
  const gate = ensureRegisterable(studentId, event);
  if (!gate.ok) return fail(gate.error!);
  if (event.teamSizeMin > 1) return fail(`This event requires a team of ${event.teamSizeMin}–${event.teamSizeMax}. Use team registration.`);

  let created: Registration | undefined;
  mutateDb((state) => {
    created = createRegistrationRows(state, event, [studentId], null)[0];
  });
  notify(studentId, "Registration confirmed", `You're registered for ${event.title}. Your QR ticket is in My Events.`, "registration");
  notify(event.coordinatorId, "New registration", `${profileById(studentId)?.name} registered for ${event.title}.`, "registration");
  return ok(created!);
}

export function registerTeam(leaderId: string, eventId: string, teamName: string, memberUsns: string[]): ServiceResult<Team> {
  const event = eventById(eventId);
  if (!event) return fail("Event not found.");
  const gate = ensureRegisterable(leaderId, event);
  if (!gate.ok) return fail(gate.error!);

  const name = teamName.trim();
  if (db().teams.some((t) => t.eventId === eventId && t.name.toLowerCase() === name.toLowerCase())) {
    return fail("A team with this name already exists for this event.");
  }

  const totalSize = 1 + memberUsns.length; // leader + members
  if (totalSize < event.teamSizeMin) return fail(`Team needs at least ${event.teamSizeMin} members (including you).`);
  if (totalSize > event.teamSizeMax) return fail(`Team can have at most ${event.teamSizeMax} members (including you).`);
  if (activeRegCount(eventId) + totalSize > event.capacity) return fail("Not enough seats left for the whole team.");

  const unique = [...new Set(memberUsns.map((u) => u.trim().toUpperCase()))];
  const leaderStudent = studentByProfile(leaderId);
  if (!leaderStudent) return fail("Leader student record not found.");
  if (unique.includes(leaderStudent.usn.toUpperCase())) return fail("You are already part of the team as the leader.");

  const memberIds: string[] = [];
  for (const usn of unique) {
    const st = db().students.find((s) => s.usn.toUpperCase() === usn);
    if (!st) return fail(`No student found with USN ${usn}.`);
    if (isRegistered(st.profileId, eventId)) return fail(`${profileById(st.profileId)?.name ?? usn} is already registered for this event.`);
    memberIds.push(st.profileId);
  }

  const teamId = uid("t");
  let team: Team | undefined;
  mutateDb((state) => {
    team = { id: teamId, eventId, name, leaderId, createdAt: nowIso() };
    state.teams.push(team);
    for (const sid of [leaderId, ...memberIds]) state.teamMembers.push({ teamId, studentId: sid });
    createRegistrationRows(state, event, [leaderId, ...memberIds], teamId);
  });
  const memberNames = [leaderId, ...memberIds].map((id) => profileById(id)?.name ?? "").join(", ");
  notify(leaderId, "Team registered", `“${name}” is confirmed for ${event.title} (${totalSize} members: ${memberNames}).`, "registration");
  for (const mid of memberIds) {
    notify(mid, "Added to a team", `${profileById(leaderId)?.name} added you to “${name}” for ${event.title}.`, "registration");
  }
  notify(event.coordinatorId, "New team registration", `Team “${name}” (${totalSize} members) registered for ${event.title}.`, "registration");
  return ok(team!);
}

export function cancelRegistration(regId: string, studentId: string): ServiceResult<true> {
  const reg = db().registrations.find((r) => r.id === regId);
  if (!reg || reg.studentId !== studentId) return fail("Registration not found.");
  if (reg.status === "cancelled") return fail("Already cancelled.");
  if (reg.status === "attended") return fail("You have already attended this event.");
  const event = eventById(reg.eventId);
  if (event && isPast(event.date)) return fail("This event has already taken place — cancellation is closed.");
  mutateDb((state) => {
    state.registrations = state.registrations.map((r) => (r.id === regId ? { ...r, status: "cancelled" as const } : r));
    // team integrity: removing a member keeps others; if leader cancels, team remains with members
  });
  if (event) {
    notify(studentId, "Registration cancelled", `Your registration for ${event.title} was cancelled. Any paid fee will be refunded per policy.`, "registration");
    notify(event.coordinatorId, "Cancellation", `${profileById(studentId)?.name} cancelled their registration for ${event.title}.`, "registration");
  }
  return ok(true);
}

/* ------------------------------- QR Attendance ------------------------------- */

export interface CheckInResult {
  studentName: string;
  usn: string;
  eventTitle: string;
  checkedInAt: string;
}

export function checkInByQr(qrCode: string): ServiceResult<CheckInResult> {
  const code = qrCode.trim().toUpperCase();
  const reg = db().registrations.find((r) => r.qrCode.toUpperCase() === code);
  if (!reg) return fail("Invalid QR code — no matching registration.");
  if (reg.status === "cancelled") return fail("This registration was cancelled.");
  const event = eventById(reg.eventId)!;
  if (reg.status === "attended") {
    return fail(`${profileById(reg.studentId)?.name} was already checked in ${reg.attendedAt ? "at " + new Date(reg.attendedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "earlier"}. Duplicate entry blocked.`);
  }
  const stamp = nowIso();
  mutateDb((state) => {
    state.registrations = state.registrations.map((r) =>
      r.id === reg.id ? { ...r, status: "attended" as const, attendedAt: stamp } : r,
    );
    state.attendance.push({ id: uid("a"), registrationId: reg.id, eventId: reg.eventId, checkedInAt: stamp });
  });
  notify(reg.studentId, "Checked in", `Attendance marked for ${event.title}. Enjoy the event!`, "system");
  const student = studentByProfile(reg.studentId);
  return ok({
    studentName: profileById(reg.studentId)?.name ?? "Student",
    usn: student?.usn ?? "—",
    eventTitle: event.title,
    checkedInAt: stamp,
  });
}

export function attendanceRowsForEvent(eventId: string): { id: string; name: string; usn: string; checkedInAt: string }[] {
  return db()
    .attendance.filter((a) => a.eventId === eventId)
    .map((a) => {
      const reg = db().registrations.find((r) => r.id === a.registrationId);
      return {
        id: a.id,
        name: reg ? profileById(reg.studentId)?.name ?? "Student" : "Student",
        usn: reg ? studentByProfile(reg.studentId)?.usn ?? "—" : "—",
        checkedInAt: a.checkedInAt,
      };
    })
    .sort((a, b) => b.checkedInAt.localeCompare(a.checkedInAt));
}

/* ------------------------------ Participants ------------------------------ */

export interface ParticipantRow {
  reg: Registration;
  name: string;
  usn: string;
  department: string;
  teamName: string | null;
  isLeader: boolean;
}

export function participantsForEvent(eventId: string): ParticipantRow[] {
  return db()
    .registrations.filter((r) => r.eventId === eventId && r.status !== "cancelled")
    .map((r) => {
      const student = studentByProfile(r.studentId);
      const profile = profileById(r.studentId);
      const team = r.teamId ? db().teams.find((t) => t.id === r.teamId) : null;
      const dept = student ? db().departments.find((d) => d.id === student.departmentId) : null;
      return {
        reg: r,
        name: profile?.name ?? "Unknown",
        usn: student?.usn ?? "—",
        department: dept?.code ?? "—",
        teamName: team?.name ?? null,
        isLeader: team?.leaderId === r.studentId,
      };
    })
    .sort((a, b) => a.reg.createdAt.localeCompare(b.reg.createdAt));
}

/* --------------------------------- Teams --------------------------------- */

export interface TeamView {
  team: Team;
  event: EventItem;
  members: { name: string; usn: string; isLeader: boolean; status: string }[];
}

export function teamsForStudent(studentId: string): TeamView[] {
  const views: TeamView[] = [];
  for (const tm of db().teamMembers.filter((t) => t.studentId === studentId)) {
    const team = db().teams.find((t) => t.id === tm.teamId);
    const event = team ? eventById(team.eventId) : undefined;
    if (!team || !event) continue;
    const members = teamMembers(team.id).map((m) => ({
      name: m.profile.name,
      usn: m.student.usn,
      isLeader: team.leaderId === m.student.profileId,
      status: db().registrations.find((r) => r.studentId === m.student.profileId && r.eventId === event.id)?.status ?? "cancelled",
    }));
    views.push({ team, event, members });
  }
  return views.sort((a, b) => b.team.createdAt.localeCompare(a.team.createdAt));
}
