"use client";

import clsx from "clsx";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { JudgeQuestionDto, TeamSide } from "@/lib/types";
import { typeIcons } from "@/lib/labels";
import { useLang } from "@/lib/i18n";

export function QuestionMeta({ q }: { q: JudgeQuestionDto }) {
  const { t } = useLang();
  const Icon = typeIcons[q.type];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="chip border-ink/15 bg-ink text-white">
        <Icon size={14} /> {t(`type.${q.type}`)}
      </span>
      <span className="chip" dir="rtl">{q.categoryNameAr}</span>
      <span className="chip">{t("q.onePoint")}</span>
    </div>
  );
}

/** Judge-only reveal of the model answer. */
export function AnswerReveal({ answer, explanation }: { answer: string; explanation?: string | null }) {
  const { t } = useLang();
  const [shown, setShown] = useState(false);
  return (
    <div className="card p-3">
      <button onClick={() => setShown((s) => !s)} className="btn-soft w-full" aria-expanded={shown}>
        {shown ? <EyeOff size={18} /> : <Eye size={18} />}
        {shown ? t("q.hideAnswer") : t("q.revealAnswer")}
      </button>
      {shown && (
        <div className="mt-3 animate-fade-up rounded-xl bg-good-50 p-3" dir="rtl">
          <div className="text-sm font-medium text-ink-soft">{t("q.modelAnswer")}</div>
          <div className="mt-1 text-xl font-bold text-good-600">{answer}</div>
          {explanation && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{explanation}</p>}
        </div>
      )}
    </div>
  );
}

export function QuestionText({ children }: { children: React.ReactNode }) {
  // A pure math expression (digits + operators, no Arabic letters) must render
  // left-to-right and stay un-reordered inside the RTL layout.
  const isExpr = typeof children === "string" && /^[\d\s+\-−–×÷*/().=؟?%^٠-٩]+$/.test(children);
  return (
    <p
      dir={isExpr ? "ltr" : "rtl"}
      className={clsx(
        "font-display text-[26px] font-bold leading-[1.45] text-ink sm:text-3xl",
        isExpr ? "text-center" : "text-right",
      )}
    >
      {children}
    </p>
  );
}

/**
 * Pick the team that answered correctly — the only scoring control for
 * الأسرع يجاوب and من أنا؟. There is NO wrong-answer button.
 */
export function TeamPickButtons({
  teamAName,
  teamBName,
  onPick,
  disabled,
}: {
  teamAName: string;
  teamBName: string;
  onPick: (team: TeamSide) => void;
  disabled: boolean;
}) {
  const { t } = useLang();
  return (
    <div className="grid grid-cols-2 gap-3">
      {(["A", "B"] as TeamSide[]).map((side) => (
        <button
          key={side}
          disabled={disabled}
          onClick={() => onPick(side)}
          className={clsx("min-h-[64px] flex-col py-2 text-lg", side === "A" ? "btn-teamA" : "btn-teamB")}
        >
          <span className="line-clamp-2 break-words px-2 leading-tight">{side === "A" ? teamAName : teamBName}</span>
          <span className="text-xs font-medium opacity-85">{t("q.answeredCorrectly")}</span>
        </button>
      ))}
    </div>
  );
}
