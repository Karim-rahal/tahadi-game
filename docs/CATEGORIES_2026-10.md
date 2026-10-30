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

## لبنان — Lebanon (600) — IMPORTED

Imported from the supplied draft (`data/lebanon/lebanon_600_playtest.json`),
after verification. 150 per mode (fastest / who-am-i / true-false / enumeration).

Verification done (deterministic + sample):
- **Administrative boundaries** (your flagged risk): all district/governorate
  enumerations checked against Lebanon's 8-governorate structure — **51/51
  deterministically correct, 0 mismatches** (guarded by a regression test).
- Enumeration is bounded ("pick from these options") — **every accepted answer
  is within the shown options, 0 strays**; true/false is balanced (75/75);
  who-am-i clues are progressive (broad first, answer never in clue 1).
- Web-verified a sample of well-known facts (independence 1943 / Nov 22, first
  president Bechara El Khoury, PM Riad Al Solh, Chamoun 1952–58, Greater Lebanon
  1920, civil war ended 1990, July War 2006) — all correct.
- **Not** done: individual source-verification of the long tail (obscure
  villages, minor personalities). Covered by the accuracy disclaimer; internal
  `review_status` kept.

Lebanon's enumeration answer-groups are all single-variant (0 of 908 carry an
alias), so the flat accepted-answer model imports them correctly with no loss.
The **alias / answer-group schema** is therefore deferred to the football work,
where aliases are abundant and essential. Lebanon's raw groups are preserved in
`rawMetadata` for when that feature lands.

## كرة القدم — Football — IMPORTED (full 1,200)

Per the request, the **full 1,200** supplied draft is reentered
(`data/football/football_1200.json`, 300 per mode), with answer-group aliases.
Before import it was passed through a deterministic verify+fix pass
(`scripts/verify_football.py`) against web-confirmed champion tables (big-5
leagues + UCL 2000–2025, World Cup 1930–2022, Euro, Copa):

- **655 winner-based questions deterministically checked → 654 already correct,
  1 fixed.** The draft's factual winner data is sound (it was repetitive, not
  wrong). The importer now reads the draft's camelCase fields
  (`canonicalAnswer` / `acceptedAnswers` / `answerGroups` / `verificationStatus`),
  and a test confirms **all 1,200 map with zero skips**.
- Enumeration imports as answer GROUPS with club aliases (e.g. "Manchester
  United") and the judge's list gets a search box.

**Honest limits:** the remaining **545** questions (كأس آسيا / Asian Cup,
who-am-i clue chains, non-winner items, Serie A 2005/06 under Calciopoli,
enumeration ranges before 2000) were **not** deterministically verified — they
are editorial-draft content, covered by the accuracy disclaimer and the internal
`verificationStatus`. The draft remains winner-template-heavy and does not match
the spec's topic distribution (no Ligue 1, no Europa League, no
players/transfers/records bucket); broadening that variety is a further step.

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

## Deferred (still NOT done)

- Football beyond the winners-core: the remaining ~800+ to reach 1,200, the exact
  topic distribution, and the variety modes (players/transfers/managers/records/
  memorable matches) — a per-fact research effort.
- The broader "premium frontend refinement" pass (Part 11).

The alias / answer-group schema (column + importer + DTO + enumeration UI with
search) is now DONE and used by football.

## Tests

`npm run test -w @darundi/api` → 37 passing (31 prior + 6 new math-bank/importer
tests). Typecheck (shared/api/web) and the web production build pass.
