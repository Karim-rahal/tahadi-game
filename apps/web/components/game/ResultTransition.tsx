"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { ChevronLeft, Loader2, Minus, SkipForward, Trophy } from "lucide-react";
import type { GameState, JudgeQuestionDto, TeamSide } from "@/lib/types";

interface Outcome {
  tone: "A" | "B" | "neutral";
  headline: string;
  sub: string | null;
  icon: "trophy" | "tie" | "skip";
}

function teamName(state: GameState, side: TeamSide) {
  return side === "A" ? state.teams.A.name : state.teams.B.name;
}

function enumReasonText(q: JudgeQuestionDto, state: GameState): string | null {
  const r = q.enumResolutionReason;
  if (!r) return null;
  switch (r) {
    case "THREE_STRIKES_A":
      return `بلغ ${teamName(state, "A")} ثلاثة أخطاء`;
    case "THREE_STRIKES_B":
      return `بلغ ${teamName(state, "B")} ثلاثة أخطاء`;
    case "FEWER_STRIKES_A":
    case "FEWER_STRIKES_B":
      return "أخطاء أقل";
    case "UNUSED_PASS_A":
    case "UNUSED_PASS_B":
      return "لم يستخدم التمرير";
    case "TIE":
      return "تعادل في الأخطاء والتمرير";
    default:
      return null;
  }
}

function outcomeOf(q: JudgeQuestionDto, state: GameState): Outcome {
  if (q.status === "SKIPPED") {
    return { tone: "neutral", headline: "تم تخطّي السؤال", sub: "بلا نقاط", icon: "skip" };
  }
  const winner = q.answeredByTeam;
  if (q.type === "ENUMERATE") {
    if (!winner) return { tone: "neutral", headline: "تعادل — لا نقطة", sub: enumReasonText(q, state), icon: "tie" };
    return { tone: winner, headline: `نقطة إلى ${teamName(state, winner)}`, sub: enumReasonText(q, state), icon: "trophy" };
  }
  // Fastest / Who am I / True-false.
  if (winner && q.pointsAwarded > 0) {
    const sub = q.type === "TRUE_FALSE" ? "إجابة صحيحة" : null;
    return { tone: winner, headline: `نقطة إلى ${teamName(state, winner)}`, sub, icon: "trophy" };
  }
  return { tone: "neutral", headline: "بلا نقطة", sub: q.type === "TRUE_FALSE" ? "إجابة غير صحيحة" : null, icon: "tie" };
}

export function ResultTransition({ q, state, last }: { q: JudgeQuestionDto; state: GameState; last: boolean }) {
  const o = outcomeOf(q, state);
  const Icon = o.icon === "trophy" ? Trophy : o.icon === "skip" ? SkipForward : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border p-8 text-center shadow-card",
        o.tone === "A" && "border-teamA-500/30 bg-teamA-50",
        o.tone === "B" && "border-teamB-500/30 bg-teamB-50",
        o.tone === "neutral" && "border-line bg-surface",
      )}
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        className={clsx(
          "grid size-20 place-items-center rounded-full text-white",
          o.tone === "A" && "bg-teamA-500",
          o.tone === "B" && "bg-teamB-500",
          o.tone === "neutral" && "bg-ink",
        )}
      >
        <Icon size={38} />
      </motion.div>

      <div>
        <div
          className={clsx(
            "font-display text-2xl font-bold",
            o.tone === "A" && "text-teamA-700",
            o.tone === "B" && "text-teamB-700",
            o.tone === "neutral" && "text-ink",
          )}
        >
          {o.headline}
        </div>
        {o.sub && <div className="mt-1 text-sm font-medium text-ink-soft">{o.sub}</div>}
      </div>

      <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted">
        {last ? (
          <>عرض النتيجة النهائية <ChevronLeft size={14} /></>
        ) : (
          <>
            <Loader2 size={14} className="animate-spin" /> الانتقال إلى السؤال التالي
          </>
        )}
      </div>
    </motion.div>
  );
}
