"use client";

import clsx from "clsx";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { JudgeQuestionDto, TeamSide } from "@/lib/types";
import { difficultyColor, difficultyLabel, typeIcon, typeLabel } from "@/lib/labels";

export function QuestionMeta({ q }: { q: JudgeQuestionDto }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="chip !text-gold-300">
        {typeIcon[q.type]} {typeLabel(q.type)}
      </span>
      <span className={clsx("chip border", difficultyColor[q.difficulty])}>{difficultyLabel(q.difficulty)}</span>
      <span className="chip">{q.categoryNameAr}</span>
      <span className="chip !text-gold-300">النقاط المتاحة: {q.pointsAvailable}</span>
    </div>
  );
}

export function ReviewFlags({ q }: { q: JudgeQuestionDto }) {
  if (!q.flaggedForReview && !q.acceptedAnswersIncomplete) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-gold-400/30 bg-gold-400/10 p-3 text-sm text-gold-200">
      <AlertTriangle size={18} className="mt-0.5 shrink-0" />
      <div>
        <div className="font-semibold">تنبيه مراجعة</div>
        <ul className="mt-1 list-disc space-y-0.5 pe-5 text-gold-100/90">
          {q.flaggedForReview && <li>سؤال من مسودة لم تُدقّق مصادرها فردياً — يمكنك تخطّيه أو الإبلاغ عنه.</li>}
          {q.acceptedAnswersIncomplete && <li>قائمة الإجابات قد تكون غير مكتملة؛ لا تعدّها نهائية.</li>}
          {q.reviewNotes && <li className="text-gold-100/70">{q.reviewNotes}</li>}
        </ul>
      </div>
    </div>
  );
}

/** Judge-only reveal of the model answer (never shown to players by default). */
export function AnswerReveal({ answer, explanation }: { answer: string; explanation?: string | null }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-ink-800/60 p-3">
      <button onClick={() => setShown((s) => !s)} className="btn-ghost w-full" aria-expanded={shown}>
        {shown ? <EyeOff size={18} /> : <Eye size={18} />}
        {shown ? "إخفاء الإجابة" : "كشف الإجابة (للحكَم)"}
      </button>
      {shown && (
        <div className="mt-3 animate-fade-up">
          <div className="text-sm text-muted">الإجابة النموذجية</div>
          <div className="mt-1 text-xl font-bold text-good">{answer}</div>
          {explanation && <p className="mt-2 text-sm leading-relaxed text-slate-300">{explanation}</p>}
        </div>
      )}
    </div>
  );
}

export function TeamJudgeButtons({
  teamAName,
  teamBName,
  onJudge,
  disabled,
}: {
  teamAName: string;
  teamBName: string;
  onJudge: (team: TeamSide, correct: boolean) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {(["A", "B"] as TeamSide[]).map((side) => (
        <div key={side} className="panel p-3">
          <div className={clsx("mb-2 truncate text-center font-bold", side === "A" ? "text-teamA-400" : "text-teamB-400")}>
            {side === "A" ? teamAName : teamBName}
          </div>
          <div className="flex gap-2">
            <button disabled={disabled} className="btn-good flex-1" onClick={() => onJudge(side, true)}>
              صحيح
            </button>
            <button disabled={disabled} className="btn-bad flex-1" onClick={() => onJudge(side, false)}>
              خطأ
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function QuestionText({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display text-2xl font-bold leading-relaxed text-slate-50 sm:text-3xl">{children}</p>
  );
}
