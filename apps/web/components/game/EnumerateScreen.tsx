"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { Ban, Eye, EyeOff, Forward, Plus } from "lucide-react";
import { useState } from "react";
import { ENUM_PASSES_PER_TEAM, ENUM_STRIKES_PER_TEAM } from "@darundi/shared";
import type { ModeProps } from "./types";
import type { TeamSide } from "@/lib/types";
import { useLang } from "@/lib/i18n";
import { QuestionMeta, QuestionText } from "./parts";

function StrikeDots({ used, max }: { used: number; max: number }) {
  return (
    <span className="inline-flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={clsx("size-3 rounded-full", i < used ? "bg-bad-500" : "bg-line")} />
      ))}
    </span>
  );
}

export function EnumerateScreen({ q, state, actions, busy }: ModeProps) {
  const { t } = useLang();
  const active: TeamSide = q.enumActiveTeam ?? state.startingTeam;
  const activeName = active === "A" ? state.teams.A.name : state.teams.B.name;
  const st = q.enumState ?? { A: { strikes: 0, passesUsed: 0 }, B: { strikes: 0, passesUsed: 0 } };
  const maxStrikes = ENUM_STRIKES_PER_TEAM;
  const maxPasses = ENUM_PASSES_PER_TEAM;
  const remaining = q.acceptedAnswers.filter((a) => !a.used).length;
  const [hide, setHide] = useState(false);
  const [manual, setManual] = useState("");
  const [search, setSearch] = useState("");

  const needle = search.trim().toLowerCase();
  const answers = needle
    ? q.acceptedAnswers.filter(
        (a) => a.text.toLowerCase().includes(needle) || a.aliases.some((al) => al.toLowerCase().includes(needle)),
      )
    : q.acceptedAnswers;
  const showSearch = q.acceptedAnswers.length > 10;

  const teamText = (side: TeamSide) => (side === "A" ? "text-teamA-700" : "text-teamB-700");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <QuestionMeta q={q} />
      <div className="card-raised p-5">
        <QuestionText>{q.questionText}</QuestionText>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-ink-soft">
          <span>{t("en.remaining")}: <b className="tnum text-ink">{remaining}</b></span>
          {q.minimumRequired != null && <span>{t("en.minimum")}: <b className="tnum text-ink">{q.minimumRequired}</b></span>}
        </div>
      </div>

      {/* Per-team strike / pass status */}
      <div className="grid grid-cols-2 gap-3">
        {(["A", "B"] as TeamSide[]).map((side) => {
          const used = st[side].passesUsed >= maxPasses;
          return (
            <div
              key={side}
              className={clsx(
                "rounded-2xl border p-3 transition",
                active === side
                  ? side === "A"
                    ? "border-teamA-500 bg-teamA-50"
                    : "border-teamB-500 bg-teamB-50"
                  : "border-line bg-surface",
              )}
            >
              <div className={clsx("break-words font-bold leading-tight", teamText(side))}>
                {side === "A" ? state.teams.A.name : state.teams.B.name}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-ink-soft">
                <span>{t("en.strikes")}</span>
                <StrikeDots used={st[side].strikes} max={maxStrikes} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-ink-soft">{t("en.pass")}</span>
                <span className={clsx("rounded-full px-2 py-0.5 font-semibold", used ? "bg-line text-ink-muted line-through" : "bg-good-50 text-good-600")}>
                  {used ? t("en.passUsed") : t("en.passAvail")}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className={clsx(
          "rounded-xl border p-3 text-center",
          active === "A" ? "border-teamA-500/40 bg-teamA-50" : "border-teamB-500/40 bg-teamB-50",
        )}
      >
        <span className="text-sm text-ink-soft">{t("en.turnNow")} </span>
        <span className={clsx("font-display text-lg font-bold", teamText(active))}>{activeName}</span>
      </div>


      {/* Judge-private checklist */}
      <div className="card p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-ink">{t("en.checklist")}</span>
          <button className="chip cursor-pointer" onClick={() => setHide((h) => !h)}>
            {hide ? <Eye size={14} /> : <EyeOff size={14} />} {hide ? t("en.show") : t("en.hide")}
          </button>
        </div>
        {hide ? (
          <p className="py-6 text-center text-sm text-ink-muted">{t("en.hidden")}</p>
        ) : (
          <>
            {showSearch && (
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("en.search")}
                className="input mb-2 !py-2 !text-base"
              />
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" dir="rtl">
              {answers.map((a) => (
                <button
                  key={a.id}
                  disabled={busy || a.used}
                  onClick={() => actions.enumerateAnswer(active, { acceptedAnswerId: a.id })}
                  className={clsx(
                    "flex flex-col rounded-lg border px-3 py-2 text-sm font-medium transition active:scale-95",
                    a.used
                      ? a.usedByTeam === "A"
                        ? "border-teamA-500/40 bg-teamA-50 text-teamA-700 line-through"
                        : "border-teamB-500/40 bg-teamB-50 text-teamB-700 line-through"
                      : "border-line bg-surface text-ink hover:border-ink/30",
                  )}
                >
                  <span>{a.text}</span>
                  {a.aliases.length > 0 && (
                    <span className="truncate text-[11px] font-normal text-ink-muted">{a.aliases.join(" · ")}</span>
                  )}
                </button>
              ))}
              {answers.length === 0 && (
                <p className="col-span-full py-4 text-center text-sm text-ink-muted">{t("en.noMatch")}</p>
              )}
            </div>
          </>
        )}
        {/* Manual accept (answer judged valid but not in the list) */}
        <div className="mt-3 flex gap-2">
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder={t("en.manualPlaceholder")}
            className="input !py-2 !text-base"
          />
          <button
            className="btn-soft shrink-0"
            disabled={busy || !manual.trim()}
            onClick={async () => {
              await actions.enumerateAnswer(active, { manualText: manual.trim() });
              setManual("");
            }}
          >
            <Plus size={16} /> {t("en.accept")}
          </button>
        </div>
      </div>

      {/* Round controls for the active team — ends automatically at 3 strikes
          or when every accepted answer is used. */}
      <div className="grid grid-cols-2 gap-3">
        <button className="btn-bad" disabled={busy || st[active].strikes >= maxStrikes} onClick={() => actions.strike(active)}>
          <Ban size={18} /> {t("en.strikeBtn")}
        </button>
        <button className="btn-soft" disabled={busy || st[active].passesUsed >= maxPasses} onClick={() => actions.pass(active)}>
          <Forward size={18} /> {t("en.passBtn")}
        </button>
      </div>
      <p className="text-center text-xs text-ink-muted">{t("en.note")}</p>
    </motion.div>
  );
}
