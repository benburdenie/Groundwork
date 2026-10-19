-- Base schema: the tables, functions, triggers and original RLS policies that
-- existed before the later migrations in this folder. Exported from the
-- production database on 2026-10-19 so a fresh Supabase project can be built
-- from this folder alone.
--
-- Run the migrations in filename order. The later ones are written to be safe on
-- top of this file (drop/create if exists).

create extension if not exists "uuid-ossp" with schema extensions;

-- ---------------------------------------------------------------- tables

create table public.companies (
  id uuid default extensions.uuid_generate_v4() not null,
  name text not null,
  slug text not null,
  owner_id uuid,
  timezone text default 'America/Vancouver'::text not null,
  work_start_hour integer default 7 not null,
  work_end_hour integer default 17 not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint companies_pkey primary key (id),
  constraint companies_slug_key unique (slug)
);

create table public.company_users (
  id uuid default extensions.uuid_generate_v4() not null,
  company_id uuid not null,
  user_id uuid not null,
  role text default 'worker'::text not null,
  display_name text not null,
  email text not null,
  phone text,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint company_users_pkey primary key (id),
  constraint company_users_company_id_user_id_key unique (company_id, user_id),
  constraint company_users_role_check check (role = any (array['owner'::text, 'dispatcher'::text, 'foreman'::text, 'worker'::text]))
);

create table public.crews (
  id uuid default extensions.uuid_generate_v4() not null,
  company_id uuid not null,
  name text not null,
  foreman_name text,
  color text default '#F5C800'::text not null,
  is_active boolean default true not null,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint crews_pkey primary key (id)
);

create table public.crew_availability (
  id uuid default extensions.uuid_generate_v4() not null,
  company_id uuid not null,
  crew_id uuid not null,
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamp with time zone default now() not null,
  constraint crew_availability_pkey primary key (id),
  constraint crew_availability_check check (end_date >= start_date)
);

create table public.workers (
  id uuid default extensions.uuid_generate_v4() not null,
  company_id uuid not null,
  crew_id uuid,
  user_id uuid,
  name text not null,
  role text default 'Labourer'::text not null,
  phone text,
  email text,
  is_active boolean default true not null,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint workers_pkey primary key (id),
  constraint workers_role_check check (role = any (array['Foreman'::text, 'Lead Hand'::text, 'Operator'::text, 'Driver'::text, 'Labourer'::text]))
);

create table public.equipment (
  id uuid default extensions.uuid_generate_v4() not null,
  company_id uuid not null,
  name text not null,
  category text not null,
  status text default 'available'::text not null,
  notes text,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint equipment_pkey primary key (id),
  constraint equipment_category_check check (category = any (array['truck'::text, 'trailer_flat'::text, 'trailer_dump'::text, 'trailer_equipment'::text, 'machine'::text])),
  constraint equipment_status_check check (status = any (array['available'::text, 'repair'::text]))
);

create table public.perm_equipment_assignments (
  id uuid default extensions.uuid_generate_v4() not null,
  company_id uuid not null,
  crew_id uuid not null,
  equipment_id uuid not null,
  created_at timestamp with time zone default now() not null,
  constraint perm_equipment_assignments_pkey primary key (id),
  constraint perm_equipment_assignments_company_id_equipment_id_key unique (company_id, equipment_id)
);

create table public.jobs (
  id uuid default extensions.uuid_generate_v4() not null,
  company_id uuid not null,
  crew_id uuid,
  name text not null,
  address text,
  city text,
  client_name text,
  client_phone text,
  client_email text,
  start_date date,
  end_date date,
  duration_days integer,
  status text default 'notstarted'::text not null,
  notes text,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint jobs_pkey primary key (id),
  constraint jobs_status_check check (status = any (array['notstarted'::text, 'inprogress'::text, 'complete'::text])),
  constraint jobs_check check ((end_date is null) or (start_date is null) or (end_date >= start_date))
);

create table public.job_equipment (
  id uuid default extensions.uuid_generate_v4() not null,
  company_id uuid not null,
  job_id uuid not null,
  equipment_id uuid not null,
  created_at timestamp with time zone default now() not null,
  constraint job_equipment_pkey primary key (id),
  constraint job_equipment_job_id_equipment_id_key unique (job_id, equipment_id)
);

create table public.equipment_bookings (
  id uuid default extensions.uuid_generate_v4() not null,
  company_id uuid not null,
  job_id uuid not null,
  equipment_id uuid not null,
  start_date date not null,
  end_date date not null,
  notes text,
  created_at timestamp with time zone default now() not null,
  constraint equipment_bookings_pkey primary key (id),
  constraint equipment_bookings_check check (end_date >= start_date)
);

create table public.job_notes (
  id uuid default extensions.uuid_generate_v4() not null,
  company_id uuid not null,
  job_id uuid not null,
  author_id uuid,
  content text not null,
  created_at timestamp with time zone default now() not null,
  constraint job_notes_pkey primary key (id)
);

create table public.work_schedule (
  id uuid default extensions.uuid_generate_v4() not null,
  company_id uuid not null,
  date date not null,
  type text not null,
  reason text,
  created_at timestamp with time zone default now() not null,
  constraint work_schedule_pkey primary key (id),
  constraint work_schedule_company_id_date_type_key unique (company_id, date, type),
  constraint work_schedule_type_check check (type = any (array['workday'::text, 'holiday'::text, 'rain'::text]))
);

-- ---------------------------------------------------------------- foreign keys

alter table public.companies add constraint companies_owner_id_fkey foreign key (owner_id) references auth.users(id);
alter table public.company_users add constraint company_users_company_id_fkey foreign key (company_id) references public.companies(id) on delete cascade;
alter table public.company_users add constraint company_users_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.crews add constraint crews_company_id_fkey foreign key (company_id) references public.companies(id) on delete cascade;
alter table public.crew_availability add constraint crew_availability_company_id_fkey foreign key (company_id) references public.companies(id) on delete cascade;
alter table public.crew_availability add constraint crew_availability_crew_id_fkey foreign key (crew_id) references public.crews(id) on delete cascade;
alter table public.workers add constraint workers_company_id_fkey foreign key (company_id) references public.companies(id) on delete cascade;
alter table public.workers add constraint workers_crew_id_fkey foreign key (crew_id) references public.crews(id) on delete set null;
alter table public.workers add constraint workers_user_id_fkey foreign key (user_id) references auth.users(id) on delete set null;
alter table public.equipment add constraint equipment_company_id_fkey foreign key (company_id) references public.companies(id) on delete cascade;
alter table public.perm_equipment_assignments add constraint perm_equipment_assignments_company_id_fkey foreign key (company_id) references public.companies(id) on delete cascade;
alter table public.perm_equipment_assignments add constraint perm_equipment_assignments_crew_id_fkey foreign key (crew_id) references public.crews(id) on delete cascade;
alter table public.perm_equipment_assignments add constraint perm_equipment_assignments_equipment_id_fkey foreign key (equipment_id) references public.equipment(id) on delete cascade;
alter table public.jobs add constraint jobs_company_id_fkey foreign key (company_id) references public.companies(id) on delete cascade;
alter table public.jobs add constraint jobs_crew_id_fkey foreign key (crew_id) references public.crews(id) on delete set null;
alter table public.job_equipment add constraint job_equipment_company_id_fkey foreign key (company_id) references public.companies(id) on delete cascade;
alter table public.job_equipment add constraint job_equipment_job_id_fkey foreign key (job_id) references public.jobs(id) on delete cascade;
alter table public.job_equipment add constraint job_equipment_equipment_id_fkey foreign key (equipment_id) references public.equipment(id) on delete cascade;
alter table public.equipment_bookings add constraint equipment_bookings_company_id_fkey foreign key (company_id) references public.companies(id) on delete cascade;
alter table public.equipment_bookings add constraint equipment_bookings_job_id_fkey foreign key (job_id) references public.jobs(id) on delete cascade;
alter table public.equipment_bookings add constraint equipment_bookings_equipment_id_fkey foreign key (equipment_id) references public.equipment(id) on delete cascade;
alter table public.job_notes add constraint job_notes_company_id_fkey foreign key (company_id) references public.companies(id) on delete cascade;
alter table public.job_notes add constraint job_notes_job_id_fkey foreign key (job_id) references public.jobs(id) on delete cascade;
alter table public.job_notes add constraint job_notes_author_id_fkey foreign key (author_id) references public.company_users(id) on delete set null;
alter table public.work_schedule add constraint work_schedule_company_id_fkey foreign key (company_id) references public.companies(id) on delete cascade;

-- ---------------------------------------------------------------- indexes

create index idx_crew_avail_dates on public.crew_availability using btree (company_id, crew_id, start_date, end_date);
create index idx_workers_crew on public.workers using btree (company_id, crew_id);
create index idx_equipment_company on public.equipment using btree (company_id, status);
create index idx_perm_equip on public.perm_equipment_assignments using btree (company_id, equipment_id);
create index idx_jobs_company_crew on public.jobs using btree (company_id, crew_id);
create index idx_jobs_company_status on public.jobs using btree (company_id, status);
create index idx_jobs_company_dates on public.jobs using btree (company_id, start_date, end_date);
create index idx_job_equipment_job on public.job_equipment using btree (job_id);
create index idx_job_equipment_equip on public.job_equipment using btree (equipment_id);
create index idx_bookings_equipment_dates on public.equipment_bookings using btree (company_id, equipment_id, start_date, end_date);
create index idx_work_schedule_date on public.work_schedule using btree (company_id, date);

-- ---------------------------------------------------------------- functions and triggers

-- The company the signed-in user belongs to; used by the RLS policies below.
create or replace function public.current_company_id()
returns uuid
language sql
security definer
as $$
  select company_id
  from company_users
  where user_id = auth.uid()
  and is_active = true
  limit 1;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.companies for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.company_users for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.crews for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.workers for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.equipment for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.jobs for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- row-level security

alter table public.companies enable row level security;
alter table public.company_users enable row level security;
alter table public.crews enable row level security;
alter table public.crew_availability enable row level security;
alter table public.workers enable row level security;
alter table public.equipment enable row level security;
alter table public.perm_equipment_assignments enable row level security;
alter table public.jobs enable row level security;
alter table public.job_equipment enable row level security;
alter table public.equipment_bookings enable row level security;
alter table public.job_notes enable row level security;
alter table public.work_schedule enable row level security;

create policy "Users can view their own company_user row" on public.company_users
  for select to authenticated using (user_id = auth.uid());

create policy crews_access on public.crews for all
  using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
create policy crew_avail_access on public.crew_availability for all
  using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
create policy workers_access on public.workers for all
  using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
create policy equipment_access on public.equipment for all
  using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
create policy perm_equip_access on public.perm_equipment_assignments for all
  using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
create policy jobs_access on public.jobs for all
  using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
create policy job_equipment_access on public.job_equipment for all
  using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
create policy bookings_access on public.equipment_bookings for all
  using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
create policy job_notes_access on public.job_notes for all
  using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
create policy work_schedule_access on public.work_schedule for all
  using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());

-- ---------------------------------------------------------------- views
-- Not used by the app today. Views run with their owner's rights and skip RLS,
-- so they are kept closed to API roles, matching production. Supabase's default
-- privileges would otherwise expose them to anon and authenticated.

create view public.equipment_with_perm as
  select e.id, e.company_id, e.name, e.category, e.status, e.notes, e.is_active,
         e.created_at, e.updated_at, pea.crew_id as perm_crew_id, c.name as perm_crew_name
  from public.equipment e
  left join public.perm_equipment_assignments pea on pea.equipment_id = e.id
  left join public.crews c on c.id = pea.crew_id
  where e.is_active = true;

create view public.jobs_summary as
  select j.id, j.company_id, j.crew_id, j.name, j.address, j.city, j.client_name,
         j.client_phone, j.client_email, j.start_date, j.end_date, j.duration_days,
         j.status, j.notes, j.is_active, j.created_at, j.updated_at,
         c.name as crew_name, c.color as crew_color, count(je.id) as equipment_count
  from public.jobs j
  left join public.crews c on c.id = j.crew_id
  left join public.job_equipment je on je.job_id = j.id
  where j.is_active = true
  group by j.id, c.name, c.color;

create view public.workers_with_crew as
  select w.id, w.company_id, w.crew_id, w.user_id, w.name, w.role, w.phone, w.email,
         w.is_active, w.notes, w.created_at, w.updated_at,
         c.name as crew_name, c.color as crew_color
  from public.workers w
  left join public.crews c on c.id = w.crew_id
  where w.is_active = true;

revoke all on public.equipment_with_perm, public.jobs_summary, public.workers_with_crew from anon, authenticated;
