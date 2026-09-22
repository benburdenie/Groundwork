import { NextResponse } from 'next/server'
import { supabaseAdmin, getCompanyId } from '../../../lib/serverAuth'
import { buildWorkScheduleMap, computeEndDate } from '../../../lib/workdays'
import { fetchWorkScheduleRows, setWorkScheduleEntry } from '../../../lib/workSchedule'
import {
  handleError, readJson, cleanDate, cleanEnum, cleanText, WORK_SCHEDULE_TYPES, LIMITS,
} from '../../../lib/apiUtils'

// GET — list every work-schedule override (rain-day holidays, forced work days) for this company
export async function GET(request) {
  try {
    const companyId = await getCompanyId(request)
    if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    return NextResponse.json({ workSchedule: await fetchWorkScheduleRows(companyId) })
  } catch (err) {
    return handleError(err, 'work-schedule')
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
      const { error: updateError } = await supabaseAdmin
        .from('jobs').update({ end_date: newEnd }).eq('id', job.id).eq('company_id', companyId)
      if (updateError) throw updateError
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

    const body = await readJson(request)
    const date = cleanDate(body.date, 'date', { required: true })
    const type = cleanEnum(body.type, 'type', WORK_SCHEDULE_TYPES)
    const reason = cleanText(body.reason, 'reason', { max: LIMITS.reason })

    await setWorkScheduleEntry(companyId, date, type, reason)

    const rows = await fetchWorkScheduleRows(companyId)
    await recomputeJobEndDates(companyId, buildWorkScheduleMap(rows))

    return NextResponse.json({ workSchedule: rows })
  } catch (err) {
    return handleError(err, 'work-schedule')
  }
}
