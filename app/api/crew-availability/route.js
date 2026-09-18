import { NextResponse } from 'next/server'
import { supabaseAdmin, getCompanyId } from '../../../lib/serverAuth'

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
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — block a crew out for a date range, with an optional reason
export async function POST(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { crew_id, start_date, end_date, reason } = await request.json()
    if (!crew_id) return NextResponse.json({ error: 'crew_id is required' }, { status: 400 })
    if (!start_date || !end_date) return NextResponse.json({ error: 'start_date and end_date are required' }, { status: 400 })

    const { data: crew } = await supabaseAdmin
      .from('crews').select('id').eq('id', crew_id).eq('company_id', companyId).maybeSingle()
    if (!crew) return NextResponse.json({ error: 'Crew not found' }, { status: 404 })

    const { data, error } = await supabaseAdmin
      .from('crew_availability')
      .insert({ company_id: companyId, crew_id, start_date, end_date, reason: reason || null })
      .select('*, crew:crews(id, name, color)')
      .single()

    if (error) throw error
    return NextResponse.json({ availability: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE — remove an unavailability block
export async function DELETE(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('crew_availability')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
