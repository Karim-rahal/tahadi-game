import type { Difficulty, MatchSelection, QuestionType, TeamSide } from "@darundi/shared";
import { ownerForTurnIndex } from "@darundi/shared";
import { prisma } from "../db";

export interface SelectedQuestion {
  questionId: string;
  type: QuestionType;
  difficulty: Difficulty;
  order: number;
  /** Only set for TRUE_FALSE (strict turn-based ownership). */
  ownerTeam: TeamSide | null;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/**
 * Build a match question plan. Randomizes within the configured categories,
 * types and difficulties; balances across the selected types via round-robin;
 * never repeats a question (all source questions are unique). Returns an
 * ordered plan with TRUE_FALSE ownership assigned deterministically.
 */
export async function buildMatchPlan(
  selection: MatchSelection,
  startingTeam: TeamSide,
): Promise<SelectedQuestion[]> {
  const candidates = await prisma.question.findMany({
    where: {
      categoryId: { in: selection.categoryIds },
      type: { in: selection.types },
      difficulty: { in: selection.difficulties },
      ...(selection.excludeDisabled ? { disabled: false } : {}),
      ...(selection.excludeFlaggedForReview ? { flaggedForReview: false } : {}),
    },
    select: { id: true, type: true, difficulty: true },
  });

  // Group by type, shuffle each bucket.
  const byType = new Map<QuestionType, { id: string; type: QuestionType; difficulty: Difficulty }[]>();
  for (const t of selection.types) byType.set(t, []);
  for (const c of candidates) {
    byType.get(c.type as QuestionType)?.push({ id: c.id, type: c.type as QuestionType, difficulty: c.difficulty as Difficulty });
  }
  for (const [t, list] of byType) byType.set(t, shuffle(list));

  // Round-robin across types until we reach totalQuestions or run out.
  const picked: { id: string; type: QuestionType; difficulty: Difficulty }[] = [];
  const order = shuffle(selection.types);
  let progress = true;
  while (picked.length < selection.totalQuestions && progress) {
    progress = false;
    for (const t of order) {
      if (picked.length >= selection.totalQuestions) break;
      const bucket = byType.get(t);
      if (bucket && bucket.length) {
        picked.push(bucket.pop()!);
        progress = true;
      }
    }
  }

  // Assign order + TRUE_FALSE ownership (k-th TF question alternates).
  let tfIndex = 0;
  return picked.map((p, i) => {
    let ownerTeam: TeamSide | null = null;
    if (p.type === "TRUE_FALSE") {
      ownerTeam = ownerForTurnIndex(startingTeam, tfIndex);
      tfIndex++;
    }
    return { questionId: p.id, type: p.type, difficulty: p.difficulty, order: i, ownerTeam };
  });
}
