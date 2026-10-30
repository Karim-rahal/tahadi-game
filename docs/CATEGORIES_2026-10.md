# New categories — October 2026 (scope: plumbing + math only)

Agreed scope for this change: wire up the import pipeline for the new bank
format, add the **الحساب السريع** (Fast Mathematics) category with
deterministically-verified questions, remove the flagged-question feature, and
add the accuracy disclaimer. **Football (كرة القدم) and Lebanon (لبنان) are held
back** until their factual content is verified/rebuilt — they are NOT imported.

## الحساب السريع — Fast Mathematics (600) — IMPORTED

Rather than trust the supplied draft's free-text answers, the bank is
**generated deterministically** (`scripts/gen_math.py`, seed-fixed): every
question is built from a computation, so the stated answer is correct by
construction. Written to `data/mathematics/fast_mathematics_600.json`.

- Mode: all 600 are **الأسرع يجاوب** (fastest-answer), as required — no new
  scoring system.
- Difficulty: **easy 180 / medium 240 / hard 180**.
- Topics: الجمع والطرح 100 · الضرب والقسمة 120 · النِّسب والكسور 120 ·
  عمليات متعددة الخطوات 120 · القوى والجذور والأنماط 70 · مسائل كلامية 70.
- All mentally solvable; clean integer / short-decimal answers; hard kept
  moderate (2-digit × round factor, squares ≤25, 2^≤9, clean %/fractions).
- Each record carries the answer, accepted form, and a short calculation note.
- Verification: `apps/api/tests/mathBank.test.ts` re-reads the file, checks the
  counts/distribution/uniqueness, re-computes every pure-arithmetic question
  deterministically, and confirms the importer maps the English-enum format.

Math expressions render left-to-right (QuestionText detects pure expressions and
sets `dir="ltr"`), so operators/numbers are never bidi-reordered in the RTL UI.

## Import pipeline

- The enum mappers now accept the newer **English** values (`fastest_answer`,
  `who_am_i`, `true_false`, `enumeration`; `easy`/`medium`/`hard`) alongside the
  Arabic ones, so the new bank format imports without a bespoke transformer.
- `SourceFile` gained `mathematics`, `football`, `lebanon` (only `mathematics`
  is wired into `import.ts` for now).
- Import stays idempotent (upsert by `sourceFile`+`originalId`); the boot-time
  `npm run import` picks up the new category automatically on Railway.
- No schema migration was needed for math (flat accepted-answers). **Football/
  Lebanon enumeration uses answer-GROUPS with aliases, which the current flat
  AcceptedAnswer model does not represent — that schema work is deferred with
  those categories.**

## Flagged-question feature — REMOVED (player-facing)

- Setup: the "استبعاد الأسئلة الموسومة للمراجعة" checkbox is gone.
- Selection: `excludeFlaggedForReview` removed from the match-selection and
  pool-count schemas and from every query — all valid questions participate in
  random selection (flags are NOT flipped to bypass; the filter is gone).
- Game: the per-question "تنبيه مراجعة" indicator is removed from all modes.
- Question bank: the "review" filter and chip and the "answers may be
  incomplete" indicator are removed. The `disabled` moderation state and report
  counts are kept (unrelated mechanism).
- Internally, `flaggedForReview` / `reviewStatus` columns and import audit
  reports remain for development use — just never player-facing.

## Accuracy disclaimer

A small, subtle RTL/EN note on home, setup, and the game screen:
"قد تحتوي بعض الأسئلة أو الإجابات على معلومات غير دقيقة. نرحّب بملاحظاتكم لتحسين اللعبة."
(`components/Disclaimer.tsx`, i18n `disclaimer.text`). No banner, no modal.

## Deferred (NOT done this session)

- Football (1,200) and Lebanon (600): held back. The football draft is
  winner-template-heavy and its topic split doesn't match the spec; both need
  factual source-verification and (football) rebuilding. Enumeration
  answer-groups also need schema support before import.
- Individual external source-verification of football/Lebanon facts.
- The broader "premium frontend refinement" pass (Part 11).

## Tests

`npm run test -w @darundi/api` → 37 passing (31 prior + 6 new math-bank/importer
tests). Typecheck (shared/api/web) and the web production build pass.
