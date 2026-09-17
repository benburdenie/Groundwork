import { NextResponse } from 'next/server'
import { supabaseAdmin, getCompanyId } from '../../../lib/serverAuth'

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
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — create new equipment
export async function POST(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, category, status, notes } = body

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    if (!category) return NextResponse.json({ error: 'Category is required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('equipment')
      .insert({ company_id: companyId, name, category, status: status || 'available', notes })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ equipment: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH — update existing equipment
export async function PATCH(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, name, category, status, notes } = await request.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('equipment')
      .update({ name, category, status, notes })
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ equipment: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE — soft delete equipment
export async function DELETE(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await request.json()

    const { error } = await supabaseAdmin
      .from('equipment')
      .update({ is_active: false })
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
