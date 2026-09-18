import { NextResponse } from 'next/server'
import { supabaseAdmin, getCompanyId } from '../../../lib/serverAuth'

// POST — permanently assign equipment to a crew (an item can only belong to one crew at a time)
export async function POST(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { crew_id, equipment_id } = await request.json()
    if (!crew_id || !equipment_id) return NextResponse.json({ error: 'crew_id and equipment_id are required' }, { status: 400 })

    const { data: crew } = await supabaseAdmin
      .from('crews').select('id').eq('id', crew_id).eq('company_id', companyId).maybeSingle()
    if (!crew) return NextResponse.json({ error: 'Crew not found' }, { status: 404 })
    const { data: eq } = await supabaseAdmin
      .from('equipment').select('id').eq('id', equipment_id).eq('company_id', companyId).maybeSingle()
    if (!eq) return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })

    await supabaseAdmin
      .from('perm_equipment_assignments')
      .delete()
      .eq('equipment_id', equipment_id)
      .eq('company_id', companyId)

    const { data, error } = await supabaseAdmin
      .from('perm_equipment_assignments')
      .insert({ company_id: companyId, crew_id, equipment_id })
      .select('*, crew:crews(id, name, color), equipment(id, name, category)')
      .single()

    if (error) throw error
    return NextResponse.json({ assignment: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE — remove a permanent assignment, by id or by equipment_id
export async function DELETE(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, equipment_id } = await request.json()
    if (!id && !equipment_id) return NextResponse.json({ error: 'id or equipment_id is required' }, { status: 400 })

    let query = supabaseAdmin.from('perm_equipment_assignments').delete().eq('company_id', companyId)
    query = id ? query.eq('id', id) : query.eq('equipment_id', equipment_id)
    const { error } = await query

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
