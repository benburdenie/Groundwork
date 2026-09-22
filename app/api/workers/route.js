import { NextResponse } from 'next/server'
import { supabaseAdmin, getCompanyId, allOwnedByCompany } from '../../../lib/serverAuth'
import { handleError, readJson, cleanText, cleanEmail, cleanId, LIMITS } from '../../../lib/apiUtils'

// GET — fetch all workers for this company
export async function GET(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from('workers')
      .select('*, crew:crews(id, name, color)')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return NextResponse.json({ workers: data })
  } catch (err) {
    return handleError(err, 'workers')
  }
}

// POST — create a new worker
export async function POST(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await readJson(request)
    const name = cleanText(body.name, 'name', { max: LIMITS.name, required: true })
    const role = cleanText(body.role, 'role', { max: LIMITS.short })
    const phone = cleanText(body.phone, 'phone', { max: LIMITS.phone })
    const email = cleanEmail(body.email)
    const crew_id = cleanId(body.crew_id, 'crew_id')
    const notes = cleanText(body.notes, 'notes', { max: LIMITS.notes })
    if (!(await allOwnedByCompany('crews', [crew_id], companyId))) {
      return NextResponse.json({ error: 'Crew not found' }, { status: 404 })
    }

    const { data, error } = await supabaseAdmin
      .from('workers')
      .insert({
        company_id: companyId, name, role: role || 'Labourer', phone, email,
        crew_id: crew_id || null, notes,
      })
      .select('*, crew:crews(id, name, color)')
      .single()

    if (error) throw error
    return NextResponse.json({ worker: data })
  } catch (err) {
    return handleError(err, 'workers')
  }
}

// PATCH — update an existing worker
export async function PATCH(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await readJson(request)
    const id = cleanId(body.id, 'id', { required: true })
    const name = cleanText(body.name, 'name', { max: LIMITS.name, required: true })
    const role = cleanText(body.role, 'role', { max: LIMITS.short })
    const phone = cleanText(body.phone, 'phone', { max: LIMITS.phone })
    const email = cleanEmail(body.email)
    const crew_id = cleanId(body.crew_id, 'crew_id')
    const notes = cleanText(body.notes, 'notes', { max: LIMITS.notes })
    if (!(await allOwnedByCompany('crews', [crew_id], companyId))) {
      return NextResponse.json({ error: 'Crew not found' }, { status: 404 })
    }

    const { data, error } = await supabaseAdmin
      .from('workers')
      .update({ name, role, phone, email, crew_id: crew_id || null, notes })
      .eq('id', id)
      .eq('company_id', companyId)
      .select('*, crew:crews(id, name, color)')
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Worker not found' }, { status: 404 })
    return NextResponse.json({ worker: data })
  } catch (err) {
    return handleError(err, 'workers')
  }
}

// DELETE — soft delete a worker
export async function DELETE(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = cleanId((await readJson(request)).id, 'id', { required: true })

    const { error } = await supabaseAdmin
      .from('workers')
      .update({ is_active: false })
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleError(err, 'workers')
  }
}
