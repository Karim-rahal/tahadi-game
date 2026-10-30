"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { Check, X } from "lucide-react";
import type { ModeProps } from "./types";
import type { TeamSide } from "@/lib/types";
import { useLang } from "@/lib/i18n";
import { QuestionMeta, QuestionText } from "./parts";

export function TrueFalseScreen({ q, state, actions, busy }: ModeProps) {
  const { t } = useLang();
  const owner: TeamSide = q.ownerTeam ?? state.startingTeam;
  const ownerName = owner === "A" ? state.teams.A.name : state.teams.B.name;

  function submit(given: boolean) {
    if (busy) return;
    const correct = q.isTrue === given;
    // The value sent is always Arabic (صح/خطأ) to match the backend schema.
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
        <div className="text-sm text-ink-soft">{t("tf.belongsTo")}</div>
        <div className={clsx("mt-0.5 font-display text-2xl font-bold", owner === "A" ? "text-teamA-700" : "text-teamB-700")}>
          {ownerName}
        </div>
        <div className="mt-1 text-xs text-ink-muted">{t("tf.noInterrupt")}</div>
      </div>

      <div className="card-raised p-5">
        <QuestionText>{q.questionText}</QuestionText>
      </div>

      <div className="label">{t("tf.record")}</div>
      <div className="grid grid-cols-2 gap-3">
        <button disabled={busy} onClick={() => submit(true)} className="btn-good min-h-[72px] flex-col text-xl">
          <Check /> {t("tf.true")}
        </button>
        <button disabled={busy} onClick={() => submit(false)} className="btn-bad min-h-[72px] flex-col text-xl">
          <X /> {t("tf.false")}
        </button>
      </div>
      <p className="text-center text-xs text-ink-muted">{t("tf.note")}</p>
    </motion.div>
  );
}
