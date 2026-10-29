"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { Check, X } from "lucide-react";
import { useState } from "react";
import type { ModeProps } from "./types";
import type { TeamSide } from "@/lib/types";
import { QuestionMeta, QuestionText, ReviewFlags } from "./parts";

export function TrueFalseScreen({ q, state, actions, busy }: ModeProps) {
  const owner: TeamSide = q.ownerTeam ?? state.startingTeam;
  const ownerName = owner === "A" ? state.teams.A.name : state.teams.B.name;
  const answered = state.progress[state.currentIndex]?.status === "ANSWERED";
  const [choice, setChoice] = useState<null | boolean>(null);

  async function submit(given: boolean) {
    if (busy || answered) return;
    setChoice(given);
    const correct = q.isTrue === given;
    await actions.answer(owner, correct, { givenAnswer: given ? "صح" : "خطأ" });
  }

  const correctValue = q.isTrue;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <QuestionMeta q={q} />

      <div
        className={clsx(
          "rounded-2xl border p-4 text-center",
          owner === "A" ? "border-teamA-500/50 bg-teamA-500/10" : "border-teamB-500/50 bg-teamB-500/10",
        )}
      >
        <div className="text-sm text-muted">هذا السؤال من نصيب</div>
        <div className={clsx("mt-0.5 text-2xl font-extrabold", owner === "A" ? "text-teamA-400" : "text-teamB-400")}>
          {ownerName}
        </div>
        <div className="mt-1 text-xs text-muted">الفريق الآخر لا يستطيع المقاطعة</div>
      </div>

      <div className="panel-raised p-5">
        <QuestionText>{q.questionText}</QuestionText>
      </div>
      <ReviewFlags q={q} />

      <div className="label">سجّل إجابة الفريق الشفهية:</div>
      <div className="grid grid-cols-2 gap-3">
        <button
          disabled={busy || answered}
          onClick={() => submit(true)}
          className={clsx(
            "btn min-h-[72px] flex-col text-xl",
            "bg-good/90 text-ink-900 hover:bg-good",
            answered && correctValue === true && "ring-4 ring-good",
          )}
        >
          <Check /> صح
        </button>
        <button
          disabled={busy || answered}
          onClick={() => submit(false)}
          className={clsx(
            "btn min-h-[72px] flex-col text-xl",
            "bg-bad/90 text-ink-900 hover:bg-bad",
            answered && correctValue === false && "ring-4 ring-bad",
          )}
        >
          <X /> خطأ
        </button>
      </div>

      {answered && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel p-4 text-center">
          <div className="text-lg font-bold">
            {choice === correctValue ? (
              <span className="text-good">إجابة صحيحة ✓</span>
            ) : (
              <span className="text-bad">إجابة غير صحيحة ✗</span>
            )}
          </div>
          <div className="mt-1 text-sm text-muted">
            الإجابة الصحيحة: <span className="font-bold text-slate-100">{correctValue ? "صح" : "خطأ"}</span>
          </div>
          {q.explanation && <p className="mt-2 text-sm leading-relaxed text-slate-300">{q.explanation}</p>}
        </motion.div>
      )}
    </motion.div>
  );
}
