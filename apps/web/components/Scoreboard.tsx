"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import type { GameState, TeamSide } from "@/lib/types";
import { useLang } from "@/lib/i18n";

function TeamSide_({
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
  const { t } = useLang();
  const isA = side === "A";
  return (
    <div
      className={clsx(
        "relative flex-1 px-3 py-3 text-center transition-colors",
        active ? (isA ? "bg-teamA-500 text-white" : "bg-teamB-500 text-white") : isA ? "bg-teamA-50" : "bg-teamB-50",
      )}
    >
      <div
        className={clsx(
          "truncate text-sm font-semibold",
          active ? "text-white/90" : isA ? "text-teamA-700" : "text-teamB-700",
        )}
      >
        {name}
      </div>
      <motion.div
        key={score}
        initial={{ scale: 1.3, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 18 }}
        className={clsx("tnum font-display text-4xl font-bold", active ? "text-white" : "text-ink")}
      >
        {score}
      </motion.div>
      {active && (
        <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/85">{t("sb.turn")}</div>
      )}
    </div>
  );
}

export function Scoreboard({ state, activeTeam }: { state: GameState; activeTeam?: TeamSide | null }) {
  return (
    <div className="flex items-stretch overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <TeamSide_ side="A" name={state.teams.A.name} score={state.teams.A.score} active={activeTeam === "A"} />
      <div className="grid w-11 shrink-0 place-items-center bg-ink font-display text-xs font-bold text-white/80">
        VS
      </div>
      <TeamSide_ side="B" name={state.teams.B.name} score={state.teams.B.score} active={activeTeam === "B"} />
    </div>
  );
}
