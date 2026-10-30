import { z } from "zod";
import { DIFFICULTIES, QUESTION_TYPES } from "./domain";

/**
 * Game settings.
 *
 * The scoring and enumeration rules are now fixed and approved (every question
 * is worth exactly one point; enumeration uses 3 strikes + 1 pass per team —
 * see rules.ts), so they are NO LONGER modeled as editable settings. The only
 * remaining per-match setting is which team takes the first turn.
 *
 * Unknown keys from older saved matches are ignored by `.parse`, so historical
 * game records remain readable under the new, slimmer schema.
 */
export const gameSettingsSchema = z.object({
  /** Which team takes the first turn in turn-based modes (true/false, enumerate). */
  startingTeam: z.enum(["A", "B"]).default("A"),
});

export type GameSettings = z.infer<typeof gameSettingsSchema>;

/** Parse-with-defaults helper. Tolerant of old, richer settings blobs. */
export function withSettingsDefaults(input?: unknown): GameSettings {
  const base = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  // Only pick the fields we still understand; ignore legacy keys.
  return gameSettingsSchema.parse({ startingTeam: base.startingTeam });
}

export const DEFAULT_SETTINGS: GameSettings = gameSettingsSchema.parse({});

/**
 * Match-composition selection (how the question pool for a match is built).
 * Difficulty is no longer chosen by the judge — all difficulties are always
 * included and randomized — but the field is kept (defaulting to all) for
 * backward compatibility and future use.
 */
export const matchSelectionSchema = z.object({
  categoryIds: z.array(z.string()).min(1),
  types: z.array(z.enum(QUESTION_TYPES)).min(1).default([...QUESTION_TYPES]),
  /** Always all difficulties (kept for compatibility; not exposed in setup). */
  difficulties: z.array(z.enum(DIFFICULTIES)).min(1).default([...DIFFICULTIES]),
  /** Total number of questions in the match (judge types this). */
  totalQuestions: z.number().int().min(1).max(200).default(20),
  /** Exclude questions an admin has disabled. Always true in practice. */
  excludeDisabled: z.boolean().default(true),
});
export type MatchSelection = z.infer<typeof matchSelectionSchema>;

/** Filters for counting the eligible question pool (setup's "max questions"). */
export const poolCountSchema = z.object({
  categoryIds: z.array(z.string()).min(1),
  types: z.array(z.enum(QUESTION_TYPES)).min(1).default([...QUESTION_TYPES]),
});
export type PoolCountInput = z.infer<typeof poolCountSchema>;
