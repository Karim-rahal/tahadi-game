import type { Difficulty, QuestionType, TeamSide } from "./domain";
import { otherTeam } from "./domain";
import type { GameSettings } from "./settings";

/**
 * Pure game-rule functions. The backend is authoritative: it calls these to
 * compute every score delta and turn transition. The frontend may call the
 * same functions for optimistic display, but the server value always wins.
 */

/** Base points for a difficulty. */
export function basePoints(settings: GameSettings, difficulty: Difficulty): number {
  return settings.pointsByDifficulty[difficulty];
}

/** الأسرع يجاوب — points for a correct answer. */
export function fastestPoints(settings: GameSettings, difficulty: Difficulty): number {
  return settings.fastest.useDifficultyPoints
    ? basePoints(settings, difficulty)
    : settings.fastest.flatPoints;
}

/** صح أم خطأ — points for the active team's correct answer. */
export function trueFalsePoints(settings: GameSettings, difficulty: Difficulty): number {
  return settings.trueFalse.useDifficultyPoints
    ? basePoints(settings, difficulty)
    : settings.trueFalse.flatPoints;
}

/**
 * من أنا؟ — points decrease as more clues are revealed.
 * @param cluesRevealed how many clues were visible when the team answered (>=1).
 */
export function whoAmIPoints(
  settings: GameSettings,
  difficulty: Difficulty,
  cluesRevealed: number,
): number {
  const max = settings.whoAmI.maxPointsByDifficulty[difficulty];
  const penalty = Math.max(0, cluesRevealed - 1) * settings.whoAmI.penaltyPerClue;
  return Math.max(settings.whoAmI.minPoints, max - penalty);
}

/** عدّد الإجابات — points for a single valid answer. */
export function enumerateAnswerPoints(settings: GameSettings): number {
  return settings.enumerate.pointsPerAnswer;
}

export interface ScoreInput {
  type: QuestionType;
  difficulty: Difficulty;
  correct: boolean;
  /** For WHO_AM_I: clues revealed at answer time. */
  cluesRevealed?: number;
}

/**
 * Compute the point delta for a single answer event (not for enumeration round
 * mechanics, which are handled incrementally). Returns a positive, zero, or
 * negative integer.
 */
export function computeScoreDelta(settings: GameSettings, input: ScoreInput): number {
  let d = 0;
  switch (input.type) {
    case "FASTEST":
      d = input.correct ? fastestPoints(settings, input.difficulty) : -settings.fastest.wrongPenalty;
      break;
    case "WHO_AM_I":
      d = input.correct
        ? whoAmIPoints(settings, input.difficulty, Math.max(1, input.cluesRevealed ?? 1))
        : -settings.whoAmI.wrongPenalty;
      break;
    case "TRUE_FALSE":
      d = input.correct ? trueFalsePoints(settings, input.difficulty) : -settings.trueFalse.wrongPenalty;
      break;
    case "ENUMERATE":
      d = input.correct ? enumerateAnswerPoints(settings) : 0;
      break;
  }
  // Normalize negative zero so callers get a clean 0.
  return d === 0 ? 0 : d;
}

/**
 * Advance the turn for turn-based modes. Simple alternation A <-> B.
 * Used by صح أم خطأ (one question per team, strictly alternating) and by
 * عدّد الإجابات (alternating answers within a round).
 */
export function advanceTurn(current: TeamSide): TeamSide {
  return otherTeam(current);
}

/**
 * Which team "owns" the Nth turn-based question, starting from `startingTeam`.
 * index is 0-based. Used to assign صح أم خطأ questions deterministically.
 */
export function ownerForTurnIndex(startingTeam: TeamSide, index: number): TeamSide {
  const even = index % 2 === 0;
  return even ? startingTeam : otherTeam(startingTeam);
}

export interface EnumerateTeamState {
  strikes: number;
  passesUsed: number;
}

/** Has this team been eliminated from the enumeration round? */
export function isEliminated(settings: GameSettings, state: EnumerateTeamState): boolean {
  return state.strikes >= settings.enumerate.strikesPerTeam;
}

/** Can this team still use a pass? */
export function canPass(settings: GameSettings, state: EnumerateTeamState): boolean {
  return state.passesUsed < settings.enumerate.passesPerTeam;
}

/** Winner of a finished match by score. Returns "A" | "B" | "TIE". */
export function matchWinner(scoreA: number, scoreB: number): TeamSide | "TIE" {
  if (scoreA > scoreB) return "A";
  if (scoreB > scoreA) return "B";
  return "TIE";
}
