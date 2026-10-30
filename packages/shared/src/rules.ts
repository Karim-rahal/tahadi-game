import type { TeamSide } from "./domain";
import { otherTeam } from "./domain";

/**
 * Pure game-rule functions. The backend is authoritative: it calls these to
 * compute every score delta and turn transition. The frontend may call the
 * same functions for display, but the server value always wins.
 *
 * Universal scoring (approved): EVERY question is worth exactly ONE point,
 * regardless of difficulty or question type. A question awards the point to
 * at most one team, or to no team. Enumeration is worth one point total too,
 * awarded to the winning team at resolution (never per answer).
 */

/** Every question is worth exactly one point. */
export const POINTS_PER_QUESTION = 1;

/** Fixed enumeration limits (approved, not configurable). */
export const ENUM_STRIKES_PER_TEAM = 3;
export const ENUM_PASSES_PER_TEAM = 1;

/** Points for a direct answer (fastest / who-am-i / true-false). */
export function computeAnswerPoints(correct: boolean): number {
  return correct ? POINTS_PER_QUESTION : 0;
}

/** Advance the turn for turn-based modes. Simple alternation A <-> B. */
export function advanceTurn(current: TeamSide): TeamSide {
  return otherTeam(current);
}

/**
 * Which team "owns" the Nth turn-based question, starting from `startingTeam`.
 * index is 0-based. Used to assign صح أم خطأ questions deterministically so
 * ownership stays independent of which team scored the previous question.
 */
export function ownerForTurnIndex(startingTeam: TeamSide, index: number): TeamSide {
  const even = index % 2 === 0;
  return even ? startingTeam : otherTeam(startingTeam);
}

// ───────────────────────── Enumeration resolution ─────────────────────────

export interface EnumTeamState {
  strikes: number;
  passesUsed: number;
}

/**
 * The authoritative reason an enumeration question was decided. The `_A` / `_B`
 * suffix names the team the reason is *about* (not necessarily the winner).
 */
export type EnumReason =
  | "THREE_STRIKES_A" // Team A reached 3 strikes → B wins
  | "THREE_STRIKES_B" // Team B reached 3 strikes → A wins
  | "FEWER_STRIKES_A" // all answers used, A had fewer strikes → A wins
  | "FEWER_STRIKES_B" // all answers used, B had fewer strikes → B wins
  | "UNUSED_PASS_A" // equal strikes, only B used its pass → A wins
  | "UNUSED_PASS_B" // equal strikes, only A used its pass → B wins
  | "TIE"; // equal strikes and equal pass usage → no point

export interface EnumResolution {
  /** Whether a terminal condition has been reached. */
  resolved: boolean;
  /** The team that wins the single point, or null for a tie / not-yet-resolved. */
  winner: TeamSide | null;
  reason: EnumReason | null;
}

/**
 * THE single authoritative enumeration winner function (Part 7 decision table).
 *
 * Priority:
 *   1. A team reaching the strike limit immediately loses (other team +1).
 *   2. Otherwise, once every accepted answer is used:
 *        a. fewer strikes wins;
 *        b. equal strikes → the team that did NOT use its pass wins, provided
 *           the other team DID use its pass;
 *        c. equal strikes and equal pass usage → no point (tie).
 *   3. If neither terminal condition holds, the round is not resolved yet.
 */
export function resolveEnumeration(
  a: EnumTeamState,
  b: EnumTeamState,
  allAnswersUsed: boolean,
  strikeLimit: number = ENUM_STRIKES_PER_TEAM,
): EnumResolution {
  // Rule A — three strikes ends it immediately, opponent takes the point.
  if (a.strikes >= strikeLimit) return { resolved: true, winner: "B", reason: "THREE_STRIKES_A" };
  if (b.strikes >= strikeLimit) return { resolved: true, winner: "A", reason: "THREE_STRIKES_B" };

  // Rule B — all accepted answers completed.
  if (allAnswersUsed) {
    if (a.strikes < b.strikes) return { resolved: true, winner: "A", reason: "FEWER_STRIKES_A" };
    if (b.strikes < a.strikes) return { resolved: true, winner: "B", reason: "FEWER_STRIKES_B" };
    // Equal strikes → compare pass usage.
    const aUsedPass = a.passesUsed > 0;
    const bUsedPass = b.passesUsed > 0;
    if (!aUsedPass && bUsedPass) return { resolved: true, winner: "A", reason: "UNUSED_PASS_A" };
    if (!bUsedPass && aUsedPass) return { resolved: true, winner: "B", reason: "UNUSED_PASS_B" };
    // Equal strikes and equal pass usage (both used, or neither used) → tie.
    return { resolved: true, winner: null, reason: "TIE" };
  }

  return { resolved: false, winner: null, reason: null };
}

/** Winner of a finished match by score. Returns "A" | "B" | "TIE". */
export function matchWinner(scoreA: number, scoreB: number): TeamSide | "TIE" {
  if (scoreA > scoreB) return "A";
  if (scoreB > scoreA) return "B";
  return "TIE";
}
