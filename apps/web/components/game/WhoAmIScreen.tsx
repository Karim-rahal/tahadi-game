"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import type { ModeProps } from "./types";
import { useLang } from "@/lib/i18n";
import { AnswerReveal, QuestionMeta, QuestionText, ReviewFlags, TeamPickButtons } from "./parts";

export function WhoAmIScreen({ q, state, actions, busy }: ModeProps) {
  const { t } = useLang();
  const total = q.clues.length;
  const revealed = q.cluesRevealed;
  const visible = q.clues.slice(0, revealed);
  const moreClues = revealed < total;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <QuestionMeta q={q} />
      <div className="card-raised p-5">
        <QuestionText>{q.questionText}</QuestionText>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-medium text-ink-soft">{t("who.hintOf", { a: revealed, b: total })}</span>
          <span className="text-ink-muted">{t("who.noPenalty")}</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${(revealed / Math.max(total, 1)) * 100}%` }} />
        </div>
      </div>

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {visible.map((c, i) => (
            <motion.div
              key={c.order}
              initial={{ opacity: 0, x: 20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              className="card flex items-start gap-3 p-4"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-paper font-bold text-ink">{i + 1}</span>
              <p dir="rtl" className="pt-1 text-right text-lg leading-relaxed text-ink">{c.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <button className="btn-soft w-full" disabled={busy || !moreClues} onClick={() => actions.revealClue()}>
        <Lightbulb size={18} />
        {moreClues ? t("who.revealNext") : t("who.allRevealed")}
      </button>

      <ReviewFlags q={q} />
      <AnswerReveal answer={q.answerText} explanation={q.explanation} />

      <div>
        <div className="label">{t("who.whoGuessed")}</div>
        <TeamPickButtons
          teamAName={state.teams.A.name}
          teamBName={state.teams.B.name}
          disabled={busy}
          onPick={(team) => actions.answer(team, true, { cluesRevealed: revealed })}
        />
        <p className="mt-2 text-center text-xs text-ink-muted">{t("who.note")}</p>
      </div>
    </motion.div>
  );
}
