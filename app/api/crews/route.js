import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Helper: get company_id from the logged-in user
async function getCompanyId(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return null

  const { data } = await supabaseAdmin
    .from('company_users')
    .select('company_id')
    .eq('user_id', user.id)
    .single()

  return data?.company_id || null
}

// GET — fetch all crews for this company
export async function GET(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from('crews')
      .select('*, crew_availability(*), perm_equipment_assignments(equipment_id)')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return NextResponse.json({ crews: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST — create a new crew
export async function POST(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, foreman_name, color, notes } = body

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('crews')
      .insert({ company_id: companyId, name, foreman_name, color: color || '#F5C800', notes })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ crew: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE — soft delete a crew
export async function DELETE(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await request.json()

    const { error } = await supabaseAdmin
      .from('crews')
      .update({ is_active: false })
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}