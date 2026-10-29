# تحدي الدروندي — Arabic Two-Team Trivia Game

A judge-controlled, single-device, mobile-first Arabic trivia game for **two teams**.
One judge reads questions aloud, players answer verbally, and the app manages turns,
timers, strikes, passes, points, undo, and resume. Fully right-to-left (RTL).

> **Status:** working end-to-end application. Backend-authoritative game state in
> PostgreSQL, idempotent question import, all four question modes, and a polished
> RTL UI. See [`docs/STATUS.md`](docs/STATUS.md) for exactly what is implemented,
> what is verified, and the residual risks.

---

## Four question modes

| Mode | Arabic | Behaviour |
|---|---|---|
| Fastest | **الأسرع يجاوب** | Both teams compete; judge marks who answered first. |
| Who am I? | **من أنا؟** | Progressive clues revealed one at a time; points drop per clue. |
| True / False | **صح أم خطأ** | **Strictly turn-based** — one team per question, alternating. No stealing by default. |
| Enumerate | **عدّد الإجابات** | Teams alternate valid answers from a checklist; configurable strikes & passes. |

Two categories ship in the data bank: **أسئلة دينية** (Twelver Shia religious) and
**بلاد العالم والجغرافيا** (world geography), 600 questions each.

---

## Monorepo structure

```
tahadi-aldarundi/
  apps/
    web/         Next.js (App Router) + Tailwind + Framer Motion — the judge UI
    api/         Express + Prisma + Zod — REST API & game state machine
  packages/
    shared/      Types, enums, Arabic normalization, scoring/turn rules, Zod DTOs
  data/
    religious/   religious_questions_600_draft.json  (primary import source)
    geography/   geography_600_playtest.json         (primary import source)
  docs/          Deployment guide, game rules, import audit, status
  Dockerfile.api / Dockerfile.web   Railway build definitions
```

The JSON files are the **primary machine-readable import sources**. (The companion
Excel files are review references and are not imported, to avoid double-importing.)

---

## Tech stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript (strict), Tailwind CSS,
  Framer Motion, Lucide icons, Cairo/Tajawal Arabic fonts.
- **Backend:** Node 20, Express, TypeScript (strict), Zod validation, Prisma ORM, PostgreSQL.
- **Hosting:** Railway only (frontend service + backend service + managed PostgreSQL).

---

## Local development

### Prerequisites
- Node 20+
- A PostgreSQL database (local or a Railway dev instance)

### 1. Install
```bash
npm install
```

### 2. Environment
Copy the example and fill in values:
```bash
cp .env.example .env
```
The API reads `DATABASE_URL`, `SESSION_SECRET`, `FRONTEND_URL`, `PORT`, `ADMIN_TOKEN`.
The web app reads `NEXT_PUBLIC_API_URL`. See `.env.example` for details and how to
generate secrets. For local dev you can put all of them in a single root `.env`
and also create `apps/web/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:4000`.

### 3. Database: migrate + import
```bash
# apply the schema
npm run prisma:migrate -w @darundi/api        # dev (creates/updates the DB)
# or, against an existing DB: npm run prisma:deploy -w @darundi/api

# import both question banks (idempotent — safe to re-run)
npm run db:import -w @darundi/api
# analyze only, no DB writes:
npm run db:import -w @darundi/api -- --dry-run
```
The import writes an audit report per file to `docs/import-report.<file>.json`.

### 4. Run
```bash
npm run dev:api     # http://localhost:4000
npm run dev:web     # http://localhost:3000
```

Open http://localhost:3000, press **بداية سريعة** (Quick Start), and play.

---

## Scripts (root)

| Command | Purpose |
|---|---|
| `npm run typecheck` | Type-check shared, api, and web |
| `npm run build` | Build shared → api → web |
| `npm run test` | API unit tests (Vitest) |
| `npm run db:import` | Import/seed the question banks |
| `npm run prisma:migrate` | Create/apply a dev migration |

Verified locally: typecheck (all), production builds (api + web), 25/25 unit tests,
importer dry-run on the real data, API server boot + health.

---

## Testing

- **Unit** (`apps/api/tests`, Vitest): scoring, who-am-I point decay, turn switching,
  true/false ownership, strike/pass limits, Arabic normalization & answer matching,
  importer mapping for both schemas, duplicate detection, and a structural pass over
  the real 1,200 records. Run: `npm run test -w @darundi/api`.
- **E2E** (`apps/web/e2e`, Playwright): the setup → play → refresh-resume → finish flow.
  Requires a running stack + seeded DB: `cd apps/web && npx playwright install && npx playwright test`.

---

## Security (summary)

Zod validation on every input, Prisma (parameterized), Helmet headers, CORS locked to
`FRONTEND_URL`, rate limiting, HttpOnly/SameSite session cookies, and an anonymous
**judge capability token** (only an HMAC hash is stored; the game id alone never grants
control). Admin-only endpoints guard question-bank edits. Full detail and residual
risks are in [`docs/STATUS.md`](docs/STATUS.md).

---

## More docs
- [`docs/RAILWAY_DEPLOYMENT.md`](docs/RAILWAY_DEPLOYMENT.md) — step-by-step Railway setup
- [`docs/GAME_RULES.md`](docs/GAME_RULES.md) — scoring/strike/pass/timer defaults (all editable)
- [`docs/IMPORT_AUDIT.md`](docs/IMPORT_AUDIT.md) — data audit findings & how the importer handles them
- [`docs/STATUS.md`](docs/STATUS.md) — what's done, what's verified, remaining risks
