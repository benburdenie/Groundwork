import { NextResponse } from 'next/server'
import { supabaseAdmin, getCompanyId } from '../../../lib/serverAuth'
import { ApiError, handleError, readJson, cleanId } from '../../../lib/apiUtils'

const ASSIGNMENT_SELECT = '*, crew:crews(id, name, color), equipment(id, name, category)'

// Point the equipment's single assignment at `crewId`. The table already has a
// unique (company_id, equipment_id) constraint, so this is one upsert statement:
// the item is never left unassigned and can't end up on two crews at once (the
// old delete-then-insert lost the assignment if the insert failed).
async function assignToCrew(companyId, crewId, equipmentId) {
  const { data, error } = await supabaseAdmin
    .from('perm_equipment_assignments')
    .upsert(
      { company_id: companyId, crew_id: crewId, equipment_id: equipmentId },
      { onConflict: 'company_id,equipment_id' },
    )
    .select(ASSIGNMENT_SELECT)
    .single()
  if (error) throw error
  return data
}

// POST — permanently assign equipment to a crew (an item can only belong to one crew at a time)
export async function POST(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await readJson(request)
    const crew_id = cleanId(body.crew_id, 'crew_id', { required: true })
    const equipment_id = cleanId(body.equipment_id, 'equipment_id', { required: true })

    const { data: crew, error: crewError } = await supabaseAdmin
      .from('crews').select('id').eq('id', crew_id).eq('company_id', companyId).eq('is_active', true).maybeSingle()
    if (crewError) throw crewError
    if (!crew) throw new ApiError(404, 'Crew not found')
    const { data: eq, error: eqError } = await supabaseAdmin
      .from('equipment').select('id').eq('id', equipment_id).eq('company_id', companyId).eq('is_active', true).maybeSingle()
    if (eqError) throw eqError
    if (!eq) throw new ApiError(404, 'Equipment not found')

    const assignment = await assignToCrew(companyId, crew_id, equipment_id)
    return NextResponse.json({ assignment })
  } catch (err) {
    return handleError(err, 'perm-equipment')
  }
}

// DELETE — remove a permanent assignment, by id or by equipment_id
export async function DELETE(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await readJson(request)
    const id = cleanId(body.id, 'id')
    const equipment_id = cleanId(body.equipment_id, 'equipment_id')
    if (!id && !equipment_id) throw new ApiError(400, 'id or equipment_id is required')

    let query = supabaseAdmin.from('perm_equipment_assignments').delete().eq('company_id', companyId)
    query = id ? query.eq('id', id) : query.eq('equipment_id', equipment_id)
    const { error } = await query

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleError(err, 'perm-equipment')
  }
}
