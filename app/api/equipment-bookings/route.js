import { NextResponse } from 'next/server'
import { supabaseAdmin, getCompanyId } from '../../../lib/serverAuth'
import { assertNoJobConflicts } from '../../../lib/conflictsServer'
import {
  ApiError, handleError, readJson, cleanId, cleanDate, cleanText, assertDateOrder, assertRangeLength, LIMITS,
} from '../../../lib/apiUtils'

// GET — list equipment bookings for this company, optionally filtered by job
export async function GET(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const jobId = cleanId(searchParams.get('job_id') || undefined, 'job_id')

    let query = supabaseAdmin
      .from('equipment_bookings')
      .select('*, equipment(id, name, category), job:jobs(id, name)')
      .eq('company_id', companyId)
    if (jobId) query = query.eq('job_id', jobId)

    const { data, error } = await query.order('start_date')
    if (error) throw error
    return NextResponse.json({ bookings: data })
  } catch (err) {
    return handleError(err, 'equipment-bookings')
  }
}

// POST — book equipment to a job for a date range ("This Job" or "Pick Dates" on the board view)
export async function POST(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await readJson(request)
    const equipment_id = cleanId(body.equipment_id, 'equipment_id', { required: true })
    const job_id = cleanId(body.job_id, 'job_id', { required: true })
    const start_date = cleanDate(body.start_date, 'start_date', { required: true })
    const end_date = cleanDate(body.end_date, 'end_date', { required: true })
    const notes = cleanText(body.notes, 'notes', { max: LIMITS.notes })
    assertDateOrder(start_date, end_date)
    assertRangeLength(start_date, end_date)

    const { data: eq, error: eqError } = await supabaseAdmin
      .from('equipment').select('id').eq('id', equipment_id).eq('company_id', companyId).eq('is_active', true).maybeSingle()
    if (eqError) throw eqError
    if (!eq) throw new ApiError(404, 'Equipment not found')
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs').select('id').eq('id', job_id).eq('company_id', companyId).eq('is_active', true).maybeSingle()
    if (jobError) throw jobError
    if (!job) throw new ApiError(404, 'Job not found')

    // jobId: job_id excludes this same job's own bookings/job_equipment from the
    // conflict search — booking equipment onto a job it's already on isn't a
    // conflict with itself.
    await assertNoJobConflicts(companyId, {
      jobId: job_id, crewId: null, equipmentIds: [equipment_id], startDate: start_date, endDate: end_date,
    })

    const { data, error } = await supabaseAdmin
      .from('equipment_bookings')
      .insert({ company_id: companyId, equipment_id, job_id, start_date, end_date, notes: notes || null })
      .select('*, equipment(id, name, category), job:jobs(id, name)')
      .single()

    if (error) throw error
    return NextResponse.json({ booking: data })
  } catch (err) {
    return handleError(err, 'equipment-bookings')
  }
}

// DELETE — cancel a booking
export async function DELETE(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = cleanId((await readJson(request)).id, 'id', { required: true })

    const { error } = await supabaseAdmin
      .from('equipment_bookings')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleError(err, 'equipment-bookings')
  }
}
