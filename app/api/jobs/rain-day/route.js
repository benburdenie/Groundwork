import { NextResponse } from 'next/server'
import { supabaseAdmin, getCompanyId } from '../../../../lib/serverAuth'
import { buildWorkScheduleMap, addWorkDays, countWorkDays } from '../../../../lib/workdays'

// POST — marks `date` as a rain day in work_schedule (type: 'rain'), then every
// active, incomplete job scheduled to be worked on that date has its start and
// end date pushed forward by one work day.
export async function POST(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { date } = await request.json()
    if (!date) return NextResponse.json({ error: 'date is required' }, { status: 400 })

    // Record the rain day so it persists on the calendar and is respected by
    // future work-day math (rain days don't count as work days).
    const { data: existingRow } = await supabaseAdmin
      .from('work_schedule').select('id').eq('company_id', companyId).eq('date', date).maybeSingle()

    if (existingRow) {
      const { error } = await supabaseAdmin
        .from('work_schedule').update({ type: 'rain', reason: 'Rain day' }).eq('id', existingRow.id)
      if (error) throw error
    } else {
      const { error } = await supabaseAdmin
        .from('work_schedule').insert({ company_id: companyId, date, type: 'rain', reason: 'Rain day' })
      if (error) throw error
    }

    const { data: scheduleRows, error: schedErr } = await supabaseAdmin
      .from('work_schedule').select('*').eq('company_id', companyId).order('date')
    if (schedErr) throw schedErr
    const workSchedule = buildWorkScheduleMap(scheduleRows)

    const { data: jobs, error: jobsErr } = await supabaseAdmin
      .from('jobs')
      .select('id, start_date, end_date, status')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .neq('status', 'complete')
      .lte('start_date', date)
      .gte('end_date', date)
    if (jobsErr) throw jobsErr

    for (const job of jobs || []) {
      const newStart = addWorkDays(job.start_date, 1, workSchedule)
      const newEnd = addWorkDays(job.end_date, 1, workSchedule)
      const newDuration = countWorkDays(newStart, newEnd, workSchedule)
      const { error } = await supabaseAdmin
        .from('jobs')
        .update({ start_date: newStart, end_date: newEnd, duration_days: newDuration })
        .eq('id', job.id)
        .eq('company_id', companyId)
      if (error) throw error
    }

    return NextResponse.json({ success: true, affected: (jobs || []).length, workSchedule: scheduleRows })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
