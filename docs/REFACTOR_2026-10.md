# Refactor — October 2026 (UI redesign + rule corrections)

A full product-quality refactor of the existing app. No database reset, no
destructive migration — the schema is unchanged.

## Game-rule changes (backend authoritative)

- **Universal scoring:** every question is worth exactly **one point**,
  regardless of difficulty or type. A question gives the point to one team or
  to no team — never to both. Difficulty-weighted scoring and all wrong-answer
  penalties were removed (`computeAnswerPoints` in `packages/shared/src/rules.ts`).
- **Difficulty removed from setup:** all difficulties are always included and
  randomized. The `difficulty` column is kept for classification/future use and
  is still shown in the question bank.
- **Number of questions is typed** (numeric input, min 1, max = live eligible
  pool via `POST /api/games/pool-count`).
- **من أنا؟** hints never reduce points; there is no wrong-answer button — the
  judge reveals hints and taps the team that answered correctly.
- **Automatic advancement:** resolving a question (answer / true-false /
  enumeration terminal condition / skip) marks it answered on the server; the
  client shows a short result transition and then advances — or finishes on the
  last question. There is no manual "next" button.
- **صح أم خطأ** stays strictly turn-based; ownership alternates independently of
  who scored last.
- **عدّد الإجابات:** 3 strikes + 1 pass per team (fixed). The single point is
  awarded to the winner **at resolution only**, never per answer. The one
  authoritative decision function is `resolveEnumeration`
  (`packages/shared/src/rules.ts`); see the decision table in the dev brief.
  The winner is persisted in the existing `answeredByTeam` column and the reason
  is derived from the final `enumState` (no new column, no migration).
- Idempotency keys + a "already answered" guard + transactional writes prevent
  double scoring on double-tap or retry. Undo reverses the latest action,
  including after automatic advancement.
- **صح أم خطأ fairness:** each match now has an **even** number of true/false
  questions so both teams own the same count (the odd one is swapped for another
  type, or dropped). `buildMatchPlan` in `apps/api/src/services/selection.ts`.
- **Tie-breaker:** a match that ends level plays a sudden-death decider — a
  random unused question (preferring الأسرع يجاوب / من أنا؟ so both teams can
  compete); the winner takes the point. A drawn decider spawns another until the
  tie is broken (or no questions remain). Tie-breaker questions are appended at
  order ≥ 1000 so they don't count toward match length (no schema change).

## Compatibility with historical matches

- The settings schema is now slim (`{ startingTeam }`). `withSettingsDefaults`
  ignores unknown legacy keys, so **old saved matches still parse**.
- Finished matches keep their stored `Team.score` and `ScoreEvent` rows exactly
  as they were — historical results are not recomputed. The new rules apply to
  **newly created matches** only.
- No columns were added, changed, or dropped; `prisma migrate deploy` has
  nothing new to apply.

## UI/UX redesign

New "arena" design system (`apps/web`): a bright warm-neutral stage, a
two-team **cyan (A) vs magenta (B)** duotone (chosen so team colours never
collide with good=green / bad=red), ink primary actions, and an Arabic type
pair of **Readex Pro** (display) + **IBM Plex Sans Arabic** (body) — replacing
the previous dark-navy/gold theme and Cairo/Tajawal. SVG icons throughout (no
emoji), mobile-first, RTL, reduced-motion respected.
