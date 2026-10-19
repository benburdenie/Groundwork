# GroundWork

![CI](https://github.com/benburdenie/GroundWork/actions/workflows/ci.yml/badge.svg)

Crew and equipment scheduling for landscaping and field service companies.
A company schedules its crews, tracks each job from scheduled to complete and
sees which equipment is booked where, all from one dashboard.

**Live app:** https://groundwork-rose-iota.vercel.app

<!-- TODO: add a screenshot of the schedule view here, e.g. docs/schedule.png -->

## Features

- **Scheduling** in week, month and board views, with an unscheduled-jobs drawer
- **Conflict detection** that blocks double-booking a crew or a piece of equipment,
  checked live in the job form and enforced again on the server
- **Work-day math** that skips weekends, holidays and rain days; marking a rain day
  pushes affected jobs' end dates forward
- **Crews, workers and equipment** management, including long-term equipment assignments
- **Printable daily dispatch sheet** for crews heading out in the morning
- **Multi-tenant accounts**: each company sees only its own data

## Stack

Next.js 16 (App Router) and React 19 on Vercel, Supabase for PostgreSQL and auth.
There is no separate backend service: `app/api/*/route.js` are Next.js API routes.

## How tenant isolation works

- Every API route reads the caller's Supabase access token from the
  `Authorization: Bearer` header, resolves it to a `company_id` with
  `getCompanyId()` in `lib/serverAuth.js` and scopes every query to that company.
- The routes use the service role key, which bypasses row-level security, so these
  per-route `company_id` filters are the primary authorization boundary.
- PostgreSQL row-level security policies (`supabase/migrations/`) are a second layer
  in case the app ever queries Supabase with a user's own token. They do not protect
  against a bug in an API route, since the service role ignores RLS by design.

## Testing

Scheduling logic lives in plain modules under `lib/` so it can be tested without a
database. The suite covers crew and equipment double-booking, job end-date
calculation and work-day math, including holiday and rain-day overrides and a
full-year round-trip sweep.

```bash
npm test        # node --test lib/*.test.js
npm run lint
```

CI runs lint, tests and a production build on every push and pull request.

## Running locally

```bash
git clone https://github.com/benburdenie/GroundWork.git
cd GroundWork
npm install
```

Create `.env.local` in the project root with the values from your Supabase
project's API settings (this file is gitignored):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The migrations in `supabase/migrations/` add row-level security and later schema
changes; the base tables are not yet checked in. Then:

```bash
npm run dev     # http://localhost:3000
```

`node scripts/seed-demo.js` fills a demo company with sample landscaping data.
