import type { DbShape, EventItem, Profile, Registration, Student } from "./types";
import { addDaysIso } from "@/lib/utils";
import { demoHash } from "./db";

/**
 * DEMO DATA — deterministic seed used only by the local development backend.
 * Clearly fictional: students, emails (@campussphere.edu), and statistics.
 * Production deployments replace this via supabase/seed.sql.
 */

const P = (id: string, name: string, email: string, role: Profile["role"], phone = "9800000000"): Profile => ({
  id,
  name,
  email,
  phone,
  role,
  active: true,
  createdAt: new Date(Date.now() - 90 * 86_400_000).toISOString(),
});

const S = (profileId: string, usn: string, departmentId: string, semester: number): Student => ({
  profileId,
  usn,
  departmentId,
  semester,
});

function ev(partial: Omit<EventItem, "createdAt" | "updatedAt" | "resultsPublished" | "scoresSubmitted"> & Partial<EventItem>): EventItem {
  return {
    resultsPublished: false,
    scoresSubmitted: false,
    createdAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    ...partial,
  };
}

let regSeq = 0;
function reg(eventId: string, studentId: string, status: Registration["status"], qr: string, teamId: string | null = null): Registration {
  regSeq += 1;
  return {
    id: `reg_${eventId}_${regSeq}`,
    eventId,
    studentId,
    teamId,
    status,
    qrCode: qr,
    createdAt: new Date(Date.now() - 12 * 86_400_000).toISOString(),
    attendedAt: status === "attended" ? new Date(Date.now() - 4 * 86_400_000).toISOString() : null,
  };
}

export function buildSeed(): DbShape {
  regSeq = 0;
  const profiles: Profile[] = [
    P("u_admin", "Arjun Mehta", "admin@campussphere.edu", "admin", "9810010001"),
    P("u_coord1", "Riya Sharma", "coordinator@campussphere.edu", "coordinator", "9810010002"),
    P("u_coord2", "Nikhil Rao", "coord2@campussphere.edu", "coordinator", "9810010003"),
    P("u_fac1", "Dr. Meera Iyer", "faculty@campussphere.edu", "faculty", "9810010004"),
    P("u_fac2", "Prof. Kunal Desai", "faculty2@campussphere.edu", "faculty", "9810010005"),
    P("u_stu1", "Aarav Kumar", "student@campussphere.edu", "student", "9810010011"),
    P("u_stu2", "Diya Patel", "diya@campussphere.edu", "student", "9810010012"),
    P("u_stu3", "Rohan Verma", "rohan@campussphere.edu", "student", "9810010013"),
    P("u_stu4", "Sneha Nair", "sneha@campussphere.edu", "student", "9810010014"),
    P("u_stu5", "Kiran Pillai", "kiran@campussphere.edu", "student", "9810010015"),
    P("u_stu6", "Ananya Iyer", "ananya@campussphere.edu", "student", "9810010016"),
    P("u_stu7", "Vikram Singh", "vikram@campussphere.edu", "student", "9810010017"),
    P("u_stu8", "Priya Menon", "priya@campussphere.edu", "student", "9810010018"),
    P("u_stu9", "Dev Malhotra", "dev@campussphere.edu", "student", "9810010019"),
    P("u_stu10", "Tara Joshi", "tara@campussphere.edu", "student", "9810010020"),
  ];

  const students: Student[] = [
    S("u_stu1", "1PI23CS001", "d_cse", 5),
    S("u_stu2", "1PI23CS002", "d_cse", 5),
    S("u_stu3", "1PI22EC014", "d_ece", 6),
    S("u_stu4", "1PI23AI007", "d_aiml", 4),
    S("u_stu5", "1PI22ME033", "d_me", 6),
    S("u_stu6", "1PI23CS021", "d_cse", 4),
    S("u_stu7", "1PI21CV009", "d_civil", 8),
    S("u_stu8", "1PI23EE015", "d_eee", 4),
    S("u_stu9", "1PI22CS044", "d_cse", 6),
    S("u_stu10", "1PI23AI019", "d_aiml", 4),
  ];

  const events: EventItem[] = [
    ev({
      id: "e_hack",
      title: "NeuraHack 2025",
      category: "Hackathon",
      description:
        "A 24-hour national-level hackathon where teams prototype AI-driven solutions for campus life, sustainability and healthcare. Mentors from industry, midnight jam sessions, and a demo expo judged live.",
      poster: "img:hackathon",
      date: addDaysIso(10),
      startTime: "09:00",
      endTime: "09:00",
      venueId: "v_aud",
      fee: 299,
      capacity: 120,
      regDeadline: addDaysIso(8),
      eligibility: "Open to all UG students. Teams of 2–4. Beginners welcome — mentor track available.",
      rules: [
        "Teams of 2–4 members; cross-department teams encouraged.",
        "All code must be written during the 24-hour window.",
        "Use of open-source libraries and AI assistants is permitted and must be disclosed.",
        "Final demos are strictly limited to 4 minutes + 2 minutes of Q&A.",
      ],
      facultyId: "u_fac1",
      coordinatorId: "u_coord1",
      status: "published",
      teamSizeMin: 2,
      teamSizeMax: 4,
      featured: true,
    }),
    ev({
      id: "e_culture",
      title: "Aurora Cultural Fest",
      category: "Cultural",
      description:
        "The flagship cultural extravaganza: group dance, battle of bands, drama, fashion walk and art installations across two stages. Open category entries judged by invited artists.",
      poster: "img:cultural",
      date: addDaysIso(21),
      startTime: "16:00",
      endTime: "22:00",
      venueId: "v_oat",
      fee: 149,
      capacity: 600,
      regDeadline: addDaysIso(18),
      eligibility: "All students. Solo and group entries (up to 6 on stage).",
      rules: [
        "Groups limited to 6 performers on stage at a time.",
        "Music tracks must be submitted 48 hours in advance for screening.",
        "Props requiring fire or water are prohibited.",
        "Judges' decisions are final and binding.",
      ],
      facultyId: "u_fac2",
      coordinatorId: "u_coord2",
      status: "published",
      teamSizeMin: 1,
      teamSizeMax: 6,
      featured: true,
    }),
    ev({
      id: "e_robo",
      title: "RoboWars Arena",
      category: "Technical",
      description:
        "Combat robotics showdown — 15kg class bots battle in a bulletproof arena. Design reviews, safety checks, and a double-elimination bracket with live telemetry on the big screen.",
      poster: "img:robotics",
      date: addDaysIso(14),
      startTime: "10:00",
      endTime: "18:00",
      venueId: "v_sport",
      fee: 249,
      capacity: 96,
      regDeadline: addDaysIso(11),
      eligibility: "Teams of 2–4. Bots must pass the technical safety inspection.",
      rules: [
        "Maximum bot weight 15kg including batteries.",
        "No flamethrowers, liquids, or entanglement devices.",
        "LiPo batteries must be charged inside fireproof bags only.",
        "A bot failing two safety checks is disqualified.",
      ],
      facultyId: "u_fac1",
      coordinatorId: "u_coord1",
      status: "published",
      teamSizeMin: 2,
      teamSizeMax: 4,
      featured: false,
    }),
    ev({
      id: "e_music",
      title: "Decibel Nights",
      category: "Music",
      description:
        "An open-air concert evening: battle of the bands, solo vocal showcase and an EDM closing set by a guest artist. Professional sound, stage lighting and live judging.",
      poster: "img:music",
      date: addDaysIso(30),
      startTime: "17:30",
      endTime: "22:30",
      venueId: "v_oat",
      fee: 199,
      capacity: 800,
      regDeadline: addDaysIso(26),
      eligibility: "Open to all students. Solo or band entries up to 8 members.",
      rules: [
        "Bands may include at most 8 performing members.",
        "Backing tracks permitted for solo vocals only.",
        "Each act gets a 12-minute stage window including setup.",
        "Explicit lyrics must be disclosed at screening.",
      ],
      facultyId: "u_fac2",
      coordinatorId: "u_coord2",
      status: "published",
      teamSizeMin: 1,
      teamSizeMax: 8,
      featured: true,
    }),
    ev({
      id: "e_sports",
      title: "Velocity Sports Meet",
      category: "Sports",
      description:
        "Inter-department athletics: 100m, 400m relays, long jump and shot put. Electronic timing, certified officials, and rolling results on the stadium screen.",
      poster: "img:sports",
      date: addDaysIso(17),
      startTime: "07:00",
      endTime: "13:00",
      venueId: "v_sport",
      fee: 99,
      capacity: 300,
      regDeadline: addDaysIso(14),
      eligibility: "Individual registration. Valid college ID mandatory on race day.",
      rules: [
        "Athletes must report 45 minutes before their event.",
        "Spikes above 6mm are not permitted on the synthetic track.",
        "False start = immediate disqualification (World Athletics rule).",
      ],
      facultyId: "u_fac2",
      coordinatorId: "u_coord1",
      status: "published",
      teamSizeMin: 1,
      teamSizeMax: 1,
      featured: false,
    }),
    ev({
      id: "e_design",
      title: "PixelCraft UI Workshop",
      category: "Workshop",
      description:
        "A hands-on half-day workshop covering visual hierarchy, design systems and prototyping. Bring a laptop — you will ship a full landing redesign by the end of the session.",
      poster: "img:workshop",
      date: addDaysIso(7),
      startTime: "09:30",
      endTime: "13:30",
      venueId: "v_design",
      fee: 49,
      capacity: 60,
      regDeadline: addDaysIso(5),
      eligibility: "All years. Basic familiarity with any design tool helps but is not required.",
      rules: [
        "Participants must bring their own laptop with a design tool installed.",
        "Seats are limited to 60 — first come, first served.",
        "Certificates are issued only to attendees who complete the exercise.",
      ],
      facultyId: "u_fac1",
      coordinatorId: "u_coord2",
      status: "published",
      teamSizeMin: 1,
      teamSizeMax: 1,
      featured: false,
    }),
    ev({
      id: "e_today",
      title: "CodeSprint Live",
      category: "Technical",
      description:
        "A fast-paced on-the-spot competitive programming sprint happening TODAY. Three 45-minute rounds, instant leaderboard, and spot prizes between rounds.",
      poster: "grad:cyberspace",
      date: addDaysIso(0),
      startTime: "10:00",
      endTime: "14:00",
      venueId: "v_sem1",
      fee: 0,
      capacity: 100,
      regDeadline: addDaysIso(0),
      eligibility: "Open to all students. Individual or pairs (up to 2).",
      rules: [
        "Individual participation or pairs of exactly 2.",
        "Any language on the college judge server is allowed.",
        "Internet access is restricted to the judge and docs.",
      ],
      facultyId: "u_fac1",
      coordinatorId: "u_coord1",
      status: "published",
      teamSizeMin: 1,
      teamSizeMax: 2,
      featured: false,
    }),
    ev({
      id: "e_game",
      title: "Apex Collegiate Cup",
      category: "Gaming",
      description:
        "Collegiate esports cup across Valorant and FIFA brackets. Dedicated tournament rigs, shoutcasters, and a community lounge with freeplay stations.",
      poster: "grad:midnight",
      date: addDaysIso(24),
      startTime: "11:00",
      endTime: "20:00",
      venueId: "v_lab",
      fee: 199,
      capacity: 128,
      regDeadline: addDaysIso(20),
      eligibility: "Squads of 4 for Valorant; solo for FIFA.",
      rules: [
        "Squads register exactly 4 starters; substitutes announced pre-match.",
        "Own peripherals allowed; software must be tournament-approved.",
        "Technical pauses limited to 10 minutes per match.",
      ],
      facultyId: "u_fac2",
      coordinatorId: "u_coord2",
      status: "published",
      teamSizeMin: 1,
      teamSizeMax: 4,
      featured: false,
    }),
    ev({
      id: "e_past",
      title: "AlgoStrike Challenge",
      category: "Technical",
      description:
        "Algorithmic problem-solving championship held in two elimination rounds. Final judging is in progress — results will be published after faculty approval.",
      poster: "grad:matrix",
      date: addDaysIso(-3),
      startTime: "09:00",
      endTime: "17:00",
      venueId: "v_lab",
      fee: 99,
      capacity: 150,
      regDeadline: addDaysIso(-6),
      eligibility: "Individual participation.",
      rules: ["Standard ICPC-style scoring.", "No collaboration across participants."],
      facultyId: "u_fac1",
      coordinatorId: "u_coord1",
      status: "published",
      teamSizeMin: 1,
      teamSizeMax: 1,
      featured: false,
      scoresSubmitted: true,
    }),
    ev({
      id: "e_done",
      title: "CyberShield CTF",
      category: "Hackathon",
      description:
        "Capture-the-flag cybersecurity championship completed last month: web exploitation, reverse engineering, crypto and forensics tracks. Winners were felicitated at the tech summit.",
      poster: "grad:aurora",
      date: addDaysIso(-21),
      startTime: "09:00",
      endTime: "18:00",
      venueId: "v_lab",
      fee: 149,
      capacity: 120,
      regDeadline: addDaysIso(-24),
      eligibility: "Teams of 1–3. Prior CTF experience recommended.",
      rules: ["Teams of 1–3.", "Attacking the scoreboard infra = instant ban.", "Flag sharing between teams is prohibited."],
      facultyId: "u_fac1",
      coordinatorId: "u_coord1",
      status: "completed",
      teamSizeMin: 1,
      teamSizeMax: 3,
      featured: false,
      scoresSubmitted: true,
      resultsPublished: true,
    }),
    ev({
      id: "e_pending",
      title: "Quantum Computing Summit",
      category: "Seminar",
      description:
        "A full-day summit on quantum computing: keynote on qubit architectures, IBM Q hands-on lab, and a research poster corridor. Awaiting administrative approval.",
      poster: "grad:solar",
      date: addDaysIso(45),
      startTime: "09:00",
      endTime: "16:00",
      venueId: "v_aud",
      fee: 0,
      capacity: 200,
      regDeadline: addDaysIso(40),
      eligibility: "Open to all departments; physics refresher provided.",
      rules: ["Register individually.", "Bring a laptop for the hands-on lab track."],
      facultyId: "u_fac2",
      coordinatorId: "u_coord2",
      status: "pending",
      teamSizeMin: 1,
      teamSizeMax: 1,
      featured: false,
    }),
  ];

  const registrations: Registration[] = [
    // NeuraHack — team Byte Bandits (stu1 leader + stu2 + stu6), team Kernel Panic (stu3 + stu5)
    reg("e_hack", "u_stu1", "confirmed", "CS-HACK-QX7M2A", "t_byte"),
    reg("e_hack", "u_stu2", "confirmed", "CS-HACK-B8N3KD", "t_byte"),
    reg("e_hack", "u_stu6", "confirmed", "CS-HACK-P4W9ZT", "t_byte"),
    reg("e_hack", "u_stu3", "confirmed", "CS-HACK-M2L8QS", "t_kernel"),
    reg("e_hack", "u_stu5", "confirmed", "CS-HACK-Z5C1VX", "t_kernel"),
    // CodeSprint (today) — confirmed, ready for QR check-in demo
    reg("e_today", "u_stu1", "confirmed", "CS-TODY-ATTND1"),
    reg("e_today", "u_stu4", "confirmed", "CS-TODY-ATTND2"),
    reg("e_today", "u_stu3", "confirmed", "CS-TODY-ATTND3"),
    // AlgoStrike (past) — attended, judging pending approval
    reg("e_past", "u_stu1", "attended", "CS-PAST-ALG001"),
    reg("e_past", "u_stu2", "attended", "CS-PAST-ALG002"),
    reg("e_past", "u_stu3", "attended", "CS-PAST-ALG003"),
    reg("e_past", "u_stu4", "attended", "CS-PAST-ALG004"),
    reg("e_past", "u_stu5", "attended", "CS-PAST-ALG005"),
    reg("e_past", "u_stu6", "attended", "CS-PAST-ALG006"),
    // CyberShield CTF (completed) — winners + participation
    reg("e_done", "u_stu1", "attended", "CS-DONE-CTF001", "t_pwnstars"),
    reg("e_done", "u_stu2", "attended", "CS-DONE-CTF002", "t_pwnstars"),
    reg("e_done", "u_stu7", "attended", "CS-DONE-CTF003"),
    reg("e_done", "u_stu9", "attended", "CS-DONE-CTF004"),
    // Sports + design + culture
    reg("e_sports", "u_stu5", "confirmed", "CS-SPRT-5K2H8D"),
    reg("e_sports", "u_stu7", "confirmed", "CS-SPRT-9F3L1Q"),
    reg("e_design", "u_stu1", "confirmed", "CS-DSGN-D2R7T6"),
    reg("e_design", "u_stu6", "confirmed", "CS-DSGN-V6B2N9"),
    reg("e_culture", "u_stu8", "confirmed", "CS-CLTR-R1G8B4", "t_raag"),
    reg("e_culture", "u_stu10", "confirmed", "CS-CLTR-T7H2J9", "t_raag"),
    reg("e_culture", "u_stu2", "confirmed", "CS-CLTR-K3P6W1", "t_raag"),
  ];

  const dbShape: DbShape = {
    profiles,
    students,
    departments: [
      { id: "d_cse", name: "Computer Science & Engineering", code: "CSE" },
      { id: "d_ece", name: "Electronics & Communication", code: "ECE" },
      { id: "d_eee", name: "Electrical & Electronics", code: "EEE" },
      { id: "d_me", name: "Mechanical Engineering", code: "ME" },
      { id: "d_civil", name: "Civil Engineering", code: "CV" },
      { id: "d_aiml", name: "AI & Machine Learning", code: "AIML" },
    ],
    venues: [
      { id: "v_aud", name: "Main Auditorium", location: "Block A · Ground Floor", capacity: 900 },
      { id: "v_sem1", name: "Seminar Hall 1", location: "Block B · 2nd Floor", capacity: 220 },
      { id: "v_lab", name: "Innovation Lab 2", location: "CSE Block · 3rd Floor", capacity: 150 },
      { id: "v_oat", name: "Open Air Theatre", location: "Central Quad", capacity: 1500 },
      { id: "v_sport", name: "Sports Complex", location: "South Campus", capacity: 2000 },
      { id: "v_design", name: "Design Studio 4", location: "Architecture Block · 1st Floor", capacity: 80 },
    ],
    events,
    registrations,
    teams: [
      { id: "t_byte", eventId: "e_hack", name: "Byte Bandits", leaderId: "u_stu1", createdAt: new Date(Date.now() - 12 * 86_400_000).toISOString() },
      { id: "t_kernel", eventId: "e_hack", name: "Kernel Panic", leaderId: "u_stu3", createdAt: new Date(Date.now() - 10 * 86_400_000).toISOString() },
      { id: "t_pwnstars", eventId: "e_done", name: "PwnStars", leaderId: "u_stu1", createdAt: new Date(Date.now() - 25 * 86_400_000).toISOString() },
      { id: "t_raag", eventId: "e_culture", name: "Raag Rebels", leaderId: "u_stu8", createdAt: new Date(Date.now() - 8 * 86_400_000).toISOString() },
    ],
    teamMembers: [
      { teamId: "t_byte", studentId: "u_stu1" },
      { teamId: "t_byte", studentId: "u_stu2" },
      { teamId: "t_byte", studentId: "u_stu6" },
      { teamId: "t_kernel", studentId: "u_stu3" },
      { teamId: "t_kernel", studentId: "u_stu5" },
      { teamId: "t_pwnstars", studentId: "u_stu1" },
      { teamId: "t_pwnstars", studentId: "u_stu2" },
      { teamId: "t_raag", studentId: "u_stu8" },
      { teamId: "t_raag", studentId: "u_stu10" },
      { teamId: "t_raag", studentId: "u_stu2" },
    ],
    attendance: registrations
      .filter((r) => r.status === "attended")
      .map((r) => ({
        id: `att_${r.id}`,
        registrationId: r.id,
        eventId: r.eventId,
        checkedInAt: r.attendedAt ?? new Date().toISOString(),
      })),
    scores: [
      // AlgoStrike — judge submitted, awaiting approval
      ...([0, 1, 2, 3, 4, 5] as const).map((i) => {
        const innovation = [9, 8, 7, 8, 6, 9][i];
        const execution = [8, 9, 8, 7, 7, 8][i];
        const presentation = [9, 7, 8, 8, 6, 9][i];
        return {
          id: `sc_past_${i}`,
          eventId: "e_past",
          registrationId: `reg_e_past_${i + 9}`,
          judgeId: "u_fac1",
          innovation,
          execution,
          presentation,
          total: innovation + execution + presentation,
          updatedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
        };
      }),
      // CTF — approved results
      ...([0, 1, 2, 3] as const).map((i) => {
        const innovation = [10, 9, 7, 6][i];
        const execution = [9, 9, 8, 7][i];
        const presentation = [9, 8, 7, 7][i];
        return {
          id: `sc_done_${i}`,
          eventId: "e_done",
          registrationId: `reg_e_done_${i + 16}`,
          judgeId: "u_fac1",
          innovation,
          execution,
          presentation,
          total: innovation + execution + presentation,
          updatedAt: new Date(Date.now() - 20 * 86_400_000).toISOString(),
        };
      }),
    ],
    certificates: [
      { id: "ct1", studentId: "u_stu1", eventId: "e_done", kind: "winner", rank: "Winner", certUid: "CS-CTF-2025-9F27XA", issuedAt: new Date(Date.now() - 19 * 86_400_000).toISOString() },
      { id: "ct2", studentId: "u_stu2", eventId: "e_done", kind: "winner", rank: "Winner", certUid: "CS-CTF-2025-4B71KD", issuedAt: new Date(Date.now() - 19 * 86_400_000).toISOString() },
      { id: "ct3", studentId: "u_stu7", eventId: "e_done", kind: "winner", rank: "Runner-up", certUid: "CS-CTF-2025-7M02QS", issuedAt: new Date(Date.now() - 19 * 86_400_000).toISOString() },
      { id: "ct4", studentId: "u_stu9", eventId: "e_done", kind: "winner", rank: "2nd Runner-up", certUid: "CS-CTF-2025-2Z58RP", issuedAt: new Date(Date.now() - 19 * 86_400_000).toISOString() },
      { id: "ct5", studentId: "u_stu1", eventId: "e_done", kind: "participation", rank: null, certUid: "CS-CTF-2025-6C14NA", issuedAt: new Date(Date.now() - 19 * 86_400_000).toISOString() },
    ],
    expenses: [
      { id: "ex1", eventId: "e_done", kind: "income", category: "Sponsorship", label: "NexaSoft title sponsorship", amount: 40000, date: addDaysIso(-30) },
      { id: "ex2", eventId: "e_done", kind: "expense", category: "Prizes", label: "Winner prize pool", amount: 15000, date: addDaysIso(-21) },
      { id: "ex3", eventId: "e_done", kind: "expense", category: "Infrastructure", label: "Lab LAN + scoreboard hosting", amount: 8000, date: addDaysIso(-23) },
      { id: "ex4", eventId: "e_done", kind: "expense", category: "Catering", label: "Participant lunch & snacks", amount: 6000, date: addDaysIso(-21) },
      { id: "ex5", eventId: "e_hack", kind: "income", category: "Sponsorship", label: "CloudVerse platinum sponsor", amount: 100000, date: addDaysIso(-6) },
      { id: "ex6", eventId: "e_hack", kind: "expense", category: "Prizes", label: "Prize pool reserve", amount: 30000, date: addDaysIso(-4) },
      { id: "ex7", eventId: "e_hack", kind: "expense", category: "Logistics", label: "Power backup & internet upgrade", amount: 12000, date: addDaysIso(-3) },
      { id: "ex8", eventId: "e_culture", kind: "income", category: "College Fund", label: "Cultural committee allocation", amount: 120000, date: addDaysIso(-10) },
      { id: "ex9", eventId: "e_culture", kind: "expense", category: "Stage & Sound", label: "Dual stage + line-array sound", amount: 45000, date: addDaysIso(-5) },
    ],
    payments: registrations
      .filter((r) => r.status !== "cancelled")
      .flatMap((r) => {
        const event = events.find((e) => e.id === r.eventId);
        if (!event || event.fee === 0) return [];
        return [
          {
            id: `pay_${r.id}`,
            registrationId: r.id,
            eventId: r.eventId,
            studentId: r.studentId,
            amount: event.fee,
            status: "paid" as const,
            createdAt: r.createdAt,
          },
        ];
      }),
    notifications: [
      { id: "n1", userId: "u_stu1", title: "Registration confirmed", body: "Your team Byte Bandits is confirmed for NeuraHack 2025.", kind: "registration", read: true, createdAt: new Date(Date.now() - 12 * 86_400_000).toISOString() },
      { id: "n2", userId: "u_stu1", title: "Problem statements released", body: "NeuraHack 2025: track problem statements are live on the event page.", kind: "announcement", read: true, createdAt: new Date(Date.now() - 3 * 86_400_000).toISOString() },
      { id: "n3", userId: "u_stu1", title: "Certificate issued", body: "Your Winner certificate for CyberShield CTF is ready to download.", kind: "certificate", read: false, createdAt: new Date(Date.now() - 19 * 86_400_000).toISOString() },
      { id: "n4", userId: "u_stu1", title: "Check-in reminder", body: "CodeSprint Live is today! Carry your QR ticket from My Events.", kind: "deadline", read: false, createdAt: new Date(Date.now() - 3 * 3600_000).toISOString() },
      { id: "n5", userId: "u_admin", title: "Approval requested", body: "Quantum Computing Summit was submitted by Nikhil Rao and awaits approval.", kind: "approval", read: false, createdAt: new Date(Date.now() - 26 * 3600_000).toISOString() },
      { id: "n6", userId: "u_coord1", title: "Scores submitted", body: "Dr. Meera Iyer submitted scores for AlgoStrike Challenge.", kind: "result", read: false, createdAt: new Date(Date.now() - 20 * 3600_000).toISOString() },
    ],
    announcements: [
      { id: "an1", eventId: "e_hack", title: "Problem statements released", body: "All four tracks are live. Teams may lock their track choice from tomorrow 6 PM.", createdAt: new Date(Date.now() - 3 * 86_400_000).toISOString() },
    ],
    feedback: [
      { id: "f1", eventId: "e_done", studentId: "u_stu1", rating: 5, comment: "Best CTF on campus so far — the forensics track was brilliant.", createdAt: new Date(Date.now() - 18 * 86_400_000).toISOString() },
      { id: "f2", eventId: "e_done", studentId: "u_stu2", rating: 4, comment: "Great difficulty curve. Wished for more web challenges.", createdAt: new Date(Date.now() - 17 * 86_400_000).toISOString() },
      { id: "f3", eventId: "e_done", studentId: "u_stu7", rating: 5, comment: "Smooth infra, zero downtime on the scoreboard. Loved it.", createdAt: new Date(Date.now() - 16 * 86_400_000).toISOString() },
    ],
    contactMessages: [],
    authUsers: [
      { profileId: "u_admin", email: "admin@campussphere.edu", passwordHash: demoHash("admin123") },
      { profileId: "u_coord1", email: "coordinator@campussphere.edu", passwordHash: demoHash("coord123") },
      { profileId: "u_coord2", email: "coord2@campussphere.edu", passwordHash: demoHash("coord123") },
      { profileId: "u_fac1", email: "faculty@campussphere.edu", passwordHash: demoHash("faculty123") },
      { profileId: "u_fac2", email: "faculty2@campussphere.edu", passwordHash: demoHash("faculty123") },
      ...["u_stu1", "u_stu2", "u_stu3", "u_stu4", "u_stu5", "u_stu6", "u_stu7", "u_stu8", "u_stu9", "u_stu10"].map((pid) => ({
        profileId: pid,
        email: profiles.find((p) => p.id === pid)!.email,
        passwordHash: demoHash("student123"),
      })),
    ],
    passwordResets: [],
    settings: {
      siteName: "CampusSphere",
      collegeName: "Pristine Institute of Technology",
      contactEmail: "events@campussphere.edu",
      allowRegistrations: true,
    },
  };

  return dbShape;
}
