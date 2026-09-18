import { NextResponse } from 'next/server'
import { supabaseAdmin, getCompanyId } from '../../../lib/serverAuth'

// GET — list equipment bookings for this company, optionally filtered by job
export async function GET(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id')

    let query = supabaseAdmin
      .from('equipment_bookings')
      .select('*, equipment(id, name, category), job:jobs(id, name)')
      .eq('company_id', companyId)
    if (jobId) query = query.eq('job_id', jobId)

    const { data, error } = await query.order('start_date')
    if (error) throw error
    return NextResponse.json({ bookings: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — book equipment to a job for a date range ("This Job" or "Pick Dates" on the board view)
export async function POST(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { equipment_id, job_id, start_date, end_date, notes } = await request.json()
    if (!equipment_id || !job_id) return NextResponse.json({ error: 'equipment_id and job_id are required' }, { status: 400 })
    if (!start_date || !end_date) return NextResponse.json({ error: 'start_date and end_date are required' }, { status: 400 })

    const { data: eq } = await supabaseAdmin
      .from('equipment').select('id').eq('id', equipment_id).eq('company_id', companyId).maybeSingle()
    if (!eq) return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
    const { data: job } = await supabaseAdmin
      .from('jobs').select('id').eq('id', job_id).eq('company_id', companyId).maybeSingle()
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    const { data, error } = await supabaseAdmin
      .from('equipment_bookings')
      .insert({ company_id: companyId, equipment_id, job_id, start_date, end_date, notes: notes || null })
      .select('*, equipment(id, name, category), job:jobs(id, name)')
      .single()

    if (error) throw error
    return NextResponse.json({ booking: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE — cancel a booking
export async function DELETE(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('equipment_bookings')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
