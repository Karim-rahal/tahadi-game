"use client";

import { motion } from "framer-motion";
import type { ModeProps } from "./types";
import { AnswerReveal, QuestionMeta, QuestionText, ReviewFlags, TeamJudgeButtons } from "./parts";

export function FastestScreen({ q, state, actions, busy }: ModeProps) {
  const answered = state.progress[state.currentIndex]?.status === "ANSWERED";
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <QuestionMeta q={q} />
      <div className="panel-raised p-5">
        <div className="mb-2 text-sm text-muted">يقرأ الحكَم السؤال، وأول فريق يجيب يُحكَم له:</div>
        <QuestionText>{q.questionText}</QuestionText>
      </div>
      <ReviewFlags q={q} />
      <AnswerReveal answer={q.answerText} explanation={q.explanation} />
      <div>
        <div className="label">من أجاب أولاً وبشكل صحيح؟</div>
        <TeamJudgeButtons
          teamAName={state.teams.A.name}
          teamBName={state.teams.B.name}
          disabled={busy || answered}
          onJudge={(team, correct) => actions.answer(team, correct)}
        />
      </div>
      {answered && <div className="text-center text-sm text-good">تم التسجيل — اضغط «السؤال التالي».</div>}
    </motion.div>
  );
}
