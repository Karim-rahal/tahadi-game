/**
 * Core domain enums and the mapping between the Arabic labels used in the
 * source question banks and the canonical machine values used everywhere else.
 */

export const QUESTION_TYPES = ["FASTEST", "WHO_AM_I", "TRUE_FALSE", "ENUMERATE"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/** Arabic display labels for each question type (as in the source files). */
export const QUESTION_TYPE_AR: Record<QuestionType, string> = {
  FASTEST: "الأسرع يجاوب",
  WHO_AM_I: "من أنا؟",
  TRUE_FALSE: "صح أم خطأ",
  ENUMERATE: "عدّد الإجابات",
};

export const DIFFICULTY_AR: Record<Difficulty, string> = {
  EASY: "سهل",
  MEDIUM: "متوسط",
  HARD: "صعب",
};

/** Reverse maps: Arabic label -> canonical value (built from the above). */
export const QUESTION_TYPE_FROM_AR: Record<string, QuestionType> = Object.fromEntries(
  Object.entries(QUESTION_TYPE_AR).map(([k, v]) => [v, k as QuestionType]),
);

export const DIFFICULTY_FROM_AR: Record<string, Difficulty> = Object.fromEntries(
  Object.entries(DIFFICULTY_AR).map(([k, v]) => [v, k as Difficulty]),
);

/**
 * Tolerant mappers. They trim and accept a few known spelling variants so the
 * importer never silently drops a record because of a stray character.
 * Returns null for unknown input (caller decides how to handle).
 */
export function questionTypeFromArabic(raw: string | null | undefined): QuestionType | null {
  if (!raw) return null;
  const s = raw.trim();
  if (QUESTION_TYPE_FROM_AR[s]) return QUESTION_TYPE_FROM_AR[s]!;
  // Tolerate "من أنا" without the question mark, and stray whitespace.
  const normalized = s.replace(/\s+/g, " ").replace(/؟/g, "").trim();
  if (normalized === "من أنا") return "WHO_AM_I";
  if (normalized === "الأسرع يجاوب" || normalized === "الاسرع يجاوب") return "FASTEST";
  if (normalized === "صح أم خطأ" || normalized === "صح او خطأ") return "TRUE_FALSE";
  if (normalized === "عدد الإجابات" || normalized === "عدّد الإجابات") return "ENUMERATE";
  return null;
}

export function difficultyFromArabic(raw: string | null | undefined): Difficulty | null {
  if (!raw) return null;
  const s = raw.trim();
  if (DIFFICULTY_FROM_AR[s]) return DIFFICULTY_FROM_AR[s]!;
  if (s === "سهله") return "EASY";
  if (s === "متوسطة") return "MEDIUM";
  if (s === "صعبه") return "HARD";
  return null;
}

/** صح / خطأ as a boolean, with tolerant matching. */
export function trueFalseFromArabic(raw: string | null | undefined): boolean | null {
  if (!raw) return null;
  const s = raw.trim();
  if (s === "صح" || s === "صحيح" || s === "صواب") return true;
  if (s === "خطأ" || s === "خطا" || s === "خاطئ") return false;
  return null;
}

export const TRUE_LABEL_AR = "صح";
export const FALSE_LABEL_AR = "خطأ";

/** Game lifecycle states. */
export const GAME_STATUSES = ["SETUP", "ACTIVE", "PAUSED", "FINISHED"] as const;
export type GameStatus = (typeof GAME_STATUSES)[number];

export type TeamSide = "A" | "B";
export function otherTeam(side: TeamSide): TeamSide {
  return side === "A" ? "B" : "A";
}
