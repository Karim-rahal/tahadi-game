import { z } from "zod";
import { DIFFICULTIES, QUESTION_TYPES } from "./domain";

/**
 * Game settings. Several scoring / strike / pass / timer rules are NOT yet
 * formally approved, so they are modeled as EDITABLE settings with sensible
 * defaults rather than hardcoded business rules. The defaults below are the
 * documented "recommended" configuration (see docs/GAME_RULES.md).
 */

const pointsByDifficultySchema = z.object({
  EASY: z.number().int().min(0).max(100),
  MEDIUM: z.number().int().min(0).max(100),
  HARD: z.number().int().min(0).max(100),
});
export type PointsByDifficulty = z.infer<typeof pointsByDifficultySchema>;

export const gameSettingsSchema = z.object({
  /** Base points per difficulty — the default for every mode unless overridden. */
  pointsByDifficulty: pointsByDifficultySchema.default({ EASY: 1, MEDIUM: 2, HARD: 3 }),

  fastest: z
    .object({
      /** Points for a correct answer; defaults to the difficulty base points. */
      useDifficultyPoints: z.boolean().default(true),
      flatPoints: z.number().int().min(0).max(100).default(1),
      /** Penalty subtracted from a team that answers incorrectly (0 = none). */
      wrongPenalty: z.number().int().min(0).max(100).default(0),
    })
    .default({}),

  whoAmI: z
    .object({
      /** Max points available when answered on the FIRST clue, per difficulty. */
      maxPointsByDifficulty: pointsByDifficultySchema.default({ EASY: 3, MEDIUM: 4, HARD: 5 }),
      /** Points removed for each additional clue revealed beyond the first. */
      penaltyPerClue: z.number().int().min(0).max(100).default(1),
      /** Points never drop below this floor. */
      minPoints: z.number().int().min(0).max(100).default(1),
      /** A wrong attempt costs the team this many points (0 = none). */
      wrongPenalty: z.number().int().min(0).max(100).default(0),
    })
    .default({}),

  trueFalse: z
    .object({
      useDifficultyPoints: z.boolean().default(true),
      flatPoints: z.number().int().min(0).max(100).default(1),
      /** Points lost by the active team on a wrong answer (0 = none). */
      wrongPenalty: z.number().int().min(0).max(100).default(0),
      /**
       * If true, when the active team is wrong the OTHER team may "steal".
       * Default false — spec says true/false is strictly turn-based.
       */
      allowSteal: z.boolean().default(false),
    })
    .default({}),

  enumerate: z
    .object({
      strikesPerTeam: z.number().int().min(1).max(10).default(3),
      passesPerTeam: z.number().int().min(0).max(10).default(1),
      /** Points awarded for each valid answer a team contributes. */
      pointsPerAnswer: z.number().int().min(0).max(100).default(1),
      /**
       * Bonus awarded to the team still standing when the other team is
       * eliminated (used all strikes). 0 = none.
       */
      lastTeamStandingBonus: z.number().int().min(0).max(100).default(2),
    })
    .default({}),

  timers: z
    .object({
      enabled: z.boolean().default(false),
      /** Per-type countdown in seconds. 0 disables the timer for that type. */
      fastestSeconds: z.number().int().min(0).max(600).default(30),
      whoAmISeconds: z.number().int().min(0).max(600).default(0),
      trueFalseSeconds: z.number().int().min(0).max(600).default(20),
      enumerateSeconds: z.number().int().min(0).max(600).default(0),
    })
    .default({}),

  /** Which team takes the first turn in turn-based modes. */
  startingTeam: z.enum(["A", "B"]).default("A"),
});

export type GameSettings = z.infer<typeof gameSettingsSchema>;

/** Parse-with-defaults helper. */
export function withSettingsDefaults(input?: unknown): GameSettings {
  return gameSettingsSchema.parse(input ?? {});
}

export const DEFAULT_SETTINGS: GameSettings = gameSettingsSchema.parse({});

/** Match-composition selection (how the question pool for a match is built). */
export const matchSelectionSchema = z.object({
  categoryIds: z.array(z.string()).min(1),
  types: z.array(z.enum(QUESTION_TYPES)).min(1).default([...QUESTION_TYPES]),
  difficulties: z.array(z.enum(DIFFICULTIES)).min(1).default([...DIFFICULTIES]),
  /** Total number of questions in the match. */
  totalQuestions: z.number().int().min(1).max(200).default(20),
  /** Exclude questions whose review_status marks them as needing review? */
  excludeFlaggedForReview: z.boolean().default(false),
  /** Exclude questions an admin has disabled. Always true in practice. */
  excludeDisabled: z.boolean().default(true),
});
export type MatchSelection = z.infer<typeof matchSelectionSchema>;
