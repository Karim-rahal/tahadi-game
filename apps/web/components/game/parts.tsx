"use client";

import clsx from "clsx";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
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

export function ReviewFlags({ q }: { q: JudgeQuestionDto }) {
  const { t } = useLang();
  if (!q.flaggedForReview && !q.acceptedAnswersIncomplete) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-line bg-surface2 p-3 text-sm text-ink-soft">
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-bad-500" />
      <div>
        <div className="font-semibold text-ink">{t("q.reviewTitle")}</div>
        <ul className="mt-1 list-disc space-y-0.5 pe-5">
          {q.flaggedForReview && <li>{t("q.reviewDraft")}</li>}
          {q.acceptedAnswersIncomplete && <li>{t("q.reviewIncomplete")}</li>}
          {q.reviewNotes && <li dir="rtl">{q.reviewNotes}</li>}
        </ul>
      </div>
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
  return (
    <p dir="rtl" className="text-right font-display text-[26px] font-bold leading-[1.45] text-ink sm:text-3xl">
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
          className={clsx("min-h-[64px] flex-col text-lg", side === "A" ? "btn-teamA" : "btn-teamB")}
        >
          <span className="truncate px-2">{side === "A" ? teamAName : teamBName}</span>
          <span className="text-xs font-medium opacity-85">{t("q.answeredCorrectly")}</span>
        </button>
      ))}
    </div>
  );
}
