import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Runs right after supabase.auth.signUp() on the client. There may be no session
// yet (email confirmation), so the caller can't send a bearer token; instead the
// userId is verified against Supabase Auth and must match the email supplied and
// not already belong to a company.
export async function POST(request) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL

    const supabaseAdmin = createClient(url, serviceKey)

    const { userId, companyName, yourName, email } = await request.json()

    if (!userId || !companyName?.trim() || !yourName?.trim() || !email) {
      return NextResponse.json({ error: 'Company name, your name, and email are required' }, { status: 400 })
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
    const authUser = authData?.user
    if (authError || !authUser || authUser.email?.toLowerCase() !== String(email).toLowerCase()) {
      return NextResponse.json({ error: 'Invalid signup request' }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin
      .from('company_users').select('company_id').eq('user_id', userId).maybeSingle()
    if (existing) {
      return NextResponse.json({ error: 'This account already belongs to a company' }, { status: 409 })
    }

    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({ name: companyName.trim(), slug, owner_id: userId })
      .select()
      .single()

    if (companyError) throw companyError

    const { error: userError } = await supabaseAdmin
      .from('company_users')
      .insert({
        company_id: company.id,
        user_id: userId,
        role: 'owner',
        display_name: yourName.trim(),
        email: email,
      })

    if (userError) {
      // Don't leave an ownerless company behind.
      await supabaseAdmin.from('companies').delete().eq('id', company.id)
      throw userError
    }

    return NextResponse.json({ success: true, companyId: company.id })
  } catch (err) {
    console.error('Signup API error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
