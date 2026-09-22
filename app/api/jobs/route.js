import { NextResponse } from 'next/server'
import { supabaseAdmin, getCompanyId, allOwnedByCompany } from '../../../lib/serverAuth'
import { computeEndDate, countWorkDays, MAX_DURATION_DAYS } from '../../../lib/workdays'
import { fetchWorkScheduleMap } from '../../../lib/workSchedule'
import { assertNoJobConflicts } from '../../../lib/conflictsServer'
import {
  ApiError, handleError, readJson, cleanText, cleanEmail, cleanEnum, cleanDate, cleanId, cleanIdList,
  cleanDuration, assertDateOrder, JOB_STATUSES, LIMITS,
} from '../../../lib/apiUtils'

// Columns a client may set on a job, each with its validator. company_id,
// is_active, etc. are never taken from the request body. A validator returns
// undefined for a field that wasn't supplied, so PATCH only touches what was sent.
const FIELD_VALIDATORS = {
  name: (v) => cleanText(v, 'name', { max: LIMITS.name, required: true }),
  address: (v) => cleanText(v, 'address', { max: LIMITS.address }),
  city: (v) => cleanText(v, 'city', { max: LIMITS.short }),
  client_name: (v) => cleanText(v, 'client_name', { max: LIMITS.short }),
  client_phone: (v) => cleanText(v, 'client_phone', { max: LIMITS.phone }),
  client_email: (v) => cleanEmail(v, 'client_email'),
  start_date: (v) => cleanDate(v, 'start_date'),
  end_date: (v) => cleanDate(v, 'end_date'),
  crew_id: (v) => cleanId(v, 'crew_id'),
  notes: (v) => cleanText(v, 'notes', { max: LIMITS.notes }),
  status: (v) => cleanEnum(v, 'status', JOB_STATUSES),
}

function cleanJobFields(body) {
  const fields = {}
  for (const [key, validate] of Object.entries(FIELD_VALIDATORS)) {
    if (key in body) fields[key] = validate(body[key])
  }
  return fields
}

const JOB_SELECT = '*, crew:crews(id, name, color), job_equipment(equipment_id, equipment(id, name, category))'

// Duration is stored in WORK days, not calendar days. When the caller supplies
// duration_days explicitly (the client already reconciled it against dates via
// lib/workdays.js) it's trusted as-is; otherwise it's derived from whichever of
// start/end/duration is missing.
// Inputs are already validated (real ISO dates, duration 1..365 or null); the
// date helpers return null when a range is unusable, which is reported as a 400
// rather than written to the database.
function resolveDatesAndDuration({ start_date, end_date, duration_days }, workSchedule) {
  start_date = start_date || null
  end_date = end_date || null
  let duration = duration_days ?? null

  assertDateOrder(start_date, end_date)

  if (!start_date || !end_date) {
    if (start_date && duration) end_date = computeEndDate(start_date, duration, workSchedule)
    else duration = null
  } else if (!duration) {
    duration = countWorkDays(start_date, end_date, workSchedule)
  }

  // 0 is a legitimate count (a weekend-only job); null means the range was unusable.
  if (start_date && end_date && duration == null) {
    throw new ApiError(400, 'Dates are out of range or longer than a job can span')
  }
  if (start_date && duration && !end_date) {
    throw new ApiError(400, 'Could not work out an end date from that start date and duration')
  }
  return { start_date, end_date, duration_days: duration }
}

async function setJobEquipment(companyId, jobId, equipmentIds) {
  if (!Array.isArray(equipmentIds)) return
  const { error: deleteError } = await supabaseAdmin
    .from('job_equipment').delete().eq('job_id', jobId).eq('company_id', companyId)
  if (deleteError) throw deleteError
  if (equipmentIds.length === 0) return
  const rows = equipmentIds.map(equipment_id => ({ company_id: companyId, job_id: jobId, equipment_id }))
  const { error } = await supabaseAdmin.from('job_equipment').insert(rows)
  if (error) throw error
}

// GET — fetch all jobs for this company
export async function GET(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from('jobs')
      .select(JOB_SELECT)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('start_date', { nullsFirst: false })

    if (error) throw error
    return NextResponse.json({ jobs: data })
  } catch (err) {
    return handleError(err, 'jobs')
  }
}

// POST — create a new job
export async function POST(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await readJson(request)
    if (!('name' in body)) throw new ApiError(400, 'name is required')
    const {
      name, address, city, client_name, client_phone, client_email,
      start_date, end_date, crew_id, notes, status,
    } = cleanJobFields(body)
    const duration_days = cleanDuration(body.duration_days, 'duration_days', MAX_DURATION_DAYS)
    const equipment_ids = cleanIdList(body.equipment_ids, 'equipment_ids')

    if (!(await allOwnedByCompany('crews', [crew_id], companyId))) {
      throw new ApiError(404, 'Crew not found')
    }
    if (!(await allOwnedByCompany('equipment', equipment_ids, companyId))) {
      throw new ApiError(404, 'Equipment not found')
    }

    const workSchedule = await fetchWorkScheduleMap(companyId)
    const resolved = resolveDatesAndDuration({ start_date, end_date, duration_days }, workSchedule)

    await assertNoJobConflicts(companyId, {
      jobId: null, crewId: crew_id || null, equipmentIds: equipment_ids || [],
      startDate: resolved.start_date, endDate: resolved.end_date,
    })

    const { data, error } = await supabaseAdmin
      .from('jobs')
      .insert({
        company_id: companyId, name, address, city, client_name, client_phone, client_email,
        start_date: resolved.start_date, end_date: resolved.end_date, duration_days: resolved.duration_days,
        crew_id: crew_id || null, notes, status: status || 'notstarted',
      })
      .select()
      .single()

    if (error) throw error

    await setJobEquipment(companyId, data.id, equipment_ids)

    const { data: full, error: fetchError } = await supabaseAdmin
      .from('jobs')
      .select(JOB_SELECT)
      .eq('id', data.id)
      .single()
    if (fetchError) throw fetchError

    return NextResponse.json({ job: full })
  } catch (err) {
    return handleError(err, 'jobs')
  }
}

// PATCH — update an existing job (fields and/or status and/or equipment)
export async function PATCH(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await readJson(request)
    const id = cleanId(body.id, 'id', { required: true })
    const duration_days = cleanDuration(body.duration_days, 'duration_days', MAX_DURATION_DAYS)
    const equipment_ids = cleanIdList(body.equipment_ids, 'equipment_ids')
    const update = cleanJobFields(body)

    const { data: existing, error: existError } = await supabaseAdmin
      .from('jobs')
      .select('start_date, end_date, duration_days, crew_id')
      .eq('id', id)
      .eq('company_id', companyId)
      .maybeSingle()
    if (existError) throw existError
    if (!existing) throw new ApiError(404, 'Job not found')

    if (!(await allOwnedByCompany('crews', [update.crew_id], companyId))) {
      throw new ApiError(404, 'Crew not found')
    }
    if (!(await allOwnedByCompany('equipment', equipment_ids, companyId))) {
      throw new ApiError(404, 'Equipment not found')
    }

    let finalStart = existing.start_date
    let finalEnd = existing.end_date

    if ('start_date' in update || 'end_date' in update || duration_days !== undefined) {
      const workSchedule = await fetchWorkScheduleMap(companyId)
      const start_date = 'start_date' in update ? (update.start_date || null) : existing.start_date
      const end_date = 'end_date' in update ? (update.end_date || null) : existing.end_date
      const resolved = resolveDatesAndDuration({ start_date, end_date, duration_days }, workSchedule)
      update.start_date = resolved.start_date
      update.end_date = resolved.end_date
      update.duration_days = resolved.duration_days
      finalStart = resolved.start_date
      finalEnd = resolved.end_date
    }

    // Re-check conflicts whenever the crew, the equipment, or the dates change —
    // a date move can put an unchanged crew/equipment into a new overlap just as
    // easily as reassigning them can, so all three trigger the same gate against
    // whatever the job's dates/crew/equipment will be *after* this write.
    const crewChanging = 'crew_id' in update
    const equipmentChanging = equipment_ids !== undefined
    const datesChanging = finalStart !== existing.start_date || finalEnd !== existing.end_date
    if (crewChanging || equipmentChanging || datesChanging) {
      const effectiveCrewId = crewChanging ? update.crew_id : existing.crew_id
      let effectiveEquipmentIds = equipment_ids
      if (!equipmentChanging) {
        const { data: existingEq, error: eqErr } = await supabaseAdmin
          .from('job_equipment').select('equipment_id').eq('job_id', id).eq('company_id', companyId)
        if (eqErr) throw eqErr
        effectiveEquipmentIds = (existingEq || []).map(r => r.equipment_id)
      }
      await assertNoJobConflicts(companyId, {
        jobId: id, crewId: effectiveCrewId || null, equipmentIds: effectiveEquipmentIds || [],
        startDate: finalStart, endDate: finalEnd,
      })
    }

    if (Object.keys(update).length > 0) {
      const { error } = await supabaseAdmin
        .from('jobs')
        .update(update)
        .eq('id', id)
        .eq('company_id', companyId)
      if (error) throw error
    }

    if (equipment_ids !== undefined) {
      await setJobEquipment(companyId, id, equipment_ids)
    }

    const { data: full, error: fetchError } = await supabaseAdmin
      .from('jobs')
      .select(JOB_SELECT)
      .eq('id', id)
      .eq('company_id', companyId)
      .single()
    if (fetchError) throw fetchError

    return NextResponse.json({ job: full })
  } catch (err) {
    return handleError(err, 'jobs')
  }
}

// DELETE — soft delete a job
export async function DELETE(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = cleanId((await readJson(request)).id, 'id', { required: true })

    const { error } = await supabaseAdmin
      .from('jobs')
      .update({ is_active: false })
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleError(err, 'jobs')
  }
}
