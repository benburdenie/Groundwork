-- Fix Supabase Security Advisor warnings on the two helper functions.
--
-- function_search_path_mutable: pin search_path so a caller can't shadow
-- public objects (e.g. company_users) by prepending their own schema.
-- 'public' rather than '' because the function bodies reference tables
-- unqualified.
--
-- current_company_id() is only meaningful for signed-in users, so it's
-- restricted to authenticated. Note the RLS policies that call it have no
-- TO clause, so an anon REST request against a granted table now errors
-- with "permission denied for function" instead of returning zero rows --
-- still denied either way. API routes use the service role (BYPASSRLS),
-- so they never evaluate these policies.
--
-- set_updated_at() is a trigger function and can't be called directly,
-- so its default execute grants are left alone.

alter function public.current_company_id() set search_path = public;
alter function public.set_updated_at()     set search_path = public;

revoke execute on function public.current_company_id() from public;
revoke execute on function public.current_company_id() from anon;
grant  execute on function public.current_company_id() to authenticated;
