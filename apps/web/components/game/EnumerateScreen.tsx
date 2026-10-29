"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { Ban, Check, Eye, EyeOff, Forward, Plus } from "lucide-react";
import { useState } from "react";
import type { ModeProps } from "./types";
import type { TeamSide } from "@/lib/types";
import { QuestionMeta, QuestionText, ReviewFlags } from "./parts";

function StrikeDots({ used, max }: { used: number; max: number }) {
  return (
    <span className="inline-flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={clsx("size-2.5 rounded-full", i < used ? "bg-bad" : "bg-white/15")} />
      ))}
    </span>
  );
}

export function EnumerateScreen({ q, state, actions, busy }: ModeProps) {
  const active: TeamSide = q.enumActiveTeam ?? state.startingTeam;
  const activeName = active === "A" ? state.teams.A.name : state.teams.B.name;
  const st = q.enumState ?? { A: { strikes: 0, passesUsed: 0 }, B: { strikes: 0, passesUsed: 0 } };
  const maxStrikes = state.settings.enumerate.strikesPerTeam;
  const maxPasses = state.settings.enumerate.passesPerTeam;
  const remaining = q.acceptedAnswers.filter((a) => !a.used).length;
  const [hide, setHide] = useState(false);
  const [manual, setManual] = useState("");

  function teamCol(side: TeamSide) {
    return side === "A" ? "text-teamA-400" : "text-teamB-400";
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <QuestionMeta q={q} />
      <div className="panel-raised p-5">
        <QuestionText>{q.questionText}</QuestionText>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted">
          <span>المتبقّي في القائمة: <b className="text-slate-100">{remaining}</b></span>
          {q.minimumRequired != null && <span>الحد الأدنى: <b className="text-slate-100">{q.minimumRequired}</b></span>}
        </div>
      </div>

      {/* Per-team strike / pass status */}
      <div className="grid grid-cols-2 gap-3">
        {(["A", "B"] as TeamSide[]).map((side) => (
          <div key={side} className={clsx("panel p-3", active === side && "ring-2 ring-gold-400/70")}>
            <div className={clsx("truncate font-bold", teamCol(side))}>{side === "A" ? state.teams.A.name : state.teams.B.name}</div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted">
              <span>الأخطاء</span>
              <StrikeDots used={st[side].strikes} max={maxStrikes} />
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted">
              <span>التمريرات</span>
              <span className="tnum text-slate-200">{maxPasses - st[side].passesUsed}/{maxPasses}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={clsx("rounded-xl border p-3 text-center", active === "A" ? "border-teamA-500/50 bg-teamA-500/10" : "border-teamB-500/50 bg-teamB-500/10")}>
        <span className="text-sm text-muted">دور الإجابة الآن: </span>
        <span className={clsx("text-lg font-extrabold", teamCol(active))}>{activeName}</span>
      </div>

      <ReviewFlags q={q} />

      {/* Judge-private checklist */}
      <div className="panel p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-200">قائمة الإجابات المقبولة (للحكَم)</span>
          <button className="chip" onClick={() => setHide((h) => !h)}>
            {hide ? <Eye size={14} /> : <EyeOff size={14} />} {hide ? "إظهار" : "إخفاء"}
          </button>
        </div>
        {hide ? (
          <p className="py-6 text-center text-sm text-muted">القائمة مخفية — لحماية خصوصية الإجابات.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {q.acceptedAnswers.map((a) => (
              <button
                key={a.id}
                disabled={busy || a.used}
                onClick={() => actions.enumerateAnswer(active, { acceptedAnswerId: a.id })}
                className={clsx(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition",
                  a.used
                    ? a.usedByTeam === "A"
                      ? "border-teamA-500/40 bg-teamA-500/15 text-teamA-400 line-through"
                      : "border-teamB-500/40 bg-teamB-500/15 text-teamB-400 line-through"
                    : "border-white/10 bg-ink-800/70 text-slate-100 hover:border-gold-400/50 active:scale-95",
                )}
              >
                {a.text}
              </button>
            ))}
          </div>
        )}
        {/* Manual accept (answer judged valid but not in the list) */}
        <div className="mt-3 flex gap-2">
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="قبول يدوي لإجابة خارج القائمة…"
            className="input !py-2 !text-base"
          />
          <button
            className="btn-ghost shrink-0"
            disabled={busy || !manual.trim()}
            onClick={async () => {
              await actions.enumerateAnswer(active, { manualText: manual.trim() });
              setManual("");
            }}
          >
            <Plus size={16} /> قبول
          </button>
        </div>
      </div>

      {/* Round controls for the active team */}
      <div className="grid grid-cols-2 gap-3">
        <button className="btn-bad" disabled={busy || st[active].strikes >= maxStrikes} onClick={() => actions.strike(active)}>
          <Ban size={18} /> خطأ (ضربة)
        </button>
        <button className="btn-ghost" disabled={busy || st[active].passesUsed >= maxPasses} onClick={() => actions.pass(active)}>
          <Forward size={18} /> تمرير
        </button>
      </div>
      <button className="btn-gold w-full" disabled={busy} onClick={() => actions.next()}>
        <Check size={18} /> إنهاء الجولة والانتقال
      </button>
    </motion.div>
  );
}
