import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL

    console.log('URL:', url)
    console.log('Service key exists:', !!serviceKey)
    console.log('Service key starts with:', serviceKey?.slice(0, 20))

    const supabaseAdmin = createClient(url, serviceKey)

    const { userId, companyName, yourName, email } = await request.json()
    console.log('Creating company for user:', userId)

    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({ name: companyName, slug, owner_id: userId })
      .select()
      .single()

    console.log('Company result:', company, 'Error:', companyError)

    if (companyError) throw companyError

    const { error: userError } = await supabaseAdmin
      .from('company_users')
      .insert({
        company_id: company.id,
        user_id: userId,
        role: 'owner',
        display_name: yourName,
        email: email,
      })

    if (userError) throw userError

    return NextResponse.json({ success: true, companyId: company.id })
  } catch (err) {
    console.error('Signup API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}