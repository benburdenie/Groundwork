import { NextResponse } from 'next/server'
import { supabaseAdmin, getCompanyId } from '../../../lib/serverAuth'
import {
  ApiError, handleError, readJson, cleanId, cleanDate, cleanText, assertDateOrder, assertRangeLength, LIMITS,
} from '../../../lib/apiUtils'

// GET — list all crew unavailability blocks for this company
export async function GET(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from('crew_availability')
      .select('*, crew:crews(id, name, color)')
      .eq('company_id', companyId)
      .order('start_date')

    if (error) throw error
    return NextResponse.json({ availability: data })
  } catch (err) {
    return handleError(err, 'crew-availability')
  }
}

// POST — block a crew out for a date range, with an optional reason
export async function POST(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await readJson(request)
    const crew_id = cleanId(body.crew_id, 'crew_id', { required: true })
    const start_date = cleanDate(body.start_date, 'start_date', { required: true })
    const end_date = cleanDate(body.end_date, 'end_date', { required: true })
    const reason = cleanText(body.reason, 'reason', { max: LIMITS.reason })
    assertDateOrder(start_date, end_date)
    assertRangeLength(start_date, end_date)

    const { data: crew, error: crewError } = await supabaseAdmin
      .from('crews').select('id').eq('id', crew_id).eq('company_id', companyId).eq('is_active', true).maybeSingle()
    if (crewError) throw crewError
    if (!crew) throw new ApiError(404, 'Crew not found')

    const { data, error } = await supabaseAdmin
      .from('crew_availability')
      .insert({ company_id: companyId, crew_id, start_date, end_date, reason: reason || null })
      .select('*, crew:crews(id, name, color)')
      .single()

    if (error) throw error
    return NextResponse.json({ availability: data })
  } catch (err) {
    return handleError(err, 'crew-availability')
  }
}

// DELETE — remove an unavailability block
export async function DELETE(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = cleanId((await readJson(request)).id, 'id', { required: true })

    const { error } = await supabaseAdmin
      .from('crew_availability')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleError(err, 'crew-availability')
  }
}
