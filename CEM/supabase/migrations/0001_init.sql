-- ============================================================================
-- CampusSphere — 0001_init.sql
-- Schema + constraints + triggers + Row Level Security for Supabase/PostgreSQL
-- Roles: student | coordinator | faculty | admin
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------- ENUMS -----------------------------------------
create type public.app_role      as enum ('student', 'coordinator', 'faculty', 'admin');
create type public.event_status  as enum ('draft', 'pending', 'rejected', 'published', 'completed');
create type public.reg_status    as enum ('confirmed', 'cancelled', 'attended');
create type public.cert_kind     as enum ('participation', 'winner');
create type public.ledger_kind   as enum ('income', 'expense');
create type public.pay_status    as enum ('paid', 'waived', 'refunded');
create type public.notif_kind    as enum ('registration', 'announcement', 'schedule', 'deadline', 'result', 'certificate', 'approval', 'system');

-- ---------------------------- TABLES ----------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) >= 3),
  email       text not null unique,
  phone       text not null default '',
  role        app_role not null default 'student',
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.departments (
  id    uuid primary key default gen_random_uuid(),
  name  text not null,
  code  text not null unique check (code ~ '^[A-Z]{2,6}$')
);

create table public.students (
  profile_id    uuid primary key references public.profiles(id) on delete cascade,
  usn           text not null unique check (usn ~ '^[A-Z0-9]{6,15}$'),
  department_id uuid not null references public.departments(id),
  semester      int  not null check (semester between 1 and 8)
);

create table public.venues (
  id       uuid primary key default gen_random_uuid(),
  name     text not null,
  location text not null,
  capacity int  not null check (capacity >= 10)
);

create table public.events (
  id               uuid primary key default gen_random_uuid(),
  title            text not null check (char_length(title) >= 4),
  category         text not null,
  description      text not null check (char_length(description) >= 30),
  poster_path      text,                       -- Storage object path (bucket: posters)
  event_date       date not null,
  start_time       time not null,
  end_time         time not null,
  venue_id         uuid not null references public.venues(id),
  fee              int  not null default 0 check (fee >= 0),
  capacity         int  not null check (capacity >= 1),
  reg_deadline     date not null,
  eligibility      text not null,
  rules            text[] not null default '{}',
  faculty_id       uuid not null references public.profiles(id),
  coordinator_id   uuid not null references public.profiles(id),
  status           event_status not null default 'pending',
  team_size_min    int  not null default 1 check (team_size_min between 1 and 12),
  team_size_max    int  not null default 1 check (team_size_max between 1 and 12),
  featured         boolean not null default false,
  results_published boolean not null default false,
  scores_submitted  boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (team_size_max >= team_size_min),
  check (reg_deadline <= event_date)
);
create index idx_events_status_date on public.events(status, event_date);
create index idx_events_coordinator on public.events(coordinator_id);
create index idx_events_faculty    on public.events(faculty_id);
create index idx_events_category   on public.events(category);

create table public.teams (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  name       text not null check (char_length(name) between 3 and 30),
  leader_id  uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (event_id, name)
);

create table public.team_members (
  team_id    uuid not null references public.teams(id) on delete cascade,
  student_id uuid not null references public.students(profile_id),
  primary key (team_id, student_id)
);

-- Duplicate prevention lives here: UNIQUE (event_id, student_id)
create table public.registrations (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  student_id  uuid not null references public.students(profile_id),
  team_id     uuid references public.teams(id) on delete set null,
  status      reg_status not null default 'confirmed',
  qr_code     text not null unique,
  attended_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (event_id, student_id)
);
create index idx_regs_event   on public.registrations(event_id) where status <> 'cancelled';
create index idx_regs_student on public.registrations(student_id);

create table public.attendance (
  id              uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) unique,  -- one check-in ever
  event_id        uuid not null references public.events(id),
  checked_in_at   timestamptz not null default now()
);

create table public.judges (
  event_id   uuid not null references public.events(id) on delete cascade,
  faculty_id uuid not null references public.profiles(id),
  primary key (event_id, faculty_id)
);

create table public.scores (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events(id) on delete cascade,
  registration_id uuid not null references public.registrations(id) on delete cascade,
  judge_id        uuid not null references public.profiles(id),
  innovation      numeric(4,1) not null check (innovation   between 0 and 10),
  execution       numeric(4,1) not null check (execution    between 0 and 10),
  presentation    numeric(4,1) not null check (presentation between 0 and 10),
  total           numeric(5,1) generated always as (innovation + execution + presentation) stored,
  updated_at      timestamptz not null default now(),
  unique (event_id, registration_id)
);

create table public.certificates (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.students(profile_id),
  event_id    uuid not null references public.events(id),
  kind        cert_kind not null,
  rank        text,
  cert_uid    text not null unique,
  issued_at   timestamptz not null default now(),
  unique (event_id, student_id, kind)
);

create table public.expenses (
  id        uuid primary key default gen_random_uuid(),
  event_id  uuid not null references public.events(id) on delete cascade,
  kind      ledger_kind not null,
  category  text not null,
  label     text not null,
  amount    numeric(12,2) not null check (amount > 0),
  entry_date date not null
);

create table public.payments (
  id              uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) unique,
  event_id        uuid not null references public.events(id),
  student_id      uuid not null references public.students(profile_id),
  amount          numeric(12,2) not null check (amount >= 0),
  status          pay_status not null default 'paid',
  created_at      timestamptz not null default now()
);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  body       text not null,
  kind       notif_kind not null default 'system',
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notif_user on public.notifications(user_id, read);

create table public.announcements (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  title      text not null,
  body       text not null,
  created_at timestamptz not null default now()
);

create table public.feedback (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  student_id uuid not null references public.students(profile_id),
  rating     int  not null check (rating between 1 and 5),
  comment    text not null check (char_length(comment) >= 10),
  created_at timestamptz not null default now(),
  unique (event_id, student_id)
);

create table public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text not null,
  message    text not null,
  handled    boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.settings (
  key   text primary key,
  value jsonb not null
);

-- ---------------------------- TRIGGER FUNCTIONS --------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger trg_events_updated before update on public.events
  for each row execute function public.touch_updated_at();
create trigger trg_scores_updated before update on public.scores
  for each row execute function public.touch_updated_at();

-- Capacity + open-window enforcement (the DB-side twin of the app gate)
create or replace function public.enforce_registration_capacity() returns trigger
language plpgsql security definer as $$
declare
  v_event public.events%rowtype;
  v_count int;
begin
  select * into v_event from public.events where id = new.event_id for update;
  if v_event.status <> 'published' then
    raise exception 'Event is not open for registration';
  end if;
  if current_date > v_event.reg_deadline then
    raise exception 'Registration deadline has passed';
  end if;
  if current_date > v_event.event_date then
    raise exception 'Event already took place';
  end if;
  select count(*) into v_count from public.registrations
    where event_id = new.event_id and status <> 'cancelled';
  if v_count >= v_event.capacity then
    raise exception 'Event is at full capacity';
  end if;
  return new;
end $$;

create trigger trg_reg_capacity before insert on public.registrations
  for each row execute function public.enforce_registration_capacity();

-- Notification on registration confirmation (replaces app-side notify for prod)
create or replace function public.notify_registration() returns trigger
language plpgsql security definer as $$
declare v_title text;
begin
  select title into v_title from public.events where id = new.event_id;
  insert into public.notifications (user_id, title, body, kind)
  values (new.student_id, 'Registration confirmed',
          'You are registered for ' || coalesce(v_title, 'an event') || '.', 'registration');
  return new;
end $$;

create trigger trg_reg_notify after insert on public.registrations
  for each row execute function public.notify_registration();

-- ============================ ROW LEVEL SECURITY =============================
alter table public.profiles        enable row level security;
alter table public.departments     enable row level security;
alter table public.students        enable row level security;
alter table public.venues          enable row level security;
alter table public.events          enable row level security;
alter table public.teams           enable row level security;
alter table public.team_members    enable row level security;
alter table public.registrations   enable row level security;
alter table public.attendance      enable row level security;
alter table public.judges          enable row level security;
alter table public.scores          enable row level security;
alter table public.certificates    enable row level security;
alter table public.expenses        enable row level security;
alter table public.payments        enable row level security;
alter table public.notifications   enable row level security;
alter table public.announcements   enable row level security;
alter table public.feedback        enable row level security;
alter table public.contact_messages enable row level security;
alter table public.settings        enable row level security;

-- Role helper (single profiles lookup per statement, security definer, RLS-safe)
create or replace function public.auth_role() returns app_role
language sql stable security definer
set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ------------------------------- profiles -----------------------------------
create policy p_profiles_select on public.profiles for select
  using (true);  -- names are shown on public winner boards
create policy p_profiles_update_self on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
create policy p_profiles_admin on public.profiles for all
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');

-- --------------------------- departments/venues -----------------------------
create policy p_ref_select on public.departments for select using (true);
create policy p_ref_admin  on public.departments for all
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');
create policy p_venues_select on public.venues for select using (true);
create policy p_venues_admin  on public.venues for all
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');

-- -------------------------------- students ----------------------------------
create policy p_students_self_select on public.students for select
  using (profile_id = auth.uid() or public.auth_role() in ('admin', 'coordinator', 'faculty'));
create policy p_students_self_insert on public.students for insert
  with check (profile_id = auth.uid());
create policy p_students_self_update on public.students for update
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- --------------------------------- events -----------------------------------
create policy p_events_public_select on public.events for select
  using (status in ('published', 'completed')
         or coordinator_id = auth.uid()
         or faculty_id = auth.uid()
         or public.auth_role() = 'admin');
create policy p_events_coordinator_insert on public.events for insert
  with check (public.auth_role() = 'coordinator' and coordinator_id = auth.uid() and status in ('draft', 'pending'));
create policy p_events_coordinator_update on public.events for update
  using (coordinator_id = auth.uid()) with check (coordinator_id = auth.uid());
create policy p_events_admin on public.events for all
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');
create policy p_events_coordinator_delete on public.events for delete
  using (coordinator_id = auth.uid() and not exists
    (select 1 from public.registrations r where r.event_id = id and r.status <> 'cancelled'));

-- --------------------------------- teams ------------------------------------
create policy p_teams_member_select on public.teams for select using (true);
create policy p_teams_insert on public.teams for insert
  with check (leader_id = auth.uid() and public.auth_role() = 'student');
create policy p_team_members_select on public.team_members for select using (true);
create policy p_team_members_insert on public.team_members for insert
  with check (exists (select 1 from public.teams t where t.id = team_id and t.leader_id = auth.uid()));
create policy p_team_members_self_delete on public.team_members for delete
  using (student_id = auth.uid() or public.auth_role() in ('admin', 'coordinator'));

-- ----------------------------- registrations --------------------------------
create policy p_regs_student_select on public.registrations for select
  using (student_id = auth.uid()
         or public.auth_role() = 'admin'
         or exists (select 1 from public.events e where e.id = event_id and (e.coordinator_id = auth.uid() or e.faculty_id = auth.uid())));
create policy p_regs_student_insert on public.registrations for insert
  with check (student_id = auth.uid() and public.auth_role() = 'student');  -- capacity trigger also fires
create policy p_regs_student_cancel on public.registrations for update
  using (student_id = auth.uid() and status = 'confirmed')
  with check (student_id = auth.uid());
create policy p_regs_staff_update on public.registrations for update
  using (public.auth_role() in ('admin', 'coordinator'));

-- ------------------------------ attendance ----------------------------------
create policy p_attendance_select on public.attendance for select
  using (public.auth_role() in ('admin', 'coordinator')
         or exists (select 1 from public.registrations r where r.id = registration_id and r.student_id = auth.uid()));
create policy p_attendance_staff_insert on public.attendance for insert
  with check (public.auth_role() in ('admin', 'coordinator'));

-- --------------------------------- judges -----------------------------------
create policy p_judges_select on public.judges for select using (true);
create policy p_judges_write on public.judges for all
  using (public.auth_role() in ('admin', 'coordinator'))
  with check (public.auth_role() in ('admin', 'coordinator'));

-- --------------------------------- scores -----------------------------------
create policy p_scores_public_published on public.scores for select
  using (exists (select 1 from public.events e where e.id = event_id and e.results_published)
         or judge_id = auth.uid()
         or public.auth_role() in ('admin')
         or exists (select 1 from public.events e where e.id = event_id and e.coordinator_id = auth.uid()));
create policy p_scores_judge_write on public.scores for insert
  with check (judge_id = auth.uid() and exists
    (select 1 from public.events e where e.id = event_id and e.faculty_id = auth.uid() and not e.scores_submitted));
create policy p_scores_judge_update on public.scores for update
  using (judge_id = auth.uid() and exists
    (select 1 from public.events e where e.id = event_id and e.faculty_id = auth.uid() and not e.scores_submitted));

-- ------------------------------- certificates -------------------------------
create policy p_certs_owner_select on public.certificates for select
  using (student_id = auth.uid() or public.auth_role() in ('admin', 'coordinator', 'faculty'));
create policy p_certs_staff_insert on public.certificates for insert
  with check (public.auth_role() in ('admin', 'coordinator'));

-- -------------------------------- expenses ----------------------------------
create policy p_expenses_select on public.expenses for select
  using (public.auth_role() = 'admin' or exists
    (select 1 from public.events e where e.id = event_id and e.coordinator_id = auth.uid()));
create policy p_expenses_write on public.expenses for all
  using (public.auth_role() = 'admin' or exists
    (select 1 from public.events e where e.id = event_id and e.coordinator_id = auth.uid()))
  with check (public.auth_role() = 'admin' or exists
    (select 1 from public.events e where e.id = event_id and e.coordinator_id = auth.uid()));

-- -------------------------------- payments ----------------------------------
create policy p_payments_owner_select on public.payments for select
  using (student_id = auth.uid() or public.auth_role() = 'admin');
create policy p_payments_insert on public.payments for insert
  with check (student_id = auth.uid());
create policy p_payments_admin_update on public.payments for update
  using (public.auth_role() = 'admin');

-- ------------------------------ notifications -------------------------------
create policy p_notif_owner on public.notifications for select using (user_id = auth.uid());
create policy p_notif_owner_update on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy p_notif_staff_insert on public.notifications for insert
  with check (public.auth_role() in ('admin', 'coordinator', 'faculty'));

-- ------------------------------ announcements -------------------------------
create policy p_ann_select on public.announcements for select
  using (exists (select 1 from public.events e where e.id = event_id and e.status in ('published', 'completed')));
create policy p_ann_write on public.announcements for all
  using (exists (select 1 from public.events e where e.id = event_id and e.coordinator_id = auth.uid())
         or public.auth_role() = 'admin')
  with check (exists (select 1 from public.events e where e.id = event_id and e.coordinator_id = auth.uid())
         or public.auth_role() = 'admin');

-- -------------------------------- feedback ----------------------------------
create policy p_feedback_public_select on public.feedback for select using (true);
create policy p_feedback_attended_insert on public.feedback for insert
  with check (student_id = auth.uid() and exists
    (select 1 from public.registrations r
      where r.event_id = feedback.event_id and r.student_id = auth.uid() and r.status = 'attended'));

-- ---------------------------- contact_messages ------------------------------
create policy p_contact_insert_anon on public.contact_messages for insert with check (true);
create policy p_contact_admin on public.contact_messages for all
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');

-- -------------------------------- settings ----------------------------------
create policy p_settings_read   on public.settings for select using (true);
create policy p_settings_admin  on public.settings for all
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');

-- ============================== STORAGE ======================================
-- Buckets (run once in dashboard or via API; included for reference):
--   insert into storage.buckets (id, name, public) values ('posters', 'posters', true);
--   insert into storage.buckets (id, name, public) values ('certificates', 'certificates', false);
-- Posters: public read; coordinators write only own folder; 2MB, image/* enforced by edge fn.
-- Certificates: signed-URL reads for owner + staff.
