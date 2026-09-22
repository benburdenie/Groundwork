import { NextResponse } from 'next/server'
import { supabaseAdmin, getCompanyId } from '../../../lib/serverAuth'
import {
  handleError, readJson, cleanText, cleanEnum, cleanId,
  EQUIPMENT_STATUSES, EQUIPMENT_CATEGORIES, LIMITS,
} from '../../../lib/apiUtils'

function today() {
  return new Date().toISOString().slice(0, 10)
}

// Attach a computed status (available / inuse / assigned / repair) derived from
// today's active jobs, bookings, and permanent crew assignments.
async function withComputedStatus(companyId, equipment) {
  const t = today()

  const [permRes, jobEquipRes, bookingsRes] = await Promise.all([
    supabaseAdmin
      .from('perm_equipment_assignments')
      .select('equipment_id, crew:crews(id, name)')
      .eq('company_id', companyId),
    supabaseAdmin
      .from('job_equipment')
      .select('equipment_id, job:jobs(id, name, status, start_date, end_date, is_active)')
      .eq('company_id', companyId),
    supabaseAdmin
      .from('equipment_bookings')
      .select('equipment_id, start_date, end_date, job:jobs(name)')
      .eq('company_id', companyId),
  ])

  const permByEquip = new Map()
  for (const row of permRes.data || []) {
    permByEquip.set(row.equipment_id, row.crew)
  }

  const inUseByEquip = new Map()
  for (const row of jobEquipRes.data || []) {
    const job = row.job
    if (!job || !job.is_active || job.status === 'complete') continue
    if (job.start_date && job.end_date && job.start_date <= t && t <= job.end_date) {
      inUseByEquip.set(row.equipment_id, job.name)
    }
  }
  for (const row of bookingsRes.data || []) {
    if (row.start_date <= t && t <= row.end_date) {
      inUseByEquip.set(row.equipment_id, row.job?.name || 'Booking')
    }
  }

  return equipment.map(eq => {
    let computed_status = 'available'
    let status_detail = null

    if (eq.status === 'repair') {
      computed_status = 'repair'
    } else if (inUseByEquip.has(eq.id)) {
      computed_status = 'inuse'
      status_detail = inUseByEquip.get(eq.id)
    } else if (permByEquip.has(eq.id)) {
      computed_status = 'assigned'
      status_detail = permByEquip.get(eq.id)?.name || null
    }

    return { ...eq, computed_status, status_detail }
  })
}

// GET — fetch all equipment for this company, with computed status
export async function GET(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from('equipment')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name')

    if (error) throw error

    const equipment = await withComputedStatus(companyId, data)
    return NextResponse.json({ equipment })
  } catch (err) {
    return handleError(err, 'equipment')
  }
}

// POST — create new equipment
export async function POST(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await readJson(request)
    const name = cleanText(body.name, 'name', { max: LIMITS.name, required: true })
    const category = cleanEnum(body.category, 'category', EQUIPMENT_CATEGORIES, { required: true })
    const status = cleanEnum(body.status, 'status', EQUIPMENT_STATUSES)
    const notes = cleanText(body.notes, 'notes', { max: LIMITS.notes })

    const { data, error } = await supabaseAdmin
      .from('equipment')
      .insert({ company_id: companyId, name, category, status: status || 'available', notes })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ equipment: data })
  } catch (err) {
    return handleError(err, 'equipment')
  }
}

// PATCH — update existing equipment
export async function PATCH(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await readJson(request)
    const id = cleanId(body.id, 'id', { required: true })
    const name = cleanText(body.name, 'name', { max: LIMITS.name, required: true })
    const category = cleanEnum(body.category, 'category', EQUIPMENT_CATEGORIES)
    const status = cleanEnum(body.status, 'status', EQUIPMENT_STATUSES)
    const notes = cleanText(body.notes, 'notes', { max: LIMITS.notes })

    const { data, error } = await supabaseAdmin
      .from('equipment')
      .update({ name, category, status, notes })
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
    return NextResponse.json({ equipment: data })
  } catch (err) {
    return handleError(err, 'equipment')
  }
}

// DELETE — soft delete equipment
export async function DELETE(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = cleanId((await readJson(request)).id, 'id', { required: true })

    const { error } = await supabaseAdmin
      .from('equipment')
      .update({ is_active: false })
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleError(err, 'equipment')
  }
}
