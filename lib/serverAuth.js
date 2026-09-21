import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Resolve the logged-in user's company_id from their bearer token.
export async function getCompanyId(request) {
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

// True when every id in `ids` is a row of `table` owned by `companyId`. Foreign
// keys in the schema don't enforce tenancy, so routes that accept a crew_id /
// equipment_id from the client must check it before writing.
export async function allOwnedByCompany(table, ids, companyId) {
  const unique = [...new Set((ids || []).filter(Boolean))]
  if (unique.length === 0) return true
  const { data, error } = await supabaseAdmin
    .from(table)
    .select('id')
    .eq('company_id', companyId)
    .in('id', unique)
  if (error) throw error
  return (data || []).length === unique.length
}
