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
