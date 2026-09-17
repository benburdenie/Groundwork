import { NextResponse } from 'next/server'
import { supabaseAdmin, getCompanyId } from '../../../lib/serverAuth'

// GET — fetch the logged-in user's company
export async function GET(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    if (error) throw error
    return NextResponse.json({ company: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
