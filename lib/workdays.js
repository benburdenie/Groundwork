// Work-day math shared by the client (live form calculations) and the API routes
// (rain day / work day recompute). A "work day" is any weekday, unless overridden
// by a work_schedule row: type 'holiday' or 'rain' turns a day off, type 'workday'
// turns a weekend on.

// Hard limits so hostile or corrupt input can never spin a request forever.
// Every loop below is bounded by MAX_LOOP_ITERATIONS calendar days and the
// helpers return null (never throw or hang) when a date/duration is unusable.
export const MAX_DURATION_DAYS = 365
export const MAX_LOOP_ITERATIONS = 1000

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// True only for a real calendar date in strict YYYY-MM-DD form
// ("2026-02-30" and "x" are both rejected).
export function isValidISODate(dateStr) {
  if (typeof dateStr !== 'string' || !ISO_DATE_RE.test(dateStr)) return false
  const [y, m, d] = dateStr.split('-').map(Number)
  if (y < 1900 || y > 2200) return false
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

function isValidDuration(n) {
  return Number.isInteger(n) && n >= 1 && n <= MAX_DURATION_DAYS
}

export function isWeekend(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  return day === 0 || day === 6
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// workSchedule: Map<dateStr, 'workday' | 'holiday' | 'rain'>
export function buildWorkScheduleMap(rows) {
  const m = new Map()
  for (const r of rows || []) m.set(r.date, r.type)
  return m
}

export function isWorkDay(dateStr, workSchedule = new Map()) {
  const override = workSchedule.get(dateStr)
  if (override === 'workday') return true
  if (override === 'holiday' || override === 'rain') return false
  return !isWeekend(dateStr)
}

// Start date + a duration counted in work days (start date counts as day 1 once
// it lands on a work day). e.g. a 5-day job dropped on Monday ends Friday.
export function computeEndDate(startDateStr, durationDays, workSchedule = new Map()) {
  if (!startDateStr) return null
  if (!isValidISODate(startDateStr)) return null
  if (!durationDays || durationDays < 1) return startDateStr
  if (!isValidDuration(durationDays)) return null

  let current = startDateStr
  let guard = 0
  while (!isWorkDay(current, workSchedule)) {
    if (++guard > MAX_LOOP_ITERATIONS) return null
    current = addDays(current, 1)
  }
  let count = 1
  while (count < durationDays) {
    if (++guard > MAX_LOOP_ITERATIONS) return null
    current = addDays(current, 1)
    if (isWorkDay(current, workSchedule)) count++
  }
  return current
}

// Inclusive count of work days between two dates — used when the end date is
// edited directly and the duration field needs to reflect it.
export function countWorkDays(startDateStr, endDateStr, workSchedule = new Map()) {
  if (!isValidISODate(startDateStr) || !isValidISODate(endDateStr)) return null
  if (endDateStr < startDateStr) return null
  let count = 0
  let current = startDateStr
  let guard = 0
  while (current <= endDateStr) {
    if (++guard > MAX_LOOP_ITERATIONS) return null
    if (isWorkDay(current, workSchedule)) count++
    current = addDays(current, 1)
  }
  return count
}

// Push a date forward by n work days — used for the rain day shift.
export function addWorkDays(dateStr, n, workSchedule = new Map()) {
  if (!isValidISODate(dateStr)) return null
  if (!Number.isInteger(n) || n < 0 || n > MAX_LOOP_ITERATIONS) return null
  let current = dateStr
  let count = 0
  let guard = 0
  while (count < n) {
    if (++guard > MAX_LOOP_ITERATIONS) return null
    current = addDays(current, 1)
    if (isWorkDay(current, workSchedule)) count++
  }
  return current
}

export function rangesOverlap(startA, endA, startB, endB) {
  if (!startA || !endA || !startB || !endB) return false
  return startA <= endB && startB <= endA
}
