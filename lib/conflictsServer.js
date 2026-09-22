import { supabaseAdmin } from './serverAuth.js'
import { checkJobConflicts } from './conflicts.js'
import { ApiError } from './errors.js'

// Server-side enforcement counterpart to checkJobConflicts (lib/conflicts.js).
// That function only runs client-side, to paint the job form's live inline
// warnings — it's advisory and a stale client (or a direct API call) can
// bypass it. This is the actual gate: every write that assigns a crew or
// equipment to a job's dates goes through here first and gets rejected with
// 409 on overlap, using the exact same matching logic the form previews.
export async function assertNoJobConflicts(companyId, { jobId, crewId, equipmentIds, startDate, endDate }) {
  if (!startDate || !endDate) return
  const hasEquipment = equipmentIds && equipmentIds.length > 0
  if (!crewId && !hasEquipment) return

  const { data: jobs, error: jobsErr } = await supabaseAdmin
    .from('jobs')
    .select('id, name, start_date, end_date, status, crew_id, job_equipment(equipment_id)')
    .eq('company_id', companyId)
    .eq('is_active', true)
  if (jobsErr) throw jobsErr

  let availability = []
  if (crewId) {
    const { data, error } = await supabaseAdmin
      .from('crew_availability')
      .select('crew_id, start_date, end_date, reason')
      .eq('company_id', companyId)
      .eq('crew_id', crewId)
    if (error) throw error
    availability = data || []
  }

  let bookings = []
  let equipmentNames = new Map()
  if (hasEquipment) {
    const { data, error } = await supabaseAdmin
      .from('equipment_bookings')
      .select('equipment_id, job_id, start_date, end_date')
      .eq('company_id', companyId)
      .in('equipment_id', equipmentIds)
    if (error) throw error
    bookings = data || []

    const { data: eq, error: eqErr } = await supabaseAdmin
      .from('equipment')
      .select('id, name')
      .eq('company_id', companyId)
      .in('id', equipmentIds)
    if (eqErr) throw eqErr
    equipmentNames = new Map((eq || []).map(e => [e.id, e.name]))
  }

  const conflicts = checkJobConflicts({
    jobId, crewId, equipmentIds, startDate, endDate,
    jobs, availability, bookings: { list: bookings, equipmentNames },
  })
  if (conflicts.length > 0) {
    throw new ApiError(409, conflicts.map(c => c.message).join(' · '))
  }
}
