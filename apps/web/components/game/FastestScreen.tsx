"use client";

import { motion } from "framer-motion";
import type { ModeProps } from "./types";
import { useLang } from "@/lib/i18n";
import { AnswerReveal, QuestionMeta, QuestionText, TeamPickButtons } from "./parts";

export function FastestScreen({ q, state, actions, busy }: ModeProps) {
  const { t } = useLang();
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <QuestionMeta q={q} />
      <div className="card-raised p-5">
        <div className="mb-2 text-sm font-medium text-ink-soft">{t("fast.readAloud")}</div>
        <QuestionText>{q.questionText}</QuestionText>
      </div>
      <AnswerReveal answer={q.answerText} explanation={q.explanation} />
      <div>
        <div className="label">{t("fast.whoFirst")}</div>
        <TeamPickButtons
          teamAName={state.teams.A.name}
          teamBName={state.teams.B.name}
          disabled={busy}
          onPick={(team) => actions.answer(team, true)}
        />
        <p className="mt-2 text-center text-xs text-ink-muted">{t("fast.noneHint")}</p>
      </div>
    </motion.div>
  );
}
