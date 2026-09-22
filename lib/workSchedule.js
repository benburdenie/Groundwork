import { supabaseAdmin } from './serverAuth'
import { buildWorkScheduleMap } from './workdays'

// Postgres "no unique or exclusion constraint matching the ON CONFLICT
// specification" -- raised when the 20260921120000 migration hasn't been applied.
export const MISSING_UNIQUE_INDEX = '42P10'

export async function fetchWorkScheduleRows(companyId) {
  const { data, error } = await supabaseAdmin
    .from('work_schedule').select('*').eq('company_id', companyId).order('date')
  if (error) throw error
  return data || []
}

export async function fetchWorkScheduleMap(companyId) {
  return buildWorkScheduleMap(await fetchWorkScheduleRows(companyId))
}

// Set (or clear, when `type` is falsy) the override for one date. There is one
// row per (company_id, date): the write is a single-statement upsert against the
// unique index from migration 20260921120000, so concurrent requests can't
// create duplicates.
export async function setWorkScheduleEntry(companyId, date, type, reason) {
  if (!type) {
    // Deletes every row for the date, including any legacy duplicates.
    const { error } = await supabaseAdmin
      .from('work_schedule').delete().eq('company_id', companyId).eq('date', date)
    if (error) throw error
    return
  }

  const row = { company_id: companyId, date, type, reason: reason || null }
  const { error } = await supabaseAdmin
    .from('work_schedule').upsert(row, { onConflict: 'company_id,date' })
  if (!error) return
  if (error.code !== MISSING_UNIQUE_INDEX) throw error

  // Migration not applied yet. The table still has its older unique
  // (company_id, date, type) constraint, so: drop rows of any *other* type for the
  // date, then upsert on that constraint. Same-type writes can't collide or
  // duplicate; only two simultaneous writes of different types could still leave
  // two rows, which the next write cleans up.
  console.warn('[work_schedule] (company_id, date) unique index missing; apply migration 20260921120000. Using fallback write.')
  const { error: delError } = await supabaseAdmin
    .from('work_schedule').delete().eq('company_id', companyId).eq('date', date).neq('type', type)
  if (delError) throw delError
  const { error: upsertError } = await supabaseAdmin
    .from('work_schedule').upsert(row, { onConflict: 'company_id,date,type' })
  if (upsertError) throw upsertError
}
