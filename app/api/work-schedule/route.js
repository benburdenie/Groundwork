import { NextResponse } from 'next/server'
import { supabaseAdmin, getCompanyId } from '../../../lib/serverAuth'
import { buildWorkScheduleMap, computeEndDate } from '../../../lib/workdays'

// GET — list every work-schedule override (rain-day holidays, forced work days) for this company
export async function GET(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from('work_schedule')
      .select('*')
      .eq('company_id', companyId)
      .order('date')

    if (error) throw error
    return NextResponse.json({ workSchedule: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Duration is stored in work days, so flipping a date's work/holiday status can
// shift every active job's end date. Recompute them all after any change.
async function recomputeJobEndDates(companyId, workSchedule) {
  const { data: jobs, error } = await supabaseAdmin
    .from('jobs')
    .select('id, start_date, duration_days, end_date')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .not('start_date', 'is', null)
    .not('duration_days', 'is', null)
  if (error) throw error

  for (const job of jobs || []) {
    const newEnd = computeEndDate(job.start_date, job.duration_days, workSchedule)
    if (newEnd && newEnd !== job.end_date) {
      await supabaseAdmin.from('jobs').update({ end_date: newEnd }).eq('id', job.id).eq('company_id', companyId)
    }
  }
}

// POST — set (or clear, when type is omitted) a work-schedule override for a date.
// type: 'workday' forces a weekend/holiday to count as a work day.
// type: 'holiday' forces a weekday to NOT count as a work day.
export async function POST(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { date, type, reason } = await request.json()
    if (!date) return NextResponse.json({ error: 'date is required' }, { status: 400 })
    if (type && !['workday', 'holiday'].includes(type)) {
      return NextResponse.json({ error: "type must be 'workday' or 'holiday'" }, { status: 400 })
    }

    const { data: existingRow } = await supabaseAdmin
      .from('work_schedule').select('id').eq('company_id', companyId).eq('date', date).maybeSingle()

    if (!type) {
      if (existingRow) {
        const { error } = await supabaseAdmin.from('work_schedule').delete().eq('id', existingRow.id)
        if (error) throw error
      }
    } else if (existingRow) {
      const { error } = await supabaseAdmin
        .from('work_schedule').update({ type, reason: reason || null }).eq('id', existingRow.id)
      if (error) throw error
    } else {
      const { error } = await supabaseAdmin
        .from('work_schedule').insert({ company_id: companyId, date, type, reason: reason || null })
      if (error) throw error
    }

    const { data: rows, error: fetchErr } = await supabaseAdmin
      .from('work_schedule').select('*').eq('company_id', companyId).order('date')
    if (fetchErr) throw fetchErr

    await recomputeJobEndDates(companyId, buildWorkScheduleMap(rows))

    return NextResponse.json({ workSchedule: rows })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
