import { NextResponse } from 'next/server'
import { supabaseAdmin, getCompanyId, allOwnedByCompany } from '../../../lib/serverAuth'
import { buildWorkScheduleMap, computeEndDate, countWorkDays } from '../../../lib/workdays'

// Columns a client may set on a job. company_id, is_active, etc. are never
// taken from the request body.
const EDITABLE_FIELDS = [
  'name', 'address', 'city', 'client_name', 'client_phone', 'client_email',
  'start_date', 'end_date', 'crew_id', 'notes', 'status',
]

const JOB_SELECT = '*, crew:crews(id, name, color), job_equipment(equipment_id, equipment(id, name, category))'

async function getWorkSchedule(companyId) {
  const { data } = await supabaseAdmin.from('work_schedule').select('*').eq('company_id', companyId)
  return buildWorkScheduleMap(data)
}

// Duration is stored in WORK days, not calendar days. When the caller supplies
// duration_days explicitly (the client already reconciled it against dates via
// lib/workdays.js) it's trusted as-is; otherwise it's derived from whichever of
// start/end/duration is missing.
function resolveDatesAndDuration({ start_date, end_date, duration_days }, workSchedule) {
  start_date = start_date || null
  end_date = end_date || null
  let duration = duration_days != null && duration_days !== '' ? parseInt(duration_days, 10) : null
  if (Number.isNaN(duration)) duration = null

  if (!start_date || !end_date) {
    if (start_date && duration) end_date = computeEndDate(start_date, duration, workSchedule)
    else duration = null
  } else if (!duration) {
    duration = countWorkDays(start_date, end_date, workSchedule)
  }

  return { start_date, end_date, duration_days: duration }
}

async function setJobEquipment(companyId, jobId, equipmentIds) {
  if (!Array.isArray(equipmentIds)) return
  await supabaseAdmin.from('job_equipment').delete().eq('job_id', jobId).eq('company_id', companyId)
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
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — create a new job
export async function POST(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      name, address, city, client_name, client_phone, client_email,
      start_date, end_date, duration_days, crew_id, notes, status, equipment_ids,
    } = body

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    if (!(await allOwnedByCompany('crews', [crew_id], companyId))) {
      return NextResponse.json({ error: 'Crew not found' }, { status: 404 })
    }
    if (!(await allOwnedByCompany('equipment', equipment_ids, companyId))) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
    }

    const workSchedule = await getWorkSchedule(companyId)
    const resolved = resolveDatesAndDuration({ start_date, end_date, duration_days }, workSchedule)

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
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH — update an existing job (fields and/or status and/or equipment)
export async function PATCH(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, equipment_ids, duration_days } = body
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { data: existing, error: existError } = await supabaseAdmin
      .from('jobs')
      .select('start_date, end_date, duration_days')
      .eq('id', id)
      .eq('company_id', companyId)
      .maybeSingle()
    if (existError) throw existError
    if (!existing) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    const update = {}
    for (const key of EDITABLE_FIELDS) {
      if (key in body) update[key] = body[key]
    }
    if ('crew_id' in update) update.crew_id = update.crew_id || null

    if (!(await allOwnedByCompany('crews', [update.crew_id], companyId))) {
      return NextResponse.json({ error: 'Crew not found' }, { status: 404 })
    }
    if (!(await allOwnedByCompany('equipment', equipment_ids, companyId))) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
    }

    if ('start_date' in update || 'end_date' in update || duration_days !== undefined) {
      const workSchedule = await getWorkSchedule(companyId)
      const start_date = 'start_date' in update ? (update.start_date || null) : existing.start_date
      const end_date = 'end_date' in update ? (update.end_date || null) : existing.end_date
      const resolved = resolveDatesAndDuration({ start_date, end_date, duration_days }, workSchedule)
      update.start_date = resolved.start_date
      update.end_date = resolved.end_date
      update.duration_days = resolved.duration_days
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
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE — soft delete a job
export async function DELETE(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('jobs')
      .update({ is_active: false })
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
