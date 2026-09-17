import { NextResponse } from 'next/server'
import { supabaseAdmin, getCompanyId } from '../../../lib/serverAuth'

const JOB_SELECT = '*, crew:crews(id, name, color), job_equipment(equipment_id, equipment(id, name, category))'

function computeDuration(start_date, end_date) {
  if (!start_date || !end_date) return null
  const start = new Date(start_date)
  const end = new Date(end_date)
  const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1
  return days > 0 ? days : null
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
      start_date, end_date, crew_id, notes, status, equipment_ids,
    } = body

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const duration_days = computeDuration(start_date, end_date)

    const { data, error } = await supabaseAdmin
      .from('jobs')
      .insert({
        company_id: companyId, name, address, city, client_name, client_phone, client_email,
        start_date: start_date || null, end_date: end_date || null, duration_days,
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
    const { id, equipment_ids, ...fields } = body
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const update = { ...fields }
    if ('start_date' in update) update.start_date = update.start_date || null
    if ('end_date' in update) update.end_date = update.end_date || null
    if ('crew_id' in update) update.crew_id = update.crew_id || null
    if ('start_date' in update || 'end_date' in update) {
      const { data: existing } = await supabaseAdmin.from('jobs').select('start_date, end_date').eq('id', id).single()
      const start_date = 'start_date' in update ? update.start_date : existing?.start_date
      const end_date = 'end_date' in update ? update.end_date : existing?.end_date
      update.duration_days = computeDuration(start_date, end_date)
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
