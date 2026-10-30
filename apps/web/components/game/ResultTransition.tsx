"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { ChevronLeft, Loader2, Minus, SkipForward, Swords, Trophy } from "lucide-react";
import type { GameState, JudgeQuestionDto, TeamSide } from "@/lib/types";
import { useLang } from "@/lib/i18n";

type TFn = (key: string, vars?: Record<string, string | number>) => string;

interface Outcome {
  tone: "A" | "B" | "neutral";
  headline: string;
  sub: string | null;
  icon: "trophy" | "tie" | "skip";
}

function teamName(state: GameState, side: TeamSide) {
  return side === "A" ? state.teams.A.name : state.teams.B.name;
}

function enumReasonText(q: JudgeQuestionDto, t: TFn): string | null {
  switch (q.enumResolutionReason) {
    case "THREE_STRIKES_A":
    case "THREE_STRIKES_B":
      return t("res.reason.threeStrikes");
    case "FEWER_STRIKES_A":
    case "FEWER_STRIKES_B":
      return t("res.reason.fewerStrikes");
    case "UNUSED_PASS_A":
    case "UNUSED_PASS_B":
      return t("res.reason.unusedPass");
    case "TIE":
      return t("res.reason.tie");
    default:
      return null;
  }
}

function outcomeOf(q: JudgeQuestionDto, state: GameState, t: TFn): Outcome {
  if (q.status === "SKIPPED") {
    return { tone: "neutral", headline: t("res.skipped"), sub: t("res.replacement"), icon: "skip" };
  }
  const winner = q.answeredByTeam;
  if (q.type === "ENUMERATE") {
    if (!winner) return { tone: "neutral", headline: t("res.tieNoPoint"), sub: enumReasonText(q, t), icon: "tie" };
    return { tone: winner, headline: t("res.pointTo", { team: teamName(state, winner) }), sub: enumReasonText(q, t), icon: "trophy" };
  }
  if (winner && q.pointsAwarded > 0) {
    const sub = q.type === "TRUE_FALSE" ? t("res.correct") : null;
    return { tone: winner, headline: t("res.pointTo", { team: teamName(state, winner) }), sub, icon: "trophy" };
  }
  return { tone: "neutral", headline: t("res.noPoint"), sub: q.type === "TRUE_FALSE" ? t("res.wrong") : null, icon: "tie" };
}

export function ResultTransition({
  q,
  state,
  last,
  tiebreakNext,
}: {
  q: JudgeQuestionDto;
  state: GameState;
  last: boolean;
  tiebreakNext?: boolean;
}) {
  const { t } = useLang();
  const o = outcomeOf(q, state, t);
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
        {tiebreakNext ? (
          <><Swords size={14} /> {t("res.tieNext")}</>
        ) : last ? (
          <>{t("res.toFinal")} <ChevronLeft size={14} className="rtl:rotate-180" /></>
        ) : (
          <>
            <Loader2 size={14} className="animate-spin" /> {t("res.toNext")}
          </>
        )}
      </div>
    </motion.div>
  );
}
