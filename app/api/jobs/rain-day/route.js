import { NextResponse } from 'next/server'
import { supabaseAdmin, getCompanyId } from '../../../../lib/serverAuth'
import { buildWorkScheduleMap, addWorkDays, countWorkDays } from '../../../../lib/workdays'
import { fetchWorkScheduleRows, setWorkScheduleEntry } from '../../../../lib/workSchedule'
import { handleError, readJson, cleanDate } from '../../../../lib/apiUtils'

// POST — marks `date` as a rain day in work_schedule (type: 'rain'), then every
// active, incomplete job scheduled to be worked on that date has its start and
// end date pushed forward by one work day.
export async function POST(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const date = cleanDate((await readJson(request)).date, 'date', { required: true })

    // Record the rain day so it persists on the calendar and is respected by
    // future work-day math (rain days don't count as work days).
    await setWorkScheduleEntry(companyId, date, 'rain', 'Rain day')

    const scheduleRows = await fetchWorkScheduleRows(companyId)
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

    let affected = 0
    for (const job of jobs || []) {
      const newStart = addWorkDays(job.start_date, 1, workSchedule)
      const newEnd = addWorkDays(job.end_date, 1, workSchedule)
      const newDuration = countWorkDays(newStart, newEnd, workSchedule)
      // The date helpers return null for unusable dates; never write that over a job.
      if (!newStart || !newEnd || !newDuration) {
        console.warn(`[rain-day] skipped job ${job.id}: could not recompute dates`)
        continue
      }
      const { error } = await supabaseAdmin
        .from('jobs')
        .update({ start_date: newStart, end_date: newEnd, duration_days: newDuration })
        .eq('id', job.id)
        .eq('company_id', companyId)
      if (error) throw error
      affected++
    }

    return NextResponse.json({ success: true, affected, workSchedule: scheduleRows })
  } catch (err) {
    return handleError(err, 'rain-day')
  }
}
