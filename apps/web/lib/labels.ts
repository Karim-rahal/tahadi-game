import type { Difficulty, QuestionType } from "@darundi/shared";
import { DIFFICULTY_AR, QUESTION_TYPE_AR } from "@darundi/shared";

export const typeLabel = (t: QuestionType) => QUESTION_TYPE_AR[t];
export const difficultyLabel = (d: Difficulty) => DIFFICULTY_AR[d];

export const difficultyColor: Record<Difficulty, string> = {
  EASY: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
  MEDIUM: "text-gold-300 border-gold-400/30 bg-gold-400/10",
  HARD: "text-rose-300 border-rose-400/30 bg-rose-400/10",
};

export const typeIcon: Record<QuestionType, string> = {
  FASTEST: "⚡",
  WHO_AM_I: "🕵️",
  TRUE_FALSE: "✅",
  ENUMERATE: "📝",
};

export const statusLabel: Record<string, string> = {
  SETUP: "قيد الإعداد",
  ACTIVE: "جارية",
  PAUSED: "متوقفة مؤقتاً",
  FINISHED: "منتهية",
};
