"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import type { GameState, TeamSide } from "@/lib/types";

function TeamCard({
  side,
  name,
  score,
  active,
}: {
  side: TeamSide;
  name: string;
  score: number;
  active: boolean;
}) {
  const isA = side === "A";
  return (
    <div
      className={clsx(
        "relative flex-1 overflow-hidden rounded-2xl border px-4 py-3 transition",
        isA ? "border-teamA-500/40" : "border-teamB-500/40",
        active ? "ring-2 ring-gold-400/70" : "ring-0",
      )}
      style={{
        background: isA
          ? "linear-gradient(135deg, rgba(43,168,232,0.18), rgba(15,21,39,0.6))"
          : "linear-gradient(135deg, rgba(242,86,127,0.18), rgba(15,21,39,0.6))",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={clsx("text-sm font-bold", isA ? "text-teamA-400" : "text-teamB-400")}>
          {side === "A" ? "الفريق أ" : "الفريق ب"}
        </span>
        {active && <span className="chip !py-0.5 !px-2 text-xs !text-gold-300">دوره الآن</span>}
      </div>
      <div className="mt-0.5 truncate text-lg font-extrabold text-slate-50">{name}</div>
      <motion.div
        key={score}
        initial={{ scale: 1.25, opacity: 0.4 }}
        animate={{ scale: 1, opacity: 1 }}
        className="tnum mt-1 font-display text-4xl font-extrabold text-slate-50"
      >
        {score}
      </motion.div>
    </div>
  );
}

export function Scoreboard({ state, activeTeam }: { state: GameState; activeTeam?: TeamSide | null }) {
  return (
    <div className="flex gap-3">
      <TeamCard side="A" name={state.teams.A.name} score={state.teams.A.score} active={activeTeam === "A"} />
      <TeamCard side="B" name={state.teams.B.name} score={state.teams.B.score} active={activeTeam === "B"} />
    </div>
  );
}
