# GroundWork

GroundWork is a crew and equipment management SaaS for landscaping and field service
companies. It lets a company schedule crews, track jobs from scheduled to complete,
and know what equipment is assigned where — all from one dashboard.

## Local Setup

```bash
git clone <repo-url>
cd groundwork
npm install
```

Create a `.env.local` file in the project root with:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

These values come from the Supabase project's API settings. `.env.local` is
gitignored (see `.gitignore`'s `.env*` rule) — never commit it.

Then start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

- **Frontend**: Next.js 16 (App Router), React 19. Pages under `app/` are mostly
  client components using plain inline styles (see `lib/theme.js` for shared
  design tokens — dark background, green accent, monospace labels).
- **Backend**: Supabase (PostgreSQL + Auth). There is no separate backend service —
  `app/api/*/route.js` are Next.js API routes that talk to Supabase directly using
  the service role key (`lib/serverAuth.js`).
- **Auth model**: every API route reads the caller's Supabase access token from the
  `Authorization: Bearer` header (see `lib/api.js` on the client side), resolves it
  to a `company_id` via `getCompanyId()` in `lib/serverAuth.js`, and scopes every
  query to that `company_id`. The service role key bypasses Postgres RLS, so this
  per-route scoping is the primary authorization boundary today.
- **RLS**: Postgres row-level security policies exist as a defense-in-depth layer
  (see `supabase/migrations/`) in case the app ever queries Supabase directly with
  a user's own token instead of through these API routes. They do **not** protect
  against a bug in an API route itself, since the service role ignores RLS by
  design — that boundary is enforced by the `company_id` filters in the route code.

## Supabase Project

Dashboard: https://supabase.com/dashboard/project/vufyyemtbqulcaoirkiu
