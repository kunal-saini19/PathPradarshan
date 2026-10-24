# 2Gathers

2Gathers is a Next.js freelance marketplace for clients and freelancers. The current application includes jobs, proposals, profiles, messaging, reviews, notifications, wallet/token workflows, coding-task fixtures, and a backend-first Career Navigator for structured career planning.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS
- PostgreSQL with Prisma
- Supabase-compatible authentication plus a signed local bearer-token fallback
- Zod validation, TanStack Query, Vitest, and Playwright
- Optional AI, SMTP, Razorpay, and blockchain integrations

## Run locally

Requirements: Node.js 20 LTS, npm, and a reachable PostgreSQL database.

```bash
npm install
npm run prisma:generate
npm run dev
```

Open `http://localhost:3000`.

Use a local `.env.local` file for development. Do not commit secrets. Required database variables are:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
AUTH_TOKEN_SECRET="a-long-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Supabase authentication additionally needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. SMTP, AI, Razorpay, and blockchain variables are only needed for their respective features. Keep service-role keys, private keys, API keys, and SMTP passwords server-side.

## Career Navigator

Open `/career-navigator` as a verified freelancer account. The feature is implemented around persistent, explainable backend data:

- Versioned curated frameworks for Frontend Developer, Backend Developer, and Data Analyst.
- Learner profile with skills, evidence source, interests, experience, availability, and target role.
- Deterministic skill normalization, prerequisite validation, gap prioritization, and capacity-aware scheduling.
- Immutable assessment snapshots and roadmap revisions.
- Optimistic revision tokens, one-active-roadmap protection, and completed-work preservation.
- Roadmap item state transitions with server-side validation.
- Evidence submission for learners and authorized review history for administrators.
- Contextual mentor endpoint with bounded input and a deterministic fallback when AI is unavailable.

### Demo profiles

After the Career Navigator schema has been migrated to the development database:

```bash
npm run prisma:push
npm run seed:career-demos
```

The seed command creates development-only accounts:

| Profile | Username | Password | Expected roadmap |
| --- | --- | --- | --- |
| Beginner | `career-beginner@2gathers.dev` | `Demo@1234` | Foundation-first, 6 hours/week |
| Intermediate | `career-intermediate@2gathers.dev` | `Demo@1234` | Higher-level quality work, 12 hours/week |

The seed is not run automatically and must never be run against production without review.

## API surface

Career Navigator endpoints are under `/api/career-navigator`:

- `GET /roles`
- `GET/PATCH /profile`
- `GET/POST /roadmap`
- `PATCH /roadmap/items/:id`
- `GET/POST /evidence`
- `PATCH /evidence/:id/review` for administrators
- `POST /mentor`

Protected routes derive identity from the signed bearer token, verify the database user and email state, and enforce learner/admin ownership on the server.

## Tests and checks

```bash
npm run test
npx tsc --noEmit
npm run build
npm run test:e2e
```

The deterministic tests cover token signing and expiry, skill normalization, evidence-source separation, framework cycle detection, differentiated learner plans, deadline warnings, roadmap rescheduling, and state transitions.

## Database migration warning

The checked-in migration history currently contains a legacy SQLite-style `User` migration while `schema.prisma` defines the current PostgreSQL model. Do not use that migration as a production baseline. Before deployment, create and review a real PostgreSQL baseline migration against a disposable database, then apply the Career Navigator schema through a controlled migration process. `prisma db push` is suitable for local development only after confirming the target database and backup strategy.

## Known limitations

- Existing coding-task routes still use fixture data and unsafe in-process code execution; the Career Navigator does not represent those results as independently verified competence.
- The mentor currently uses a deterministic fallback; provider-backed AI explanations remain optional.
- No production-grade distributed rate limiter is configured for AI or mutation endpoints.
- Local logout does not yet revoke already-issued bearer tokens; tokens are signed and expire, but server-side revocation requires a session/revocation store.
- Run database integration and end-to-end tests against an isolated database before production deployment.
