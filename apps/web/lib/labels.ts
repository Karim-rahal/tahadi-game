import type { Difficulty, QuestionType } from "@darundi/shared";
import { CheckCircle2, ListChecks, VenetianMask, Zap, type LucideIcon } from "lucide-react";

/** SVG icon per question type (no emoji — renders consistently everywhere). */
export const typeIcons: Record<QuestionType, LucideIcon> = {
  FASTEST: Zap,
  WHO_AM_I: VenetianMask,
  TRUE_FALSE: CheckCircle2,
  ENUMERATE: ListChecks,
};

/** Light-theme difficulty chip styling (shown in the question bank only). */
export const difficultyColor: Record<Difficulty, string> = {
  EASY: "text-good-600 border-good-500/30 bg-good-50",
  MEDIUM: "text-teamA-700 border-teamA-500/30 bg-teamA-50",
  HARD: "text-bad-600 border-bad-500/30 bg-bad-50",
};
