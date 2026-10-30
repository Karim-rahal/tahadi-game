"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { Check, X } from "lucide-react";
import type { ModeProps } from "./types";
import type { TeamSide } from "@/lib/types";
import { QuestionMeta, QuestionText, ReviewFlags } from "./parts";

export function TrueFalseScreen({ q, state, actions, busy }: ModeProps) {
  const owner: TeamSide = q.ownerTeam ?? state.startingTeam;
  const ownerName = owner === "A" ? state.teams.A.name : state.teams.B.name;

  function submit(given: boolean) {
    if (busy) return;
    const correct = q.isTrue === given;
    void actions.answer(owner, correct, { givenAnswer: given ? "صح" : "خطأ" });
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <QuestionMeta q={q} />

      <div
        className={clsx(
          "rounded-2xl border p-4 text-center",
          owner === "A" ? "border-teamA-500/30 bg-teamA-50" : "border-teamB-500/30 bg-teamB-50",
        )}
      >
        <div className="text-sm text-ink-soft">هذا السؤال من نصيب</div>
        <div className={clsx("mt-0.5 font-display text-2xl font-bold", owner === "A" ? "text-teamA-700" : "text-teamB-700")}>
          {ownerName}
        </div>
        <div className="mt-1 text-xs text-ink-muted">الفريق الآخر لا يستطيع المقاطعة</div>
      </div>

      <div className="card-raised p-5">
        <QuestionText>{q.questionText}</QuestionText>
      </div>
      <ReviewFlags q={q} />

      <div className="label">سجّل إجابة الفريق الشفهية:</div>
      <div className="grid grid-cols-2 gap-3">
        <button disabled={busy} onClick={() => submit(true)} className="btn-good min-h-[72px] flex-col text-xl">
          <Check /> صح
        </button>
        <button disabled={busy} onClick={() => submit(false)} className="btn-bad min-h-[72px] flex-col text-xl">
          <X /> خطأ
        </button>
      </div>
      <p className="text-center text-xs text-ink-muted">إجابة صحيحة = نقطة · إجابة خاطئة = لا نقطة — ثم ينتقل تلقائياً.</p>
    </motion.div>
  );
}
