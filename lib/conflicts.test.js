// Pure client-side conflict matching (no DB) — see lib/conflictsServer.js for
// the server-side enforcement counterpart, which reuses this exact function.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkJobConflicts } from './conflicts.js'

test('crew double-booking: crew A on job 1 (Mon-Fri) blocks crew A on job 2 (Wed-Fri, same week)', () => {
  const crewA = 'crew-a'
  const job1 = { id: 'job-1', name: 'Job 1', crew_id: crewA, status: 'notstarted', start_date: '2026-09-21', end_date: '2026-09-25' }

  const conflicts = checkJobConflicts({
    jobId: 'job-2', // the job being edited/created — never job1
    crewId: crewA,
    equipmentIds: [],
    startDate: '2026-09-23', // Wednesday
    endDate: '2026-09-25', // Friday, same week
    jobs: [job1],
    availability: [],
    bookings: { list: [], equipmentNames: new Map() },
  })

  assert.equal(conflicts.length, 1)
  assert.equal(conflicts[0].field, 'crew')
  assert.match(conflicts[0].message, /job 1/i)
})

test('no conflict once the overlapping job is complete', () => {
  const crewA = 'crew-a'
  const job1 = { id: 'job-1', crew_id: crewA, status: 'complete', start_date: '2026-09-21', end_date: '2026-09-25' }

  const conflicts = checkJobConflicts({
    jobId: 'job-2', crewId: crewA, equipmentIds: [],
    startDate: '2026-09-23', endDate: '2026-09-25',
    jobs: [job1], availability: [], bookings: { list: [], equipmentNames: new Map() },
  })

  assert.equal(conflicts.length, 0)
})

test('no conflict once the dates no longer overlap', () => {
  const crewA = 'crew-a'
  const job1 = { id: 'job-1', crew_id: crewA, status: 'notstarted', start_date: '2026-09-21', end_date: '2026-09-25' }

  const conflicts = checkJobConflicts({
    jobId: 'job-2', crewId: crewA, equipmentIds: [],
    startDate: '2026-09-28', endDate: '2026-10-02', // the following Monday-Friday
    jobs: [job1], availability: [], bookings: { list: [], equipmentNames: new Map() },
  })

  assert.equal(conflicts.length, 0)
})

test('editing job 1 itself never conflicts with itself', () => {
  const crewA = 'crew-a'
  const job1 = { id: 'job-1', crew_id: crewA, status: 'notstarted', start_date: '2026-09-21', end_date: '2026-09-25' }

  const conflicts = checkJobConflicts({
    jobId: 'job-1', crewId: crewA, equipmentIds: [],
    startDate: '2026-09-21', endDate: '2026-09-25',
    jobs: [job1], availability: [], bookings: { list: [], equipmentNames: new Map() },
  })

  assert.equal(conflicts.length, 0)
})

test('equipment double-booking is reported the same way', () => {
  const equipmentId = 'eq-1'
  const job1 = {
    id: 'job-1', status: 'inprogress', start_date: '2026-09-21', end_date: '2026-09-25',
    job_equipment: [{ equipment_id: equipmentId }],
  }

  const conflicts = checkJobConflicts({
    jobId: 'job-2', crewId: null, equipmentIds: [equipmentId],
    startDate: '2026-09-23', endDate: '2026-09-25',
    jobs: [job1], availability: [],
    bookings: { list: [], equipmentNames: new Map([[equipmentId, 'Excavator']]) },
  })

  assert.equal(conflicts.length, 1)
  assert.equal(conflicts[0].field, 'equipment')
  assert.match(conflicts[0].message, /Excavator/)
})
