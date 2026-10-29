# Status: what's done, what's verified, what remains

Honest accounting of the build. Nothing unfinished is presented as complete.

## Implemented & working

**Data & import**
- Idempotent importer mapping **both** source schemas to one model; preserves original text,
  clues (ordered), accepted-answer alternatives, sources, explanations, review status, and the
  full raw record; stores original file + id separately; detects/flags duplicates; flags
  incomplete enumeration lists; generates per-file reports; never fabricates or deletes.

**Backend (Express + Prisma + PostgreSQL)**
- Full normalized schema (Category, Question, QuestionClue, AcceptedAnswer, QuestionReport,
  ImportBatch, GameSession, Team, GameQuestion, AnswerAttempt, EnumerationUsedAnswer, Strike,
  Pass, ScoreEvent, GameActionHistory, IdempotencyKey) with FKs, indexes, unique constraints.
- Backend-authoritative game state machine: create, start, next, answer, reveal-clue,
  enumerate-answer, strike, pass, skip, **undo**, manual score adjust, pause, resume, finish,
  history, results. Transactional; idempotency-key protected; full undo via an inverse log.
- Fair, server-controlled question selection (randomized, type-balanced, no repeats, true/false
  ownership assigned deterministically).
- Anonymous judge **capability-token** auth (HMAC hash stored, HttpOnly/SameSite cookie, header
  fallback, constant-time compare). Admin-token guard for question-bank edits. Zod validation,
  Helmet, CORS lock, rate limiting, centralized errors, structured logging, graceful shutdown.
- Initial SQL migration generated (`apps/api/prisma/migrations/0_init`).

**Frontend (Next.js, RTL, mobile-first)**
- Dark navy + gold theme, Cairo/Tajawal fonts, Framer Motion, 44px touch targets, safe-area
  sticky action bar, ~320px-safe layout.
- Screens: home, setup (+ Quick Start + advanced settings), match dashboard with scoreboard &
  progress, the four mode screens (fastest, progressive-clue who-am-I, strictly-turn-based
  true/false, enumeration checklist with strikes/passes/manual-accept/hide), winner, saved
  games (resume), question browser/review, pause/recovery/error states.
- All four modes wired end-to-end to the backend; undo/skip/report/pause in the action bar;
  resume after refresh via persisted server state + local recovery hint.

**Tests**
- 25 unit tests (Vitest) covering scoring, who-am-I decay, turn switching, true/false ownership,
  strike/pass limits, Arabic normalization & matching, importer mapping (both schemas), duplicate
  detection, and a structural pass over all 1,200 real records. **All passing.**

## Verified in this environment
- `typecheck` passes for shared, api, web.
- `npm run build` succeeds for api (tsup) and web (next build).
- 25/25 unit tests pass.
- Importer **dry-run** over the real data: 600 + 600 read, 0 structural errors, duplicates flagged.
- API server boots and serves `/api/health` (+ Helmet headers, CORS lock, rate-limit headers, Arabic 404).

## NOT run here (needs the user's environment) — prepared, not verified end-to-end
- **Live PostgreSQL run**: `prisma migrate deploy` + `db:import` + full gameplay against a real DB.
  No Postgres was available in the build environment. The schema validates, the migration SQL is
  generated, and the engine type-checks and unit-tests, but a live DB run is the user's next step.
- **Playwright E2E**: spec + config provided (`apps/web/e2e`), not executed (needs a running stack
  + seeded DB + `npx playwright install`). The two true/false & full-type scenarios are marked for
  extension with type-filtered seeded fixtures.
- **Railway deploy**: Dockerfiles, health check, env matrix, and a step-by-step guide are provided;
  the actual Railway project creation is manual (no Railway access from the build env).
- **DB integration tests**: covered indirectly by unit tests over the pure engine rules; a full
  DB-backed integration suite is a recommended follow-up.

## Residual risks & honest caveats
- **Not 100% secure.** Established practices are applied (hashed capability tokens, HttpOnly
  cookies, CORS lock, rate limiting, parameterized queries, input validation, no secrets in repo).
  Known residual risks: the resume token is also kept in `localStorage` as a recovery hint (a
  capability leak if the device is compromised — documented trade-off for single-device resume);
  the `/api/questions` browser is readable without the judge token (acceptable for a single-device
  judge tool, but it does expose answers — gate it behind the admin token if you need it private);
  no CSRF token beyond SameSite cookies (state changes also require the capability token, which an
  attacker site cannot read).
- **Questions are unverified drafts.** The app treats every record as a draft: nothing is marked
  verified, all are flagged for review, duplicates/incompleteness are surfaced, and the judge can
  skip/report. Do not use in a real competition without content review.
- **`whoAmI.wrongPenalty`/`fastest.wrongPenalty` default to 0** and several rules are provisional —
  all are editable (see `docs/GAME_RULES.md`).
- **Enumeration `lastTeamStandingBonus`** is defined but not auto-applied in v1 (judge ends rounds).

## Recommended next steps
1. Provision PostgreSQL, run `prisma migrate deploy`, then `db:import`.
2. Play a full match locally against the DB; spot-check scoring/undo/resume.
3. Install Playwright and extend the E2E fixtures; run on mobile + desktop viewports.
4. Follow `docs/RAILWAY_DEPLOYMENT.md` to ship.
5. Review the flagged/duplicate questions in the browser before any real use.
