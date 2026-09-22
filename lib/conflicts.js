import { rangesOverlap } from './workdays.js'

// Live conflict check used by the job form. Returns an array of
// { field: 'crew' | 'equipment', message } — empty means safe to save.
// `field` lets the form render each warning inline under the relevant
// input instead of a single banner.
export function checkJobConflicts({ jobId, crewId, equipmentIds, startDate, endDate, jobs, availability, bookings }) {
  const conflicts = []
  if (!startDate || !endDate) return conflicts

  if (crewId) {
    const crewJobConflict = (jobs || []).find(j =>
      j.id !== jobId &&
      j.crew_id === crewId &&
      j.status !== 'complete' &&
      rangesOverlap(startDate, endDate, j.start_date, j.end_date)
    )
    if (crewJobConflict) {
      conflicts.push({ field: 'crew', message: `Already booked on "${crewJobConflict.name}" (${crewJobConflict.start_date} → ${crewJobConflict.end_date})` })
    }

    const blockConflict = (availability || []).find(a =>
      a.crew_id === crewId && rangesOverlap(startDate, endDate, a.start_date, a.end_date)
    )
    if (blockConflict) {
      conflicts.push({ field: 'crew', message: `Marked unavailable ${blockConflict.start_date} → ${blockConflict.end_date}${blockConflict.reason ? ` (${blockConflict.reason})` : ''}` })
    }
  }

  for (const equipmentId of equipmentIds || []) {
    const equipName = bookings?.equipmentNames?.get(equipmentId) || 'Equipment'

    const jobConflict = (jobs || []).find(j =>
      j.id !== jobId &&
      j.status !== 'complete' &&
      rangesOverlap(startDate, endDate, j.start_date, j.end_date) &&
      (j.job_equipment || []).some(je => je.equipment_id === equipmentId)
    )
    if (jobConflict) {
      conflicts.push({ field: 'equipment', message: `${equipName} already assigned to "${jobConflict.name}" (${jobConflict.start_date} → ${jobConflict.end_date})` })
      continue
    }

    const bookingConflict = (bookings?.list || []).find(b =>
      b.equipment_id === equipmentId &&
      b.job_id !== jobId &&
      rangesOverlap(startDate, endDate, b.start_date, b.end_date)
    )
    if (bookingConflict) {
      conflicts.push({ field: 'equipment', message: `${equipName} is booked ${bookingConflict.start_date} → ${bookingConflict.end_date}` })
    }
  }

  return conflicts
}
