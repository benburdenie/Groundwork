#!/usr/bin/env node
/*
 * GroundWork demo seed
 * ====================
 *
 * Populates (or resets) a demo company with realistic landscaping data.
 *
 *   Demo login
 *     Email:    demo@test.com
 *     Password: Demo123
 *     Company:  Demo Company
 *
 * Run from the project root:
 *
 *   node scripts/seed-demo.js
 *
 * Idempotent: if the demo user already exists, its company is kept and ALL of that
 * company's data is deleted and re-created, so running it twice never duplicates
 * anything. Only the company owned by demo@test.com is ever touched.
 *
 * Config: reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from
 * .env.local (already how the app is configured). The demo credentials above live
 * in this comment only; they are deliberately not in any .env file.
 *
 * Dates are relative to the day you run it (past / today / next week), so the demo
 * always looks current. Re-run it any time to refresh.
 *
 * NOTE: this creates a real auth user with a well-known password in whatever
 * Supabase project .env.local points at. Delete the user when the demo is no
 * longer needed.
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const DEMO_EMAIL = 'demo@test.com'
const DEMO_PASSWORD = 'Demo123'
const COMPANY_NAME = 'Demo Company'
const COMPANY_SLUG = 'demo-company'
const DISPLAY_NAME = 'Demo User'

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

function loadEnvLocal() {
  const file = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`)
  const env = {}
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.replace(/\r/g, '').match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
  return env
}

const env = loadEnvLocal()
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local')
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ---------------------------------------------------------------------------
// Date helpers (UTC 'YYYY-MM-DD' strings). Same work-day rules as lib/workdays.js:
// weekends are off; a work_schedule row of 'rain' / 'holiday' turns a day off and
// 'workday' turns one on.
// ---------------------------------------------------------------------------

const parse = (s) => new Date(`${s}T00:00:00Z`)
const iso = (d) => d.toISOString().slice(0, 10)
const addDays = (s, n) => { const d = parse(s); d.setUTCDate(d.getUTCDate() + n); return iso(d) }

function isWorkDay(s, sched) {
  const o = sched.get(s)
  if (o === 'workday') return true
  if (o === 'holiday' || o === 'rain') return false
  const dow = parse(s).getUTCDay()
  return dow !== 0 && dow !== 6
}

// Move n work days forward (n > 0) or back (n < 0).
function shiftWorkDays(s, n, sched) {
  const step = n < 0 ? -1 : 1
  let left = Math.abs(n)
  let cur = s
  while (left > 0) {
    cur = addDays(cur, step)
    if (isWorkDay(cur, sched)) left--
  }
  return cur
}

// First work day on or after `s`.
function nextWorkDay(s, sched) {
  let cur = s
  while (!isWorkDay(cur, sched)) cur = addDays(cur, 1)
  return cur
}

// Start counts as day 1; returns the date of the `duration`-th work day.
function computeEnd(start, duration, sched) {
  return shiftWorkDays(nextWorkDay(start, sched), duration - 1, sched)
}

function countWorkDays(a, b, sched) {
  let n = 0
  for (let cur = a; cur <= b; cur = addDays(cur, 1)) if (isWorkDay(cur, sched)) n++
  return n
}

const overlaps = (aStart, aEnd, bStart, bEnd) => aStart <= bEnd && bStart <= aEnd

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const TODAY = iso(new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())))
const NO_OVERRIDES = new Map()
// "Day 0" of the demo timeline: today, or the next work day if run on a weekend.
const ANCHOR = nextWorkDay(TODAY, NO_OVERRIDES)
const wd = (n) => shiftWorkDays(ANCHOR, n, NO_OVERRIDES)
// Monday of the week after ANCHOR's week.
const NEXT_MONDAY = addDays(ANCHOR, 8 - (parse(ANCHOR).getUTCDay() || 7))

const CREWS = [
  { key: 'alpha', name: 'Crew Alpha', foreman_name: 'Marcus Reyes', color: '#22c55e', notes: 'Hardscape and installs. Two-truck crew.' },
  { key: 'bravo', name: 'Crew Bravo', foreman_name: 'Dana Whitfield', color: '#f5c800', notes: 'Irrigation, maintenance and tree work.' },
  { key: 'charlie', name: 'Crew Charlie', foreman_name: "Tom O'Connell", color: '#3b82f6', notes: 'Lawn renovation and planting.' },
]

const WORKERS = [
  { crew: 'alpha', name: 'Marcus Reyes', role: 'Foreman', phone: '555-0101', email: 'marcus.reyes@democompany.example' },
  { crew: 'alpha', name: 'Luis Herrera', role: 'Lead Hand', phone: '555-0102' },
  { crew: 'alpha', name: 'Jake Sullivan', role: 'Operator', phone: '555-0103' },
  { crew: 'alpha', name: 'Ben Carter', role: 'Labourer', phone: '555-0104' },
  { crew: 'bravo', name: 'Dana Whitfield', role: 'Foreman', phone: '555-0111', email: 'dana.whitfield@democompany.example' },
  { crew: 'bravo', name: 'Priya Nair', role: 'Lead Hand', phone: '555-0112' },
  { crew: 'bravo', name: 'Omar Haddad', role: 'Driver', phone: '555-0113' },
  { crew: 'bravo', name: 'Kyle Brennan', role: 'Labourer', phone: '555-0114' },
  { crew: 'charlie', name: "Tom O'Connell", role: 'Foreman', phone: '555-0121', email: 'tom.oconnell@democompany.example' },
  { crew: 'charlie', name: 'Sofia Alvarez', role: 'Lead Hand', phone: '555-0122' },
  { crew: 'charlie', name: 'Ryan Kowalski', role: 'Labourer', phone: '555-0123' },
]

// perm = the crew this item is permanently assigned to (null = shared pool).
const EQUIPMENT = [
  { key: 'dumpTruck', name: 'F-350 Dump Truck', category: 'truck', status: 'available', perm: 'alpha', notes: 'Unit 1. 2021 Ford F-350, 9ft dump body.' },
  { key: 'crewTruck', name: 'F-250 Crew Truck', category: 'truck', status: 'available', perm: 'bravo', notes: 'Unit 2. Crew cab, tool boxes.' },
  { key: 'landscapeTruck', name: 'Isuzu NPR Landscape Truck', category: 'truck', status: 'available', perm: 'charlie', notes: 'Unit 3. 14ft landscape body with gate.' },
  { key: 'dumpTrailer', name: '16ft Dump Trailer', category: 'trailer_dump', status: 'available', perm: 'alpha', notes: '14k GVWR, hydraulic dump.' },
  { key: 'flatDeck', name: '14ft Flat Deck Trailer', category: 'trailer_flat', status: 'available', perm: 'bravo', notes: 'Tandem axle, ramps.' },
  { key: 'equipTrailer', name: '7x14 Enclosed Equipment Trailer', category: 'trailer_equipment', status: 'available', perm: 'charlie', notes: 'Mowers and hand tools.' },
  { key: 'skidSteer', name: 'Kubota SVL75 Skid Steer', category: 'machine', status: 'available', perm: null, notes: 'Bucket, forks and auger attachments.' },
  { key: 'stumpGrinder', name: 'Vermeer SC60TX Stump Grinder', category: 'machine', status: 'available', perm: null, notes: 'Tracked, 60 hp.' },
  { key: 'miniEx', name: 'Bobcat E35 Mini Excavator', category: 'machine', status: 'repair', perm: null, notes: 'Hydraulic leak on left track motor. Parts on order.' },
]

// start: work-day offset from ANCHOR, or an explicit date. Jobs with no start are unscheduled.
const JOBS = [
  // ---- complete (past)
  { key: 'patio', name: 'Henderson Patio Installation', crew: 'alpha', start: wd(-18), duration: 6, status: 'complete', equipment: ['skidSteer', 'dumpTrailer'],
    address: '418 Birchwood Lane', city: 'Maple Ridge', client_name: 'Karen Henderson', client_phone: '555-0201', client_email: 'khenderson@example.com',
    notes: '600 sq ft paver patio with fire pit. Client signed off, final invoice sent.' },
  { key: 'cleanup', name: 'Fall Cleanup: Maple Ridge HOA', crew: 'bravo', start: wd(-14), duration: 4, status: 'complete', equipment: ['flatDeck'],
    address: 'Maple Ridge Common Areas', city: 'Maple Ridge', client_name: 'Maple Ridge HOA', client_phone: '555-0202', client_email: 'board@mapleridgehoa.example',
    notes: 'Leaf removal, bed edging, perennial cutback across 3 common areas.' },
  { key: 'wall', name: 'Oakview Retaining Wall', crew: 'charlie', start: wd(-12), duration: 7, status: 'complete', equipment: ['skidSteer', 'equipTrailer'],
    address: '92 Oakview Drive', city: 'Oakview', client_name: 'Raj Patel', client_phone: '555-0203', client_email: 'rpatel@example.com',
    notes: '45 ft segmental block wall, 3 ft high, with drainage stone.' },

  // ---- overdue (should have finished, still open)
  { key: 'irrigationFix', name: 'Pine Street Irrigation Repair', crew: 'bravo', start: wd(-8), duration: 4, status: 'inprogress', equipment: ['flatDeck'],
    address: '1207 Pine Street', city: 'Oakview', client_name: 'Linda Morales', client_phone: '555-0204', client_email: 'lmorales@example.com',
    notes: 'Main line break plus 3 zones to re-head. Waiting on replacement valve manifold.' },

  // ---- active today
  { key: 'mulch', name: 'Riverside Commercial Mulching', crew: 'alpha', start: wd(-2), duration: 6, status: 'inprogress', equipment: ['skidSteer', 'dumpTrailer'],
    address: '5500 Riverside Parkway', city: 'Riverside', client_name: 'Riverside Business Park', client_phone: '555-0205', client_email: 'facilities@riversidebp.example',
    notes: '120 yards of hardwood mulch across all planting beds. Deliveries at 7am.' },
  { key: 'lawn', name: 'Greenfield Lawn Renovation', crew: 'charlie', start: wd(-1), duration: 3, status: 'inprogress', equipment: ['equipTrailer'],
    address: '77 Greenfield Court', city: 'Greenfield', client_name: 'Tom & Ellen Baird', client_phone: '555-0206', client_email: 'bairds@example.com',
    notes: 'Core aerate, overseed and topdress. Keep dogs off for 3 weeks.' },
  { key: 'sprinkler', name: 'Ashford Sprinkler Installation', crew: 'bravo', start: wd(0), duration: 4, status: 'inprogress', equipment: ['crewTruck'],
    address: '233 Ashford Road', city: 'Ashford', client_name: 'David Chen', client_phone: '555-0207', client_email: 'dchen@example.com',
    notes: '6-zone system with smart controller. Locate utilities before trenching.' },

  // ---- upcoming
  { key: 'deck', name: 'Willow Creek Deck & Planting', crew: 'alpha', start: wd(5), duration: 5, status: 'notstarted', equipment: ['skidSteer'],
    address: '16 Willow Creek Way', city: 'Willow Creek', client_name: 'Angela Foster', client_phone: '555-0208', client_email: 'afoster@example.com',
    notes: 'Composite deck surround with foundation planting. Permit approved.' },
  { key: 'walkway', name: 'Harbor View Paver Walkway', crew: 'charlie', start: addDays(NEXT_MONDAY, 4), duration: 6, status: 'notstarted', equipment: ['equipTrailer'],
    address: '801 Harbor View Road', city: 'Harbor View', client_name: 'Michael Okafor', client_phone: '555-0209', client_email: 'mokafor@example.com',
    notes: 'Curved permeable paver walkway front door to driveway.' },
  { key: 'trees', name: 'Cedar Park Tree Removal', crew: 'bravo', start: wd(9), duration: 3, status: 'notstarted', equipment: ['stumpGrinder', 'dumpTruck'],
    address: '340 Cedar Park Blvd', city: 'Cedar Park', client_name: 'Susan Whitaker', client_phone: '555-0210', client_email: 'swhitaker@example.com',
    notes: 'Two dead ash trees plus stump grinding. Neighbour access agreed.' },

  // ---- unscheduled (no dates)
  { key: 'estate', name: 'Fernwood Estate Design & Bid', crew: null, start: null, duration: null, status: 'notstarted', equipment: [],
    address: '12 Fernwood Estate Road', city: 'Fernwood', client_name: 'Jonathan Price', client_phone: '555-0211', client_email: 'jprice@example.com',
    notes: 'Site walk booked. Full backyard redesign, budget around $60k.' },
  { key: 'drainage', name: 'Birchwood Drainage Fix', crew: 'bravo', start: null, duration: null, status: 'notstarted', equipment: [],
    address: '55 Birchwood Lane', city: 'Maple Ridge', client_name: 'Nina Rossi', client_phone: '555-0212', client_email: 'nrossi@example.com',
    notes: 'Standing water by the back fence. Needs quote for French drain.' },
]

// One rain day already applied: the last work day before ANCHOR.
const RAIN_DAY = shiftWorkDays(ANCHOR, -1, NO_OVERRIDES)

// Crew Charlie is out next Wed-Thu.
const AVAILABILITY = [
  { crew: 'charlie', start_date: addDays(NEXT_MONDAY, 2), end_date: addDays(NEXT_MONDAY, 3), reason: 'Crew safety certification training' },
]

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

function must({ data, error }, what) {
  if (error) throw new Error(`${what}: ${error.message}`)
  return data
}

async function findAuthUser(email) {
  const target = email.toLowerCase()
  for (let page = 1; page < 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(`listUsers: ${error.message}`)
    const hit = data.users.find((u) => u.email?.toLowerCase() === target)
    if (hit) return hit
    if (data.users.length < 200) return null
  }
  return null
}

async function ensureUser() {
  const existing = await findAuthUser(DEMO_EMAIL)
  if (existing) {
    // Reset the password and make sure the account is confirmed so the login always works.
    const { error } = await supabase.auth.admin.updateUserById(existing.id, { password: DEMO_PASSWORD, email_confirm: true })
    if (error) throw new Error(`updateUser: ${error.message}`)
    return { user: existing, created: false }
  }
  const { data, error } = await supabase.auth.admin.createUser({ email: DEMO_EMAIL, password: DEMO_PASSWORD, email_confirm: true })
  if (error) throw new Error(`createUser: ${error.message}`)
  return { user: data.user, created: true }
}

async function ensureCompany(user) {
  let companyId = null
  const link = must(await supabase.from('company_users').select('company_id').eq('user_id', user.id).maybeSingle(), 'company_users lookup')
  if (link) companyId = link.company_id
  if (!companyId) {
    const owned = must(await supabase.from('companies').select('id').eq('owner_id', user.id).maybeSingle(), 'companies lookup')
    if (owned) companyId = owned.id
  }

  if (companyId) {
    must(await supabase.from('companies').update({ name: COMPANY_NAME }).eq('id', companyId), 'company rename')
  } else {
    const company = must(
      await supabase.from('companies').insert({ name: COMPANY_NAME, slug: COMPANY_SLUG, owner_id: user.id }).select().single(),
      'company insert',
    )
    companyId = company.id
  }

  const hasLink = must(await supabase.from('company_users').select('user_id').eq('user_id', user.id).eq('company_id', companyId).maybeSingle(), 'link lookup')
  if (!hasLink) {
    must(
      await supabase.from('company_users').insert({ company_id: companyId, user_id: user.id, role: 'owner', display_name: DISPLAY_NAME, email: DEMO_EMAIL }),
      'company_users insert',
    )
  }
  return companyId
}

// Children before parents. Every delete is scoped to the demo company.
const DATA_TABLES = [
  'job_equipment', 'equipment_bookings', 'perm_equipment_assignments', 'crew_availability',
  'job_notes', 'jobs', 'workers', 'equipment', 'crews', 'work_schedule',
]

async function resetCompanyData(companyId) {
  for (const table of DATA_TABLES) {
    must(await supabase.from(table).delete().eq('company_id', companyId), `clear ${table}`)
  }
}

// ---------------------------------------------------------------------------
// Build + insert
// ---------------------------------------------------------------------------

// Mirrors POST /api/jobs/rain-day: every unfinished job that is being worked on
// the rain day has both dates pushed forward one work day.
function applyRainDay(jobs, rainDay, sched) {
  for (const job of jobs) {
    if (job.status === 'complete' || !job.start_date) continue
    if (!(job.start_date <= rainDay && rainDay <= job.end_date)) continue
    job.start_date = shiftWorkDays(job.start_date, 1, sched)
    job.end_date = shiftWorkDays(job.end_date, 1, sched)
    job.duration_days = countWorkDays(job.start_date, job.end_date, sched)
  }
}

// Fail loudly if the demo data contradicts itself (double-booked crew/equipment,
// a job on a day its crew is blocked out, wrong category counts).
function selfCheck(jobs) {
  const problems = []
  const live = jobs.filter((j) => j.status !== 'complete' && j.start_date)
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i], b = live[j]
      if (!overlaps(a.start_date, a.end_date, b.start_date, b.end_date)) continue
      if (a.crew && a.crew === b.crew) problems.push(`crew ${a.crew} double-booked: "${a.name}" / "${b.name}"`)
      for (const e of a.equipment) if (b.equipment.includes(e)) problems.push(`equipment ${e} double-booked: "${a.name}" / "${b.name}"`)
    }
  }
  for (const block of AVAILABILITY) {
    for (const job of live) {
      if (job.crew === block.crew && overlaps(job.start_date, job.end_date, block.start_date, block.end_date)) {
        problems.push(`"${job.name}" overlaps ${block.crew} unavailability`)
      }
    }
  }
  const overdue = jobs.filter((j) => j.status !== 'complete' && j.end_date && j.end_date < TODAY)
  const active = jobs.filter((j) => j.status !== 'complete' && j.start_date && j.start_date <= TODAY && TODAY <= j.end_date)
  const upcoming = jobs.filter((j) => j.start_date && j.start_date > TODAY)
  const unscheduled = jobs.filter((j) => !j.start_date)
  if (overdue.length !== 1) problems.push(`expected 1 overdue job, got ${overdue.length}`)
  if (unscheduled.length !== 2) problems.push(`expected 2 unscheduled jobs, got ${unscheduled.length}`)
  if (upcoming.length < 1) problems.push('expected upcoming jobs')
  if (active.length < 1) problems.push('expected jobs active today (script run on a weekend?)')
  if (problems.length) throw new Error('Demo data self-check failed:\n  - ' + problems.join('\n  - '))
  return { overdue, active, upcoming, unscheduled }
}

async function seed(companyId) {
  // Work-day schedule: the rain day (already applied).
  const sched = new Map([[RAIN_DAY, 'rain']])
  must(await supabase.from('work_schedule').insert({ company_id: companyId, date: RAIN_DAY, type: 'rain', reason: 'Rain day' }), 'insert work_schedule')

  // Jobs: plan dates on the plain calendar, then apply the rain day like the app does.
  const jobs = JOBS.map((j) => {
    const start_date = j.start
    const end_date = start_date ? computeEnd(start_date, j.duration, NO_OVERRIDES) : null
    return { ...j, start_date, end_date, duration_days: j.duration }
  })
  applyRainDay(jobs, RAIN_DAY, sched)
  const summary = selfCheck(jobs)

  const crews = must(
    await supabase.from('crews').insert(CREWS.map(({ key, ...c }) => ({ company_id: companyId, ...c }))).select('id, name'),
    'insert crews',
  )
  const crewId = Object.fromEntries(CREWS.map((c) => [c.key, crews.find((row) => row.name === c.name).id]))

  must(
    await supabase.from('workers').insert(WORKERS.map(({ crew, ...w }) => ({ company_id: companyId, crew_id: crewId[crew], ...w }))),
    'insert workers',
  )

  const equipment = must(
    await supabase.from('equipment').insert(EQUIPMENT.map(({ key, perm, ...e }) => ({ company_id: companyId, ...e }))).select('id, name'),
    'insert equipment',
  )
  const equipId = Object.fromEntries(EQUIPMENT.map((e) => [e.key, equipment.find((row) => row.name === e.name).id]))

  must(
    await supabase.from('perm_equipment_assignments').insert(
      EQUIPMENT.filter((e) => e.perm).map((e) => ({ company_id: companyId, crew_id: crewId[e.perm], equipment_id: equipId[e.key] })),
    ),
    'insert perm_equipment_assignments',
  )

  must(
    await supabase.from('crew_availability').insert(
      AVAILABILITY.map(({ crew, ...a }) => ({ company_id: companyId, crew_id: crewId[crew], ...a })),
    ),
    'insert crew_availability',
  )

  const inserted = must(
    await supabase.from('jobs').insert(
      jobs.map((j) => ({
        company_id: companyId,
        name: j.name, address: j.address, city: j.city,
        client_name: j.client_name, client_phone: j.client_phone, client_email: j.client_email,
        start_date: j.start_date, end_date: j.end_date, duration_days: j.duration_days,
        crew_id: j.crew ? crewId[j.crew] : null,
        notes: j.notes, status: j.status,
      })),
    ).select('id, name'),
    'insert jobs',
  )

  const jobEquipment = []
  for (const j of jobs) {
    const jobId = inserted.find((row) => row.name === j.name).id
    for (const e of j.equipment) jobEquipment.push({ company_id: companyId, job_id: jobId, equipment_id: equipId[e] })
  }
  if (jobEquipment.length) must(await supabase.from('job_equipment').insert(jobEquipment), 'insert job_equipment')

  return { jobs, summary }
}

// ---------------------------------------------------------------------------

async function main() {
  const host = new URL(env.NEXT_PUBLIC_SUPABASE_URL).host
  console.log(`Seeding demo data into ${host}`)
  if (!isWorkDay(TODAY, NO_OVERRIDES)) console.log(`(Today is a weekend; the timeline is anchored on ${ANCHOR}.)`)

  const { user, created } = await ensureUser()
  console.log(created ? `Created user ${DEMO_EMAIL}` : `Found existing user ${DEMO_EMAIL} (password reset)`)

  const companyId = await ensureCompany(user)
  console.log(`Company "${COMPANY_NAME}" (${companyId})`)

  await resetCompanyData(companyId)
  console.log('Cleared existing demo data')

  const { jobs, summary } = await seed(companyId)

  console.log('\nSeeded:')
  console.log(`  ${CREWS.length} crews, ${WORKERS.length} workers`)
  console.log(`  ${EQUIPMENT.length} equipment (${EQUIPMENT.filter((e) => e.status === 'repair').length} in repair), ${EQUIPMENT.filter((e) => e.perm).length} permanent assignments`)
  console.log(`  ${jobs.length} jobs: ${jobs.filter((j) => j.status === 'complete').length} complete, ${summary.overdue.length} overdue, ${summary.active.length} active today, ${summary.upcoming.length} upcoming, ${summary.unscheduled.length} unscheduled`)
  console.log(`  ${AVAILABILITY.length} crew availability block (${AVAILABILITY[0].crew}: ${AVAILABILITY[0].start_date} to ${AVAILABILITY[0].end_date})`)
  console.log(`  1 rain day (${RAIN_DAY})`)
  console.log('\nJobs:')
  for (const j of jobs) {
    console.log(`  ${j.status.padEnd(10)} ${(j.start_date || 'unscheduled').padEnd(10)} ${(j.end_date || '').padEnd(10)} ${j.name}`)
  }
  console.log(`\nLogin: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`)
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message)
  process.exit(1)
})
