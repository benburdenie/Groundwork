import { NextResponse } from 'next/server'
import { isValidISODate } from './workdays'

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

// Thrown for anything the caller got wrong (bad input, missing record). The
// message is written to be shown to the user, so it never contains database
// details.
export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

// Shared catch-block handler. ApiErrors pass their own message through; anything
// else (Supabase/Postgres errors, bugs) is logged server-side and answered with
// a generic message so schema, constraint and column names never reach the client.
export function handleError(err, route = 'api') {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status })
  }
  console.error(`[${route}]`, err)
  const body = { error: 'Something went wrong. Please try again.' }
  if (process.env.NODE_ENV === 'development') body.detail = err?.message
  return NextResponse.json(body, { status: 500 })
}

export async function readJson(request) {
  let body
  try {
    body = await request.json()
  } catch {
    throw new ApiError(400, 'Request body must be valid JSON')
  }
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'Request body must be a JSON object')
  }
  return body
}

// ---------------------------------------------------------------------------
// Allowed values
// ---------------------------------------------------------------------------

// Only the statuses that are stored. 'overdue', 'inuse' and 'assigned' are
// derived at read time and are never written.
export const JOB_STATUSES = ['notstarted', 'inprogress', 'complete']
export const EQUIPMENT_STATUSES = ['available', 'repair']
export const EQUIPMENT_CATEGORIES = ['truck', 'trailer_flat', 'trailer_dump', 'trailer_equipment', 'machine']
export const WORK_SCHEDULE_TYPES = ['workday', 'holiday']

export const LIMITS = {
  name: 100,
  short: 100, // foreman, role, city, client name
  address: 200,
  phone: 40,
  email: 254,
  reason: 200,
  notes: 2000,
  maxEquipmentPerJob: 100,
}

// ---------------------------------------------------------------------------
// Field validators
//
// All of them follow the same contract so routes can drop them straight into
// insert/update objects:
//   undefined -> undefined   (field not supplied; supabase-js omits it)
//   valid     -> the cleaned value
//   invalid   -> throws ApiError(400)
// Text keeps '' as '' and null as null (the UI stores empty optional fields as
// ''; some columns may be NOT NULL). Ids and dates normalise '' to null.
// ---------------------------------------------------------------------------

function label(field) {
  return field.replace(/_/g, ' ')
}

export function cleanText(value, field, { max = LIMITS.short, required = false } = {}) {
  if (value === undefined || value === null) {
    if (required) throw new ApiError(400, `${label(field)} is required`)
    return value
  }
  if (typeof value !== 'string') throw new ApiError(400, `${label(field)} must be text`)
  // NUL can't be stored in Postgres text
  if (/\u0000/.test(value)) throw new ApiError(400, `${label(field)} contains invalid characters`)
  const trimmed = value.trim()
  if (required && !trimmed) throw new ApiError(400, `${label(field)} is required`)
  if (trimmed.length > max) throw new ApiError(400, `${label(field)} must be ${max} characters or fewer`)
  return trimmed
}

export function cleanEmail(value, field = 'email') {
  const v = cleanText(value, field, { max: LIMITS.email })
  if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw new ApiError(400, `${label(field)} is not a valid email address`)
  return v
}

// Blank/null means "not provided" (undefined) so it can never null out a column.
export function cleanEnum(value, field, allowed, { required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new ApiError(400, `${label(field)} is required`)
    return undefined
  }
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new ApiError(400, `${label(field)} must be one of: ${allowed.join(', ')}`)
  }
  return value
}

// #RGB or #RRGGBB
export function cleanColor(value, field = 'color') {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  if (typeof value !== 'string' || !/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)) {
    throw new ApiError(400, `${label(field)} must be a hex color like #22c55e`)
  }
  return value
}

export function cleanDate(value, field, { required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new ApiError(400, `${label(field)} is required`)
    return value === undefined ? undefined : null
  }
  if (!isValidISODate(value)) throw new ApiError(400, `${label(field)} must be a valid date (YYYY-MM-DD)`)
  return value
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function cleanId(value, field, { required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new ApiError(400, `${label(field)} is required`)
    return value === undefined ? undefined : null
  }
  if (typeof value !== 'string' || !UUID_RE.test(value)) throw new ApiError(400, `${label(field)} is not valid`)
  return value
}

export function cleanIdList(value, field) {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) throw new ApiError(400, `${label(field)} must be a list`)
  if (value.length > LIMITS.maxEquipmentPerJob) throw new ApiError(400, `${label(field)} has too many entries`)
  return [...new Set(value.map((v) => cleanId(v, field, { required: true })))]
}

// Whole number of work days, 1..max. Accepts numeric strings (form posts).
export function cleanDuration(value, field, max) {
  if (value === undefined || value === null || value === '') return value === undefined ? undefined : null
  const n = typeof value === 'string' && /^\d+$/.test(value) ? parseInt(value, 10) : value
  if (!Number.isInteger(n) || n < 1 || n > max) throw new ApiError(400, `${label(field)} must be a whole number from 1 to ${max}`)
  return n
}

export function assertDateOrder(start, end, message = 'End date cannot be before start date') {
  if (start && end && end < start) throw new ApiError(400, message)
}

// Longest date range a single booking / availability block may span.
export const MAX_RANGE_DAYS = 1000

export function assertRangeLength(start, end) {
  if (!start || !end) return
  const days = (Date.parse(end) - Date.parse(start)) / 86_400_000
  if (days > MAX_RANGE_DAYS) throw new ApiError(400, `Date range cannot be longer than ${MAX_RANGE_DAYS} days`)
}
