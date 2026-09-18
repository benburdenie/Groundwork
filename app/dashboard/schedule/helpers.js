import { COLORS } from '../../../lib/theme'

export function fmt(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayStr() {
  return fmt(new Date())
}

// A job is overdue once its end date has passed and it isn't marked complete,
// regardless of the status field — this always wins over a stale "in progress".
export function displayStatus(job) {
  if (job.status === 'complete') return 'complete'
  const t = todayStr()
  if (job.end_date && job.end_date < t) return 'overdue'
  if (job.start_date && job.end_date && job.start_date <= t && t <= job.end_date) return 'inprogress'
  return job.status === 'inprogress' ? 'inprogress' : 'notstarted'
}

export function overdueJobs(jobs) {
  return (jobs || []).filter(j => displayStatus(j) === 'overdue')
}

export function crewColor(crew) {
  return crew?.color || COLORS.yellow
}

// Equipment considered "deployed" on a given date: attached to an active,
// non-complete job whose range covers that date, or covered by a dated booking.
export function equipmentDeployedOnDate(dateStr, jobs, bookings) {
  const ids = new Set()
  for (const job of jobs || []) {
    if (job.status === 'complete') continue
    if (!(job.start_date && job.end_date && job.start_date <= dateStr && dateStr <= job.end_date)) continue
    for (const je of job.job_equipment || []) {
      if (je.equipment_id) ids.add(je.equipment_id)
    }
  }
  for (const b of bookings || []) {
    if (b.start_date <= dateStr && dateStr <= b.end_date) ids.add(b.equipment_id)
  }
  return ids
}

export function jobsForDate(jobs, dateStr) {
  return (jobs || []).filter(j => {
    if (j.start_date && j.end_date) return j.start_date <= dateStr && dateStr <= j.end_date
    if (j.start_date && !j.end_date) return j.start_date === dateStr
    return false
  })
}

export function crewBlocksForDate(availability, dateStr) {
  return (availability || []).filter(a => a.start_date <= dateStr && dateStr <= a.end_date)
}

export function addDaysToDate(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}
