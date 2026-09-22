// Run with: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  isWorkDay, computeEndDate, countWorkDays, addWorkDays, buildWorkScheduleMap,
} from './workdays.js'

// 2026-09-21 is a Monday — used throughout as a fixed, known start day.
const MONDAY = '2026-09-21'

test('10 work days from a Monday ends the following Friday, skipping both weekends', () => {
  const end = computeEndDate(MONDAY, 10, new Map())
  assert.equal(end, '2026-10-02')
  assert.equal(new Date(end + 'T00:00:00').getDay(), 5) // Friday
})

test('5 work days from a Monday ends that same week on Friday', () => {
  assert.equal(computeEndDate(MONDAY, 5, new Map()), '2026-09-25')
})

test('a job starting Friday with a 5-day duration skips the weekend', () => {
  // Fri 9/25 -> Mon,Tue,Wed,Thu,Fri of the following week
  assert.equal(computeEndDate('2026-09-25', 5, new Map()), '2026-10-01')
})

test('computeEndDate never lands on a weekend for a range of durations', () => {
  for (let dur = 1; dur <= 20; dur++) {
    const end = computeEndDate(MONDAY, dur, new Map())
    const day = new Date(end + 'T00:00:00').getDay()
    assert.notEqual(day, 0, `duration ${dur} ended on a Sunday (${end})`)
    assert.notEqual(day, 6, `duration ${dur} ended on a Saturday (${end})`)
  }
})

test('countWorkDays is the inverse of computeEndDate (round trip)', () => {
  for (let dur = 1; dur <= 30; dur++) {
    const end = computeEndDate(MONDAY, dur, new Map())
    assert.equal(countWorkDays(MONDAY, end, new Map()), dur, `duration ${dur} round-tripped to ${end}`)
  }
})

test('a holiday override inside the range pushes the end date out by one work day', () => {
  const ws = buildWorkScheduleMap([{ date: '2026-09-23', type: 'holiday' }]) // Wednesday off
  assert.equal(computeEndDate(MONDAY, 5, ws), '2026-09-28') // pushed to the following Monday
})

test('a workday override on a weekend pulls the end date back in', () => {
  // Without override: 5-day job starting Friday spans into the next week.
  // With that Saturday forced to a work day, it finishes one day sooner.
  const ws = buildWorkScheduleMap([{ date: '2026-09-26', type: 'workday' }]) // Saturday
  assert.equal(computeEndDate('2026-09-25', 5, ws), '2026-09-30')
})

test('addWorkDays steps forward only over work days, skipping weekends and rain days', () => {
  const ws = buildWorkScheduleMap([{ date: '2026-09-24', type: 'rain' }]) // Thursday
  // From Wednesday, +1 work day skips Thursday's rain day and lands on Friday.
  assert.equal(addWorkDays('2026-09-23', 1, ws), '2026-09-25')
})

test('isWorkDay treats plain weekends as non-work, weekdays as work, by default', () => {
  assert.equal(isWorkDay('2026-09-21', new Map()), true)  // Monday
  assert.equal(isWorkDay('2026-09-26', new Map()), false) // Saturday
  assert.equal(isWorkDay('2026-09-27', new Map()), false) // Sunday
})

test('a full-year sweep: every computed end date lands on a work day and round-trips', () => {
  let d = new Date('2026-01-01T00:00:00')
  let checked = 0
  for (let i = 0; i < 365; i++) {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0')
    const start = `${y}-${m}-${day}`
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) {
      for (const dur of [1, 5, 10, 20]) {
        const end = computeEndDate(start, dur, new Map())
        const endDow = new Date(end + 'T00:00:00').getDay()
        assert.notEqual(endDow, 0, `start ${start} duration ${dur} ended on Sunday`)
        assert.notEqual(endDow, 6, `start ${start} duration ${dur} ended on Saturday`)
        assert.equal(countWorkDays(start, end, new Map()), dur, `start ${start} duration ${dur} failed round trip`)
        checked++
      }
    }
    d.setDate(d.getDate() + 1)
  }
  assert.ok(checked > 1000, 'sanity: swept a meaningful number of cases')
})
