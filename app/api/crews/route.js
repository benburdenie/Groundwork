import { NextResponse } from 'next/server'
import { supabaseAdmin, getCompanyId } from '../../../lib/serverAuth'
import { handleError, readJson, cleanText, cleanColor, cleanId, LIMITS } from '../../../lib/apiUtils'

// GET — fetch all crews for this company
export async function GET(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from('crews')
      .select('*, crew_availability(*), perm_equipment_assignments(equipment_id, equipment(id, name, category))')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return NextResponse.json({ crews: data })
  } catch (err) {
    return handleError(err, 'crews')
  }
}

// POST — create a new crew
export async function POST(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await readJson(request)
    const name = cleanText(body.name, 'name', { max: LIMITS.name, required: true })
    const foreman_name = cleanText(body.foreman_name, 'foreman_name', { max: LIMITS.short })
    const color = cleanColor(body.color)
    const notes = cleanText(body.notes, 'notes', { max: LIMITS.notes })

    const { data, error } = await supabaseAdmin
      .from('crews')
      .insert({ company_id: companyId, name, foreman_name, color: color || '#22c55e', notes })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ crew: data })
  } catch (err) {
    return handleError(err, 'crews')
  }
}

// PATCH — update an existing crew
export async function PATCH(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await readJson(request)
    const id = cleanId(body.id, 'id', { required: true })
    const name = cleanText(body.name, 'name', { max: LIMITS.name, required: true })
    const foreman_name = cleanText(body.foreman_name, 'foreman_name', { max: LIMITS.short })
    const color = cleanColor(body.color)
    const notes = cleanText(body.notes, 'notes', { max: LIMITS.notes })

    const { data, error } = await supabaseAdmin
      .from('crews')
      .update({ name, foreman_name, color, notes })
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Crew not found' }, { status: 404 })
    return NextResponse.json({ crew: data })
  } catch (err) {
    return handleError(err, 'crews')
  }
}

// DELETE — soft delete a crew
export async function DELETE(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = cleanId((await readJson(request)).id, 'id', { required: true })

    const { error } = await supabaseAdmin
      .from('crews')
      .update({ is_active: false })
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleError(err, 'crews')
  }
}
