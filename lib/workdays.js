// Work-day math shared by the client (live form calculations) and the API routes
// (rain day / work day recompute). A "work day" is any weekday, unless overridden
// by a work_schedule row: type 'holiday' turns a weekday off, type 'workday' turns
// a weekend on.

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

// workSchedule: Map<dateStr, 'workday' | 'holiday'>
export function buildWorkScheduleMap(rows) {
  const m = new Map()
  for (const r of rows || []) m.set(r.date, r.type)
  return m
}

export function isWorkDay(dateStr, workSchedule = new Map()) {
  const override = workSchedule.get(dateStr)
  if (override === 'workday') return true
  if (override === 'holiday') return false
  return !isWeekend(dateStr)
}

// Start date + a duration counted in work days (start date counts as day 1 once
// it lands on a work day). e.g. a 5-day job dropped on Monday ends Friday.
export function computeEndDate(startDateStr, durationDays, workSchedule = new Map()) {
  if (!startDateStr || !durationDays || durationDays < 1) return startDateStr || null
  let current = startDateStr
  while (!isWorkDay(current, workSchedule)) current = addDays(current, 1)
  let count = 1
  while (count < durationDays) {
    current = addDays(current, 1)
    if (isWorkDay(current, workSchedule)) count++
  }
  return current
}

// Inclusive count of work days between two dates — used when the end date is
// edited directly and the duration field needs to reflect it.
export function countWorkDays(startDateStr, endDateStr, workSchedule = new Map()) {
  if (!startDateStr || !endDateStr || endDateStr < startDateStr) return null
  let count = 0
  let current = startDateStr
  while (current <= endDateStr) {
    if (isWorkDay(current, workSchedule)) count++
    current = addDays(current, 1)
  }
  return count
}

// Push a date forward by n work days — used for the rain day shift.
export function addWorkDays(dateStr, n, workSchedule = new Map()) {
  let current = dateStr
  let count = 0
  while (count < n) {
    current = addDays(current, 1)
    if (isWorkDay(current, workSchedule)) count++
  }
  return current
}

export function rangesOverlap(startA, endA, startB, endB) {
  if (!startA || !endA || !startB || !endB) return false
  return startA <= endB && startB <= endA
}
