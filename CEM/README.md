# CampusSphere — College Event Management System

A complete, role-aware event platform for colleges: discovery → registration (solo/team) → QR attendance → faculty judging → verified results → certificates, plus budgets, payments, announcements, feedback and a full Super Admin console.

**Stack:** React 19 + TypeScript (strict) + Tailwind CSS v4 + Supabase blueprint (PostgreSQL, Auth, RLS, Storage).

---

## Quick start

```bash
npm install
npm run dev        # start dev server
npm run build      # production build (single-file dist/index.html)
npx vitest run     # run the 26-unit/component test suite
```

The repository runs **out of the box** on a deterministic, clearly-labeled demo dataset (localStorage persistence). No secrets required.

### Demo accounts

| Role            | Email                          | Password     |
| --------------- | ------------------------------ | ------------ |
| Student         | `student@campussphere.edu`     | `student123` |
| Coordinator     | `coordinator@campussphere.edu` | `coord123`   |
| Faculty / Judge | `faculty@campussphere.edu`     | `faculty123` |
| Super Admin     | `admin@campussphere.edu`       | `admin123`   |

> The seeded event **CodeSprint Live** is dated *today* — use its demo QR codes (visible in Student → My Events → QR ticket) to test the Attendance scanner, e.g. `CS-TODY-ATTND1`.

---

## Architecture

```
src/
├── App.tsx                     # HashRouter, role-guarded route tree
├── index.css                   # Tailwind v4 theme tokens, glass/neon utilities
├── assets/                     # Generated artwork (inlined at build)
├── lib/
│   ├── utils.ts                # formatters, CSV export, helpers
│   ├── validators.ts           # Zod schemas for every form
│   └── pdf.ts                  # jsPDF certificate generator
├── services/                   # ★ Single data-access seam — swap target for Supabase
│   ├── db.ts                   # Local persistence engine (+ pub/sub, useDbTick)
│   ├── seed.ts                 # DEMO DATA snapshot (fictional, labeled)
│   ├── types.ts                # Domain model mirroring the SQL schema
│   ├── auth.ts                 # register/login/reset/roles (Supabase Auth in prod)
│   ├── events.ts               # CRUD, approval workflow, analytics
│   ├── registrations.ts        # individual/team registration, QR attendance
│   ├── results.ts              # scores → submission → approval → winners
│   ├── engage.ts               # feedback, announcements, budgets, payments, inbox
│   ├── admin.ts                # users, departments, venues, settings, reports
│   ├── notify.ts               # in-app notification center
│   ├── lookups.ts              # JOIN-equivalent helpers
│   └── supabase.ts             # migration path + env wiring (anon key only)
├── components/                 # ui.tsx, overlays.tsx, data.tsx, eventBits.tsx, guards, ErrorBoundary
├── context/AppContext.tsx      # session store
├── layouts/                    # PublicLayout + collapsible DashboardLayout
└── pages/
    ├── public/                 # Home, Explore, EventDetails, Calendar, About, Contact
    ├── auth/                   # Login, Register (student fields), ResetPassword
    ├── student/                # Overview, MyEvents (QR tickets), Teams, Certificates, Feedback
    ├── coordinator/            # Overview, EventForm, EventManage (6-tab console)
    ├── faculty/                # Assigned events, rubric Judging desk
    └── admin/                  # Overview (charts), Approvals, Users, Finance, Organization
supabase/
├── migrations/0001_init.sql    # 19 tables, constraints, triggers, full RLS policies
└── seed.sql                    # demo seed + RLS verification snippets
```

## Going to production (Supabase)

1. `npm install @supabase/supabase-js`
2. Copy `.env.example` → `.env`, set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (never the `service_role` key).
3. Run `supabase/migrations/0001_init.sql`, then `supabase/seed.sql` in the SQL editor.
4. Re-implement each `services/*.ts` function with typed Supabase queries — call signatures and component code stay unchanged. `services/supabase.ts` documents the pattern.
5. Enable Storage buckets `posters` (public, 2 MB image/* validation via Edge Function) and `certificates` (signed URLs).

Security model: every table has RLS enabled; role rules (student/coordinator/faculty/admin) are enforced per-operation, with helper `public.auth_role()`. Client guards (`RequireRole`) are UX; the DB is the authority.

## Manual QA checklist (per role)

**Public:** search/filter/sort Explore · calendar day drill-down · event details (rules, capacity, coordinator) · contact form validation → admin inbox.

**Student:** register solo + team (size limits, bad USN, dupes rejected) · QR ticket opens · cancel before event day · check-in lands via QR · feedback after attendance · certificate PDF downloads with unique ID.

**Coordinator:** create event → appears in Admin Approvals · edit blocked capacity below registrations · registrations table + CSV export · attendance scanner (valid / duplicate / invalid) · announcements broadcast to participants · budget ledger income/expense + pie · results approval after judge submit · participation certificates mint.

**Faculty:** only assigned events open · rubric 0–10 with clamping · save rows, submit locks sheet · standings read-only after submit.

**Super Admin:** approve/reject (reason reaches coordinator) · users role/activation (self-protected, last-admin protected) · departments/venues CRUD with referential blockers · payments table + CSV · feedback averages · settings toggle actually closes registration · demo reset.

## Staged PR outline

1. `feat/design-system-public` — theme, components, public pages.
2. `feat/auth-roles-dashboards` — auth service, guards, shells.
3. `feat/schema-events-approval` — services, SQL migration, event CRUD + approvals.
4. `feat/registrations-teams-logistics` — registration rules, teams, venues UX.
5. `feat/attendance-results-certs-finance` — QR, judging, certs, budgets, notifications, feedback.
6. `chore/qa-tests-docs` — vitest suite, seed demo, README.

## Known limitations

- Demo backend is localStorage (passwords use a non-secure demo hash) — Supabase path documented, not wired to a live project.
- QR "scanning" is code entry / simulated scan — camera capture (`html5-qrcode`) is a drop-in TODO on the Attendance tab.
- Payments are simulated as instant-success; a gateway (Razorpay/Stripe) slots into `services/registrations.ts → createRegistrationRows`.
- Email delivery of password resets is simulated on-screen in demo mode.
