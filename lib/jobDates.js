import { computeEndDate, countWorkDays } from './workdays.js'
import { ApiError } from './errors.js'

// The server-side half of "what gets stored" for a job's dates — pulled out of
// app/api/jobs/route.js so the exact function the API calls can also be
// exercised directly in tests, end to end with the client's own computation
// (see lib/jobDates.test.js), instead of only trusting that the two happen to
// agree.
//
// Duration is stored in WORK days, not calendar days. When the caller supplies
// duration_days explicitly (the client already reconciled it against dates via
// lib/workdays.js) it's trusted as-is; otherwise it's derived from whichever of
// start/end/duration is missing.
// Inputs are already validated (real ISO dates, duration 1..365 or null); the
// date helpers return null when a range is unusable, which is reported as a 400
// rather than written to the database.
export function resolveJobDates({ start_date, end_date, duration_days }, workSchedule) {
  start_date = start_date || null
  end_date = end_date || null
  let duration = duration_days ?? null

  if (start_date && end_date && end_date < start_date) {
    throw new ApiError(400, 'End date cannot be before start date')
  }

  if (!start_date || !end_date) {
    if (start_date && duration) end_date = computeEndDate(start_date, duration, workSchedule)
    else duration = null
  } else if (!duration) {
    duration = countWorkDays(start_date, end_date, workSchedule)
  }

  // 0 is a legitimate count (a weekend-only job); null means the range was unusable.
  if (start_date && end_date && duration == null) {
    throw new ApiError(400, 'Dates are out of range or longer than a job can span')
  }
  if (start_date && duration && !end_date) {
    throw new ApiError(400, 'Could not work out an end date from that start date and duration')
  }
  return { start_date, end_date, duration_days: duration }
}
