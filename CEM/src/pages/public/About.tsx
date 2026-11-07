import { Award, BellRing, Database, Gauge, IndianRupee, LockKeyhole, QrCode, ShieldCheck, Trophy, UsersRound, Workflow } from "lucide-react";
import { LinkButton, SectionHeading } from "@/components/ui";

const MODULES = [
  { icon: UsersRound, title: "Teams & registrations", body: "Solo or USN-based team signups with capacity checks, deadlines and duplicate prevention enforced at the data layer." },
  { icon: QrCode, title: "QR attendance", body: "Every registration mints a one-time QR. Coordinators scan at the door; double check-ins are blocked automatically." },
  { icon: Trophy, title: "Judging & results", body: "Faculty score on rubrics, submit for approval, and admins publish verified standings in one click." },
  { icon: Award, title: "Certificates", body: "Participation and winner certificates with unique verification IDs, generated as downloadable PDFs." },
  { icon: IndianRupee, title: "Budgets & payments", body: "Sponsorship income, categorized expenses and per-registration payments roll up into live balance sheets." },
  { icon: BellRing, title: "Notifications", body: "Confirmations, announcements, schedule changes, results and certificates reach each dashboard instantly." },
];

const SECURITY = [
  { icon: ShieldCheck, title: "Role-based access", body: "Student, Coordinator, Faculty/Judge and Super Admin — enforced via protected routes in the client and Row Level Security in PostgreSQL." },
  { icon: Database, title: "Relational integrity", body: "17 normalized tables with foreign keys, unique constraints (event_id, student_id), CHECK constraints and capacity triggers." },
  { icon: LockKeyhole, title: "Zero secret leakage", body: "Only the anon key ships to the browser. Service-role credentials stay on the server — never in client bundles." },
  { icon: Workflow, title: "Approval workflows", body: "New events require Super Admin approval before publishing; results require sign-off before winner certificates mint." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <SectionHeading
        kicker="About the platform"
        title="One sphere for every campus moment"
        sub="CampusSphere is a full-stack college event management system built with React, TypeScript, Tailwind and Supabase — designed for scale, auditability and delightful UX."
      />

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        <div className="glass rounded-2xl p-7 lg:col-span-2">
          <h3 className="font-display text-xl font-bold text-ink">Why we built it</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Campus events drown in spreadsheets, WhatsApp groups and paper attendance sheets. CampusSphere replaces that chaos with a single audited pipeline:
            a coordinator drafts an event, the super admin approves it, students register solo or by team USNs, entry happens by QR, faculty judge on rubrics,
            and certificates flow automatically. Every action is traceable, every number on the admin dashboard is real.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            The demo you are browsing runs on a local, seeded dataset (clearly labeled). The production blueprint — Supabase schema, RLS policies, triggers and
            seed scripts — ships alongside in the repository.
          </p>
          <div className="mt-6 flex gap-3">
            <LinkButton to="/events">Explore events</LinkButton>
            <LinkButton to="/contact" variant="secondary">
              Talk to us
            </LinkButton>
          </div>
        </div>
        <div className="glass rounded-2xl p-7">
          <h3 className="font-display text-xl font-bold text-ink">By the numbers</h3>
          <ul className="mt-4 space-y-3.5 text-sm text-muted">
            {[
              "17 relational tables with full RLS",
              "4 role-aware dashboards",
              "9 functional modules end-to-end",
              "1 QR per ticket, single-use enforced",
              "Certificates with verification IDs",
            ].map((x) => (
              <li key={x} className="flex items-start gap-2.5">
                <Gauge className="mt-0.5 size-4 shrink-0 text-cyan-300" aria-hidden />
                {x}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-20">
        <SectionHeading kicker="Capabilities" title="Every module, fully wired" center />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <div key={m.title} className="glass card-hover rounded-2xl p-6">
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/40 to-cyan-500/25 text-violet-200">
                <m.icon className="size-5" aria-hidden />
              </div>
              <h3 className="font-display font-semibold text-ink">{m.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{m.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-20">
        <SectionHeading kicker="Trust" title="Security & governance" center />
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {SECURITY.map((s) => (
            <div key={s.title} className="glass card-hover flex gap-4 rounded-2xl p-6">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                <s.icon className="size-5" aria-hidden />
              </div>
              <div>
                <h3 className="font-display font-semibold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
