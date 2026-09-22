-- work_schedule allows several rows for the same date: its existing unique
-- constraint is (company_id, date, type), so a 'holiday' row and a 'workday' row
-- (or a 'rain' row) can coexist for one date. Work-day math keeps whichever it
-- reads last, so the result depended on row order.
--
-- Enforce one override per company per date so the API can write it as a single
-- atomic upsert (onConflict: 'company_id,date') instead of check-then-write.
--
-- Safe to re-run. Existing duplicates are collapsed first (one arbitrary row per
-- company+date is kept) because the index would otherwise fail to build.
--
-- Note: perm_equipment_assignments already has UNIQUE (company_id, equipment_id),
-- so it needs no change; the reassign route upserts on that constraint.

delete from public.work_schedule a
using public.work_schedule b
where a.company_id = b.company_id
  and a.date = b.date
  and a.ctid < b.ctid;

create unique index if not exists work_schedule_company_id_date_key
  on public.work_schedule (company_id, date);
