-- ============================================================================
-- CampusSphere — seed.sql  (DEMO DATA — fictional identities, not for prod)
-- Run after 0001_init.sql. Auth users must be created separately via
-- Supabase Auth (email sign-ups) — link them by replacing the UUIDs below
-- with the real auth.users ids (kept fixed here for repeatable demos).
-- ============================================================================

-- Departments & venues (safe reference data)
insert into public.departments (id, name, code) values
  ('11111111-1111-4111-8111-111111111101', 'Computer Science & Engineering', 'CSE'),
  ('11111111-1111-4111-8111-111111111102', 'Electronics & Communication', 'ECE'),
  ('11111111-1111-4111-8111-111111111103', 'Electrical & Electronics', 'EEE'),
  ('11111111-1111-4111-8111-111111111104', 'Mechanical Engineering', 'ME'),
  ('11111111-1111-4111-8111-111111111105', 'Civil Engineering', 'CV'),
  ('11111111-1111-4111-8111-111111111106', 'AI & Machine Learning', 'AIML')
on conflict (code) do nothing;

insert into public.venues (id, name, location, capacity) values
  ('22222222-2222-4222-8222-222222222201', 'Main Auditorium', 'Block A · Ground Floor', 900),
  ('22222222-2222-4222-8222-222222222202', 'Seminar Hall 1', 'Block B · 2nd Floor', 220),
  ('22222222-2222-4222-8222-222222222203', 'Innovation Lab 2', 'CSE Block · 3rd Floor', 150),
  ('22222222-2222-4222-8222-222222222204', 'Open Air Theatre', 'Central Quad', 1500),
  ('22222222-2222-4222-8222-222222222205', 'Sports Complex', 'South Campus', 2000),
  ('22222222-2222-4222-8222-222222222206', 'Design Studio 4', 'Architecture Block · 1st Floor', 80);

-- Profiles: create these users in Supabase Auth first, then update the UUID
-- pairings below to match auth.users.id (demo mapping shown for clarity).
--
--   admin@campussphere.edu        -> role admin
--   coordinator@campussphere.edu  -> role coordinator
--   faculty@campussphere.edu      -> role faculty
--   student@campussphere.edu      -> role student (+ students row)
--
-- Example mapping once auth.users exist:
--   insert into public.profiles (id, name, email, phone, role) values
--     ('<auth-uuid-admin>',  'Arjun Mehta', 'admin@campussphere.edu',  '9810010001', 'admin'),
--     ('<auth-uuid-coord>',  'Riya Sharma', 'coordinator@campussphere.edu', '9810010002', 'coordinator'),
--     ('<auth-uuid-fac>',    'Dr. Meera Iyer', 'faculty@campussphere.edu', '9810010004', 'faculty'),
--     ('<auth-uuid-stu>',    'Aarav Kumar', 'student@campussphere.edu', '9810010011', 'student');
--
--   insert into public.students (profile_id, usn, department_id, semester) values
--     ('<auth-uuid-stu>', '1PI23CS001', '11111111-1111-4111-8111-111111111101', 5);

insert into public.settings (key, value) values
  ('site', '{"siteName":"CampusSphere","collegeName":"Pristine Institute of Technology","contactEmail":"events@campussphere.edu","allowRegistrations":true}'::jsonb);

-- Events demo rows reference the profile UUIDs you mapped above; sample:
--   insert into public.events
--     (title, category, description, event_date, start_time, end_time, venue_id, fee, capacity,
--      reg_deadline, eligibility, rules, faculty_id, coordinator_id, status, team_size_min, team_size_max, featured)
--   values
--     ('NeuraHack 2025', 'Hackathon',
--      'A 24-hour national-level hackathon with mentor tracks and a live demo expo.',
--      current_date + 10, '09:00', '09:00', '22222222-2222-4222-8222-222222222201',
--      299, 120, current_date + 8, 'Open to all UG students. Teams of 2-4.',
--      array['All code written during the 24-hour window.', 'Final demos limited to 4 minutes.'],
--      '<auth-uuid-fac>', '<auth-uuid-coord>', 'published', 2, 4, true);

-- ============================================================================
-- RLS VERIFICATION SNIPPETS
-- [PLACEHOLDER: policy test queries] — run with different JWTs to verify RLS.
--
--   -- 1) Anonymous can only see published/completed events:
--   select set_config('request.jwt.claims', '{}', true);
--   select count(*) from public.events;                       -- published only
--
--   -- 2) Student cannot create events:
--   select set_config('request.jwt.claims',
--     json_build_object('sub', '<auth-uuid-stu>', 'role', 'authenticated')::text, true);
--   insert into public.events (title, ...) values (...);      -- must FAIL
--
--   -- 3) Double registration blocked by unique(event_id, student_id):
--   insert into public.registrations (event_id, student_id, qr_code)
--     values ('<event>', '<stu>', 'CS-TEST-0001');            -- 2nd run must FAIL
--
--   -- 4) Capacity trigger fires:
--   -- Register capacity+1 students; the last insert must raise
--   --   'Event is at full capacity'.
--
--   -- 5) Faculty cannot read unpublished scores of other judges:
--   select * from public.scores where judge_id <> auth.uid(); -- empty for judges
-- ============================================================================
