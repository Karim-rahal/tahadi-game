# Question-bank import audit

This documents the audit of the two supplied JSON banks and how the importer handles
their differences, duplicates, and incompleteness. Machine-readable per-file reports are
generated at import time: [`import-report.religious.json`](import-report.religious.json)
and [`import-report.geography.json`](import-report.geography.json).

## Files

| File | Records | Category |
|---|---|---|
| `data/religious/religious_questions_600_draft.json` | 600 | أسئلة دينية (Twelver Shia) |
| `data/geography/geography_600_playtest.json` | 600 | بلاد العالم والجغرافيا |

Both are **playtest drafts** (per their own metadata `warning`/`warnings`). They are
**not individually fact-checked**. The importer never marks anything as verified.

## Counts (verified)

Each file: **600 records**, perfectly distributed:

| Type | easy | medium | hard | total |
|---|--:|--:|--:|--:|
| الأسرع يجاوب | 45 | 60 | 45 | 150 |
| من أنا؟ | 45 | 60 | 45 | 150 |
| صح أم خطأ | 45 | 60 | 45 | 150 |
| عدّد الإجابات | 45 | 60 | 45 | 150 |

- `من أنا؟`: 3 clues per record (both files).
- `صح أم خطأ`: answer is `صح`/`خطأ` (religious ≈ 75/75, geography 80/70). Religious stores a
  top-level `explanation` (all 150 present); geography stores `is_true` + `explanation` under `metadata`.
- `عدّد الإجابات`: 4–43 accepted answers; some religious records carry `minimum_required`.

## The two schemas differ

The importer maps **both** schemas onto one internal shape:

| Internal field | Religious source | Geography source |
|---|---|---|
| category | (implicit → أسئلة دينية) | `category` |
| explanation | `explanation` | `metadata.explanation` |
| isTrue (TF) | derived from `answer` | `metadata.is_true` (fallback: `answer`) |
| reviewNotes | `note` | `review_notes` |
| sourceReference | `source_reference` | `source` |
| sourceUrl | `source_url` | — |
| minimumRequired | `minimum_required` | — |
| topic / sect | `topic` / `sect` | — |

The full original record is preserved verbatim in `Question.rawMetadata`, and the original
file + original id are stored separately from the internal database id
(`sourceFile` + `originalId`, unique together → **idempotent re-import**).

## Structural validity

- **0 structural errors** in either file: every record has a known type, known difficulty,
  non-empty question, and (for enumerate) a non-empty accepted-answer list.
- Structural validity is **not** factual verification. `sourceVerified` is forced to `false`
  for every record, and `flaggedForReview` is `true` for all (they are drafts).

## Duplicates (flagged, never deleted)

Duplicate detection keys on a content hash of `type + normalized(question) + normalized(answer)`
— **not** on question text alone, because many `من أنا؟` records legitimately share the prompt
text "من أنا؟" and differ only in clues/answer.

- **Religious:** 4 duplicate groups → 5 extra copies:
  `LIST-009/010`, `LIST-034/035`, `LIST-079/080`, `LIST-128/129/130`.
  These are enumeration questions repeated verbatim. All are **kept and flagged** with a warning.
- **Geography:** 0 exact duplicates.

Duplicates are preserved (not removed) and surfaced in the import report and the question browser.

## Incomplete answer lists

Enumeration lists are flagged `acceptedAnswersIncomplete` when they are shorter than a stated
`minimum_required`, or when review notes mention completion ("استكمال", "مفتوحة", …). The judge
sees a warning and can accept manual answers or skip — the app never pretends a list is exhaustive.

## Reviewing & reporting

- The **bنك الأسئلة** screen (`/questions`) browses all records with filters, search, answers,
  clues, sources, review status, and report counts.
- During play the judge can **report** a questionable question (stored for later review) and
  **skip** it. Original review status is preserved.
- Admins can **disable** a question (excluded from future games) or clear its review flag via an
  admin-token-guarded endpoint — never through the ordinary judge session.
