import { NextResponse } from 'next/server'
import { supabaseAdmin, getCompanyId } from '../../../lib/serverAuth'

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
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — create a new worker
export async function POST(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, role, phone, email, crew_id, notes } = body

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

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
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH — update an existing worker
export async function PATCH(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, name, role, phone, email, crew_id, notes } = await request.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('workers')
      .update({ name, role, phone, email, crew_id: crew_id || null, notes })
      .eq('id', id)
      .eq('company_id', companyId)
      .select('*, crew:crews(id, name, color)')
      .single()

    if (error) throw error
    return NextResponse.json({ worker: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE — soft delete a worker
export async function DELETE(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await request.json()

    const { error } = await supabaseAdmin
      .from('workers')
      .update({ is_active: false })
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
