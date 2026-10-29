# Game rules & default configuration

Several scoring, strike, pass, and timer rules are **not yet formally approved**.
They are implemented as **editable settings with sensible defaults**, not as
hardcoded business rules. All defaults below can be changed on the setup screen
(→ "إعدادات متقدمة") before a match starts, and are stored per game.

Source of truth: [`packages/shared/src/settings.ts`](../packages/shared/src/settings.ts)
and the pure rule functions in [`packages/shared/src/rules.ts`](../packages/shared/src/rules.ts).

## Base points by difficulty

| Difficulty | Default points |
|---|---|
| سهل (easy) | 1 |
| متوسط (medium) | 2 |
| صعب (hard) | 3 |

## الأسرع يجاوب (Fastest)
- Correct answer: base points for the difficulty (editable; or a flat value).
- Wrong answer: `0` by default (optional penalty configurable).
- Both teams may answer; the judge decides who was first and whether it was correct.

## من أنا؟ (Who am I?)
- Points **decrease as more clues are revealed**:
  `points = maxPointsByDifficulty − (cluesRevealed − 1) × penaltyPerClue`, floored at `minPoints`.
- Defaults: max per difficulty = easy 3 / medium 4 / hard 5; `penaltyPerClue = 1`; `minPoints = 1`.
- The number of clues comes from the data (3 per record in the current banks); the UI adapts if fewer.

## صح أم خطأ (True / False) — strictly turn-based
- Each question belongs to **one team**, alternating (A, B, A, B, …) from the starting team.
- Only the active team may answer; **no stealing** by default (`allowSteal = false`, editable).
- Correct answer: base points to the active team. Wrong: `0` by default (penalty configurable).
- The correct boolean and explanation are revealed after the team answers.

## عدّد الإجابات (Enumerate)
- Teams alternate giving valid answers from the accepted-answer checklist.
- `strikesPerTeam = 3` (editable), `passesPerTeam = 1` (editable).
- `pointsPerAnswer = 1` per valid answer (editable).
- A team hitting its strike limit is **eliminated** from the round; turns skip eliminated teams.
- `lastTeamStandingBonus = 2` is defined for future use (not auto-awarded in v1; the judge
  ends the round with the "إنهاء الجولة" control).
- Each accepted answer can be counted **at most once** (enforced by a DB unique constraint).
- Lists flagged as possibly incomplete are shown with a warning; the judge may accept answers
  manually (outside the list) or skip the question.

## Timers
- Disabled by default. When enabled, per-type countdowns can be set (fastest 30s, true/false 20s
  suggested; who-am-I and enumerate 0 = off). Timers are advisory for the judge.

## Starting team
- Team A by default (editable). Determines true/false ownership and enumeration first turn.

## Authority & integrity
- The **backend computes and persists every score delta and turn transition**. The frontend
  never calculates or persists final scores. Each state-changing action is transactional and
  carries an idempotency key so a double-tap cannot double-score. Every action is reversible
  via the append-only action log (`Undo`).
