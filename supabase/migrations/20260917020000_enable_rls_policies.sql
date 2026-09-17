-- RLS defense-in-depth for GroundWork
--
-- Every table below is scoped to the caller's company via the existing
-- current_company_id() helper, which resolves auth.uid() to a company_id
-- through company_users. It returns null for callers with no company
-- (e.g. a signed-up-but-not-onboarded user), which safely excludes all rows.
--
-- IMPORTANT: API routes in this app use the Supabase service role key
-- (supabaseAdmin in lib/serverAuth.js), which has BYPASSRLS and ignores
-- every policy here. These policies do NOT protect against an API route
-- forgetting a `.eq('company_id', ...)` filter -- that class of bug can
-- only be caught by code review/tests, since the service role sees
-- everything regardless of RLS.
--
-- What this DOES protect against: direct calls to Supabase's REST API
-- using the public anon key or any signed-up user's own access token,
-- bypassing the Next.js app entirely. That endpoint is reachable by
-- anyone on the internet today. Right now several tables are only
-- inaccessible to that path because the `authenticated` role has no
-- GRANT on them (verified empirically) -- not because of any RLS policy.
-- That's fragile: the moment a grant is added for a future feature
-- (e.g. Supabase Realtime, which requires SELECT grants), these policies
-- are what stop it from becoming a cross-tenant data leak.

-- ============================================================
-- companies
-- ============================================================
alter table public.companies enable row level security;

drop policy if exists companies_select_own on public.companies;
create policy companies_select_own
  on public.companies
  for select
  using (id = current_company_id());

-- No insert/update/delete policy: companies are only created/modified via
-- the service-role-backed /api/signup route today.

-- ============================================================
-- company_users
-- ============================================================
alter table public.company_users enable row level security;

drop policy if exists company_users_select_own on public.company_users;
create policy company_users_select_own
  on public.company_users
  for select
  using (company_id = current_company_id());

-- No insert/update/delete policy: company_users rows are only written via
-- the service-role-backed /api/signup route today.

-- ============================================================
-- crews
-- ============================================================
alter table public.crews enable row level security;

drop policy if exists crews_select_own on public.crews;
create policy crews_select_own
  on public.crews for select
  using (company_id = current_company_id());

drop policy if exists crews_insert_own on public.crews;
create policy crews_insert_own
  on public.crews for insert
  with check (company_id = current_company_id());

drop policy if exists crews_update_own on public.crews;
create policy crews_update_own
  on public.crews for update
  using (company_id = current_company_id())
  with check (company_id = current_company_id());

drop policy if exists crews_delete_own on public.crews;
create policy crews_delete_own
  on public.crews for delete
  using (company_id = current_company_id());

-- ============================================================
-- crew_availability
-- ============================================================
alter table public.crew_availability enable row level security;

drop policy if exists crew_availability_select_own on public.crew_availability;
create policy crew_availability_select_own
  on public.crew_availability for select
  using (company_id = current_company_id());

drop policy if exists crew_availability_insert_own on public.crew_availability;
create policy crew_availability_insert_own
  on public.crew_availability for insert
  with check (company_id = current_company_id());

drop policy if exists crew_availability_update_own on public.crew_availability;
create policy crew_availability_update_own
  on public.crew_availability for update
  using (company_id = current_company_id())
  with check (company_id = current_company_id());

drop policy if exists crew_availability_delete_own on public.crew_availability;
create policy crew_availability_delete_own
  on public.crew_availability for delete
  using (company_id = current_company_id());

-- ============================================================
-- workers
-- ============================================================
alter table public.workers enable row level security;

drop policy if exists workers_select_own on public.workers;
create policy workers_select_own
  on public.workers for select
  using (company_id = current_company_id());

drop policy if exists workers_insert_own on public.workers;
create policy workers_insert_own
  on public.workers for insert
  with check (company_id = current_company_id());

drop policy if exists workers_update_own on public.workers;
create policy workers_update_own
  on public.workers for update
  using (company_id = current_company_id())
  with check (company_id = current_company_id());

drop policy if exists workers_delete_own on public.workers;
create policy workers_delete_own
  on public.workers for delete
  using (company_id = current_company_id());

-- ============================================================
-- equipment
-- ============================================================
alter table public.equipment enable row level security;

drop policy if exists equipment_select_own on public.equipment;
create policy equipment_select_own
  on public.equipment for select
  using (company_id = current_company_id());

drop policy if exists equipment_insert_own on public.equipment;
create policy equipment_insert_own
  on public.equipment for insert
  with check (company_id = current_company_id());

drop policy if exists equipment_update_own on public.equipment;
create policy equipment_update_own
  on public.equipment for update
  using (company_id = current_company_id())
  with check (company_id = current_company_id());

drop policy if exists equipment_delete_own on public.equipment;
create policy equipment_delete_own
  on public.equipment for delete
  using (company_id = current_company_id());

-- ============================================================
-- perm_equipment_assignments
-- ============================================================
alter table public.perm_equipment_assignments enable row level security;

drop policy if exists perm_equipment_assignments_select_own on public.perm_equipment_assignments;
create policy perm_equipment_assignments_select_own
  on public.perm_equipment_assignments for select
  using (company_id = current_company_id());

drop policy if exists perm_equipment_assignments_insert_own on public.perm_equipment_assignments;
create policy perm_equipment_assignments_insert_own
  on public.perm_equipment_assignments for insert
  with check (company_id = current_company_id());

drop policy if exists perm_equipment_assignments_update_own on public.perm_equipment_assignments;
create policy perm_equipment_assignments_update_own
  on public.perm_equipment_assignments for update
  using (company_id = current_company_id())
  with check (company_id = current_company_id());

drop policy if exists perm_equipment_assignments_delete_own on public.perm_equipment_assignments;
create policy perm_equipment_assignments_delete_own
  on public.perm_equipment_assignments for delete
  using (company_id = current_company_id());

-- ============================================================
-- jobs
-- ============================================================
alter table public.jobs enable row level security;

drop policy if exists jobs_select_own on public.jobs;
create policy jobs_select_own
  on public.jobs for select
  using (company_id = current_company_id());

drop policy if exists jobs_insert_own on public.jobs;
create policy jobs_insert_own
  on public.jobs for insert
  with check (company_id = current_company_id());

drop policy if exists jobs_update_own on public.jobs;
create policy jobs_update_own
  on public.jobs for update
  using (company_id = current_company_id())
  with check (company_id = current_company_id());

drop policy if exists jobs_delete_own on public.jobs;
create policy jobs_delete_own
  on public.jobs for delete
  using (company_id = current_company_id());

-- ============================================================
-- job_equipment
-- ============================================================
alter table public.job_equipment enable row level security;

drop policy if exists job_equipment_select_own on public.job_equipment;
create policy job_equipment_select_own
  on public.job_equipment for select
  using (company_id = current_company_id());

drop policy if exists job_equipment_insert_own on public.job_equipment;
create policy job_equipment_insert_own
  on public.job_equipment for insert
  with check (company_id = current_company_id());

drop policy if exists job_equipment_update_own on public.job_equipment;
create policy job_equipment_update_own
  on public.job_equipment for update
  using (company_id = current_company_id())
  with check (company_id = current_company_id());

drop policy if exists job_equipment_delete_own on public.job_equipment;
create policy job_equipment_delete_own
  on public.job_equipment for delete
  using (company_id = current_company_id());

-- ============================================================
-- equipment_bookings
-- ============================================================
alter table public.equipment_bookings enable row level security;

drop policy if exists equipment_bookings_select_own on public.equipment_bookings;
create policy equipment_bookings_select_own
  on public.equipment_bookings for select
  using (company_id = current_company_id());

drop policy if exists equipment_bookings_insert_own on public.equipment_bookings;
create policy equipment_bookings_insert_own
  on public.equipment_bookings for insert
  with check (company_id = current_company_id());

drop policy if exists equipment_bookings_update_own on public.equipment_bookings;
create policy equipment_bookings_update_own
  on public.equipment_bookings for update
  using (company_id = current_company_id())
  with check (company_id = current_company_id());

drop policy if exists equipment_bookings_delete_own on public.equipment_bookings;
create policy equipment_bookings_delete_own
  on public.equipment_bookings for delete
  using (company_id = current_company_id());

-- ============================================================
-- work_schedule
-- ============================================================
alter table public.work_schedule enable row level security;

drop policy if exists work_schedule_select_own on public.work_schedule;
create policy work_schedule_select_own
  on public.work_schedule for select
  using (company_id = current_company_id());

drop policy if exists work_schedule_insert_own on public.work_schedule;
create policy work_schedule_insert_own
  on public.work_schedule for insert
  with check (company_id = current_company_id());

drop policy if exists work_schedule_update_own on public.work_schedule;
create policy work_schedule_update_own
  on public.work_schedule for update
  using (company_id = current_company_id())
  with check (company_id = current_company_id());

drop policy if exists work_schedule_delete_own on public.work_schedule;
create policy work_schedule_delete_own
  on public.work_schedule for delete
  using (company_id = current_company_id());

-- ============================================================
-- job_notes
-- ============================================================
alter table public.job_notes enable row level security;

drop policy if exists job_notes_select_own on public.job_notes;
create policy job_notes_select_own
  on public.job_notes for select
  using (company_id = current_company_id());

drop policy if exists job_notes_insert_own on public.job_notes;
create policy job_notes_insert_own
  on public.job_notes for insert
  with check (company_id = current_company_id());

drop policy if exists job_notes_update_own on public.job_notes;
create policy job_notes_update_own
  on public.job_notes for update
  using (company_id = current_company_id())
  with check (company_id = current_company_id());

drop policy if exists job_notes_delete_own on public.job_notes;
create policy job_notes_delete_own
  on public.job_notes for delete
  using (company_id = current_company_id());
