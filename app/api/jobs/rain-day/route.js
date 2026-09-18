import { NextResponse } from 'next/server'
import { supabaseAdmin, getCompanyId } from '../../../../lib/serverAuth'
import { buildWorkScheduleMap, addWorkDays } from '../../../../lib/workdays'

// POST — every active, incomplete job scheduled to be worked on `date` gets its
// end date (and duration) pushed back by one work day.
export async function POST(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { date } = await request.json()
    if (!date) return NextResponse.json({ error: 'date is required' }, { status: 400 })

    const { data: scheduleRows, error: schedErr } = await supabaseAdmin
      .from('work_schedule').select('*').eq('company_id', companyId)
    if (schedErr) throw schedErr
    const workSchedule = buildWorkScheduleMap(scheduleRows)

    const { data: jobs, error: jobsErr } = await supabaseAdmin
      .from('jobs')
      .select('id, start_date, end_date, duration_days, status')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .neq('status', 'complete')
      .lte('start_date', date)
      .gte('end_date', date)
    if (jobsErr) throw jobsErr

    for (const job of jobs || []) {
      const newEnd = addWorkDays(job.end_date, 1, workSchedule)
      const { error } = await supabaseAdmin
        .from('jobs')
        .update({ end_date: newEnd, duration_days: (job.duration_days || 0) + 1 })
        .eq('id', job.id)
        .eq('company_id', companyId)
      if (error) throw error
    }

    return NextResponse.json({ success: true, affected: (jobs || []).length })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
