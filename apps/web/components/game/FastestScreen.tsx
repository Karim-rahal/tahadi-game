"use client";

import { motion } from "framer-motion";
import type { ModeProps } from "./types";
import { AnswerReveal, QuestionMeta, QuestionText, ReviewFlags, TeamPickButtons } from "./parts";

export function FastestScreen({ q, state, actions, busy }: ModeProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <QuestionMeta q={q} />
      <div className="card-raised p-5">
        <div className="mb-2 text-sm font-medium text-ink-soft">يقرأ الحكَم السؤال، وأول فريق يجيب صحيحاً يأخذ النقطة:</div>
        <QuestionText>{q.questionText}</QuestionText>
      </div>
      <ReviewFlags q={q} />
      <AnswerReveal answer={q.answerText} explanation={q.explanation} />
      <div>
        <div className="label">من أجاب أولاً وبشكل صحيح؟</div>
        <TeamPickButtons
          teamAName={state.teams.A.name}
          teamBName={state.teams.B.name}
          disabled={busy}
          onPick={(team) => actions.answer(team, true)}
        />
        <p className="mt-2 text-center text-xs text-ink-muted">لم يُجب أحد إجابة صحيحة؟ استخدم «تخطّي».</p>
      </div>
    </motion.div>
  );
}
