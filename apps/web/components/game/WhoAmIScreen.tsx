"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import type { ModeProps } from "./types";
import { AnswerReveal, QuestionMeta, QuestionText, ReviewFlags, TeamJudgeButtons } from "./parts";

export function WhoAmIScreen({ q, state, actions, busy }: ModeProps) {
  const answered = state.progress[state.currentIndex]?.status === "ANSWERED";
  const total = q.clues.length;
  const revealed = q.cluesRevealed;
  const visible = q.clues.slice(0, revealed);
  const moreClues = revealed < total;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <QuestionMeta q={q} />
      <div className="panel-raised p-5">
        <QuestionText>{q.questionText}</QuestionText>
        <div className="mt-2 flex items-center justify-between text-sm text-muted">
          <span>تلميح {revealed} من {total}</span>
          <span className="text-gold-300">كلما قلّت التلميحات زادت النقاط</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-l from-gold-300 to-gold-500 transition-all" style={{ width: `${(revealed / Math.max(total, 1)) * 100}%` }} />
        </div>
      </div>

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {visible.map((c, i) => (
            <motion.div
              key={c.order}
              initial={{ opacity: 0, x: 20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              className="panel flex items-start gap-3 p-4"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gold-400/15 font-bold text-gold-300">
                {i + 1}
              </span>
              <p className="pt-1 text-lg leading-relaxed text-slate-100">{c.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <button className="btn-gold w-full" disabled={busy || !moreClues || answered} onClick={() => actions.revealClue()}>
        <Lightbulb size={18} />
        {moreClues ? "كشف التلميح التالي" : "تم كشف كل التلميحات"}
      </button>

      <ReviewFlags q={q} />
      <AnswerReveal answer={q.answerText} explanation={q.explanation} />

      <div>
        <div className="label">من حاول الإجابة؟</div>
        <TeamJudgeButtons
          teamAName={state.teams.A.name}
          teamBName={state.teams.B.name}
          disabled={busy || answered}
          onJudge={(team, correct) => actions.answer(team, correct, { cluesRevealed: revealed })}
        />
      </div>
    </motion.div>
  );
}
