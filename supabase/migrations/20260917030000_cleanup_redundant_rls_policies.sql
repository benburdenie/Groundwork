-- Cleanup after 20260917020000_enable_rls_policies.sql.
--
-- That migration was written without visibility into policies already on
-- these tables (there was no supabase/ directory in the repo to check
-- against). Turns out 10 of the 12 tables already had a correct,
-- company-scoped RLS policy in place (e.g. crews_access, jobs_access),
-- using the exact same `company_id = current_company_id()` check. This
-- drops the redundant duplicates added by that migration and keeps the
-- pre-existing ones.
--
-- It also fixes companies (the pre-existing policy depends on a SELECT
-- grant on company_users that doesn't exist, so it always errors instead
-- of filtering -- keep the new current_company_id()-based policy instead,
-- which has no such dependency).
--
-- For company_users, the pre-existing policy (self row only, via
-- `user_id = auth.uid()`) is intentionally kept over the new one (whole
-- company) -- decided to keep member visibility narrow since no feature
-- today needs a team directory.

-- ============================================================
-- Drop redundant duplicates on tables that already had correct policies
-- ============================================================
drop policy if exists crew_availability_select_own on public.crew_availability;
drop policy if exists crew_availability_insert_own on public.crew_availability;
drop policy if exists crew_availability_update_own on public.crew_availability;
drop policy if exists crew_availability_delete_own on public.crew_availability;

drop policy if exists crews_select_own on public.crews;
drop policy if exists crews_insert_own on public.crews;
drop policy if exists crews_update_own on public.crews;
drop policy if exists crews_delete_own on public.crews;

drop policy if exists equipment_select_own on public.equipment;
drop policy if exists equipment_insert_own on public.equipment;
drop policy if exists equipment_update_own on public.equipment;
drop policy if exists equipment_delete_own on public.equipment;

drop policy if exists equipment_bookings_select_own on public.equipment_bookings;
drop policy if exists equipment_bookings_insert_own on public.equipment_bookings;
drop policy if exists equipment_bookings_update_own on public.equipment_bookings;
drop policy if exists equipment_bookings_delete_own on public.equipment_bookings;

drop policy if exists job_equipment_select_own on public.job_equipment;
drop policy if exists job_equipment_insert_own on public.job_equipment;
drop policy if exists job_equipment_update_own on public.job_equipment;
drop policy if exists job_equipment_delete_own on public.job_equipment;

drop policy if exists job_notes_select_own on public.job_notes;
drop policy if exists job_notes_insert_own on public.job_notes;
drop policy if exists job_notes_update_own on public.job_notes;
drop policy if exists job_notes_delete_own on public.job_notes;

drop policy if exists jobs_select_own on public.jobs;
drop policy if exists jobs_insert_own on public.jobs;
drop policy if exists jobs_update_own on public.jobs;
drop policy if exists jobs_delete_own on public.jobs;

drop policy if exists perm_equipment_assignments_select_own on public.perm_equipment_assignments;
drop policy if exists perm_equipment_assignments_insert_own on public.perm_equipment_assignments;
drop policy if exists perm_equipment_assignments_update_own on public.perm_equipment_assignments;
drop policy if exists perm_equipment_assignments_delete_own on public.perm_equipment_assignments;

drop policy if exists work_schedule_select_own on public.work_schedule;
drop policy if exists work_schedule_insert_own on public.work_schedule;
drop policy if exists work_schedule_update_own on public.work_schedule;
drop policy if exists work_schedule_delete_own on public.work_schedule;

drop policy if exists workers_select_own on public.workers;
drop policy if exists workers_insert_own on public.workers;
drop policy if exists workers_update_own on public.workers;
drop policy if exists workers_delete_own on public.workers;

-- ============================================================
-- companies: drop the broken pre-existing policy, keep the new one
-- ============================================================
drop policy if exists "Users can view their own company" on public.companies;
-- companies_select_own (id = current_company_id()) remains.

-- ============================================================
-- company_users: drop the new (broader) policy, keep the pre-existing
-- one that scopes to the caller's own row only
-- ============================================================
drop policy if exists company_users_select_own on public.company_users;
-- "Users can view their own company_user row" (user_id = auth.uid()) remains.
