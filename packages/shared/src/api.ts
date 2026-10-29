import { z } from "zod";
import { DIFFICULTIES, QUESTION_TYPES, TRUE_LABEL_AR, FALSE_LABEL_AR } from "./domain";
import { gameSettingsSchema, matchSelectionSchema } from "./settings";

/** Standard API envelope. */
export interface ApiOk<T> {
  ok: true;
  data: T;
}
export interface ApiErr {
  ok: false;
  error: { code: string; message: string; details?: unknown };
}
export type ApiResponse<T> = ApiOk<T> | ApiErr;

/** ---- Game creation ---- */
export const createGameSchema = z.object({
  teamAName: z.string().trim().min(1).max(40),
  teamBName: z.string().trim().min(1).max(40),
  selection: matchSelectionSchema,
  settings: gameSettingsSchema,
  /** Optional idempotency key so a double-tap doesn't create two games. */
  idempotencyKey: z.string().trim().min(8).max(100).optional(),
});
export type CreateGameInput = z.infer<typeof createGameSchema>;

/** ---- Answer action (fastest / who-am-i / true-false) ---- */
export const answerActionSchema = z.object({
  /** The team being judged for this answer. */
  team: z.enum(["A", "B"]),
  correct: z.boolean(),
  /** For WHO_AM_I only: how many clues were revealed at answer time. */
  cluesRevealed: z.number().int().min(1).max(20).optional(),
  /** For TRUE_FALSE: the answer the team actually gave (for the record). */
  givenAnswer: z.enum([TRUE_LABEL_AR, FALSE_LABEL_AR]).optional(),
  idempotencyKey: z.string().trim().min(8).max(100).optional(),
});
export type AnswerActionInput = z.infer<typeof answerActionSchema>;

/** ---- Enumeration actions ---- */
export const enumerateAnswerSchema = z.object({
  team: z.enum(["A", "B"]),
  /** Index into the question's accepted-answer list, OR free text for manual accept. */
  acceptedAnswerId: z.string().optional(),
  manualText: z.string().trim().max(200).optional(),
  idempotencyKey: z.string().trim().min(8).max(100).optional(),
});
export type EnumerateAnswerInput = z.infer<typeof enumerateAnswerSchema>;

export const teamActionSchema = z.object({
  team: z.enum(["A", "B"]),
  idempotencyKey: z.string().trim().min(8).max(100).optional(),
});
export type TeamActionInput = z.infer<typeof teamActionSchema>;

/** ---- Manual score adjustment ---- */
export const scoreAdjustSchema = z.object({
  team: z.enum(["A", "B"]),
  delta: z.number().int().min(-100).max(100),
  reason: z.string().trim().max(200).optional(),
});
export type ScoreAdjustInput = z.infer<typeof scoreAdjustSchema>;

/** ---- Reveal next clue (who-am-i) ---- */
export const revealClueSchema = z.object({
  idempotencyKey: z.string().trim().min(8).max(100).optional(),
});

/** ---- Question report / flag ---- */
export const reportQuestionSchema = z.object({
  questionId: z.string(),
  reason: z.string().trim().min(1).max(500),
  gameId: z.string().optional(),
});
export type ReportQuestionInput = z.infer<typeof reportQuestionSchema>;

/** ---- Question browser filters ---- */
export const questionQuerySchema = z.object({
  categoryId: z.string().optional(),
  type: z.enum(QUESTION_TYPES).optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  reviewFlagged: z.coerce.boolean().optional(),
  disabled: z.coerce.boolean().optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
export type QuestionQuery = z.infer<typeof questionQuerySchema>;

/** ---- Public-facing DTOs (answers hidden where appropriate) ---- */

export interface CategoryDto {
  id: string;
  nameAr: string;
  slug: string;
  questionCount: number;
  active: boolean;
}

export interface ClueDto {
  order: number;
  text: string;
}

/**
 * A question as shown to the JUDGE during play. The judge is trusted (holds the
 * session token), so this includes the answer — but clues for WHO_AM_I are
 * delivered progressively via a separate field (`visibleClues`) controlled by
 * the server, and the full answer list for ENUMERATE is the judge's private
 * checklist.
 */
export interface JudgeQuestionDto {
  gameQuestionId: string;
  questionId: string;
  order: number;
  type: (typeof QUESTION_TYPES)[number];
  difficulty: (typeof DIFFICULTIES)[number];
  categoryNameAr: string;
  questionText: string;
  answerText: string;
  explanation: string | null;
  /** WHO_AM_I: all clues (judge sees them to decide when to reveal). */
  clues: ClueDto[];
  /** WHO_AM_I: how many clues the server currently considers revealed. */
  cluesRevealed: number;
  /** TRUE_FALSE: the correct boolean (true = صح). */
  isTrue: boolean | null;
  /** TRUE_FALSE: which team owns this turn (strict turn-based). */
  ownerTeam: "A" | "B" | null;
  /** ENUMERATE: whose turn it currently is within the round. */
  enumActiveTeam: "A" | "B" | null;
  /** ENUMERATE: per-team strike/pass counters. */
  enumState: { A: { strikes: number; passesUsed: number }; B: { strikes: number; passesUsed: number } } | null;
  /** ENUMERATE: the private answer checklist. */
  acceptedAnswers: { id: string; text: string; used: boolean; usedByTeam: "A" | "B" | null }[];
  minimumRequired: number | null;
  /** Review metadata so the judge can decide to skip questionable items. */
  reviewStatus: string | null;
  reviewNotes: string | null;
  sourceReference: string | null;
  flaggedForReview: boolean;
  acceptedAnswersIncomplete: boolean;
  pointsAvailable: number;
}
