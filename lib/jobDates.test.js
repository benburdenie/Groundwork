// End-to-end trace of the actual create-a-job pipeline, using the real
// functions from each hop rather than re-implementing the math:
//   1. client:   JobFormModal's duration-field handler -> computeEndDate
//   2. server:   POST /api/jobs -> resolveJobDates (lib/jobDates.js)
//   3. render:   the calendar's jobsForDate, per lib/workdays.js's isWorkDay
//
// Run with: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeEndDate, addDays, buildWorkScheduleMap } from './workdays.js'
import { resolveJobDates } from './jobDates.js'
import { jobsForDate } from '../app/dashboard/schedule/helpers.js'

const MONDAY = '2026-09-21'

// Same shape JobFormModal.handleChange builds when the duration field changes,
// and the same shape it sends to onSubmit -> apiPost('/api/jobs', ...).
function clientComputesJobPayload(startDate, durationDays, workSchedule) {
  const end_date = computeEndDate(startDate, durationDays, workSchedule)
  return { start_date: startDate, end_date, duration_days: durationDays }
}

test('end-to-end: 10 work days from a Monday, no overrides — client, server, and render all agree', () => {
  const workSchedule = new Map()

  // 1. client
  const payload = clientComputesJobPayload(MONDAY, 10, workSchedule)
  assert.equal(payload.end_date, '2026-10-02')

  // 2. server — POST /api/jobs passes exactly this payload through resolveJobDates
  const resolved = resolveJobDates(payload, workSchedule)
  assert.deepEqual(resolved, { start_date: MONDAY, end_date: '2026-10-02', duration_days: 10 })

  // 3. render — walk every calendar day in the stored range and count pills
  const job = { id: 'x', start_date: resolved.start_date, end_date: resolved.end_date }
  let calendarDays = 0
  let renderedPills = 0
  for (let d = resolved.start_date; d <= resolved.end_date; d = addDays(d, 1)) {
    calendarDays++
    if (jobsForDate([job], d, workSchedule).length > 0) renderedPills++
  }
  assert.equal(calendarDays, 12, '10 work days from a Monday spans exactly 12 calendar days (2 weekends)')
  assert.equal(renderedPills, 10, 'a pill renders on exactly the 10 work-day cells, none on the 2 weekend cells')
})

// This is the exact bug found live in production: two jobs with the identical
// start_date and duration_days (2026-09-21, 10) stored different end dates
// (2026-10-02 vs 2026-10-05) because one company had 2026-09-21 itself marked
// as a rain day. computeEndDate was silently treating the first work day
// *after* a non-work-day start as day 1, without changing the start_date that
// actually got stored — so the job's recorded start and its real first work
// day disagreed, inflating the calendar span for the same nominal duration.
test('end-to-end: a start date that is itself a declared rain day does not inflate the span', () => {
  const workSchedule = buildWorkScheduleMap([
    { date: '2026-09-21', type: 'rain' },
    { date: '2026-09-22', type: 'workday' },
    { date: '2026-09-24', type: 'rain' },
    { date: '2026-09-26', type: 'workday' },
  ])

  const payload = clientComputesJobPayload(MONDAY, 10, workSchedule)
  const resolved = resolveJobDates(payload, workSchedule)

  // Must match the plain-schedule case exactly: the overrides here cancel out
  // (one rain day removed, one weekend day added back) so the correct answer
  // is identical to the no-override run above.
  assert.equal(resolved.start_date, MONDAY)
  assert.equal(resolved.end_date, '2026-10-02')

  const calendarSpan = (new Date(resolved.end_date) - new Date(resolved.start_date)) / 86400000 + 1
  assert.equal(calendarSpan, 12, 'must not balloon to 15 calendar days for a 10-work-day job')
})

test('a 1-day job always ends on the same date it starts, even on a declared non-work day', () => {
  const workSchedule = buildWorkScheduleMap([{ date: '2026-09-19', type: 'rain' }]) // a Saturday
  assert.equal(computeEndDate('2026-09-19', 1, workSchedule), '2026-09-19')
})
