"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Trophy, RotateCcw, Home, Handshake } from "lucide-react";
import clsx from "clsx";
import type { GameState, TeamSide } from "@/lib/types";
import { useLang } from "@/lib/i18n";

export function WinnerScreen({ state }: { state: GameState }) {
  const { t } = useLang();
  const { winner, isTie, teams } = state;
  const winnerName = winner ? (winner === "A" ? teams.A.name : teams.B.name) : null;
  const col = (side: TeamSide) => (side === "A" ? "text-teamA-700" : "text-teamB-700");

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-6 py-8 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className={clsx(
          "grid size-28 place-items-center rounded-full text-white shadow-pop",
          isTie ? "bg-ink" : winner === "A" ? "bg-teamA-500" : "bg-teamB-500",
        )}
      >
        {isTie ? <Handshake size={54} /> : <Trophy size={54} />}
      </motion.div>

      {isTie ? (
        <h1 className="font-display text-4xl font-bold text-ink">{t("win.tie")}</h1>
      ) : (
        <div>
          <div className="text-ink-soft">{t("win.winner")}</div>
          <motion.h1
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={clsx("font-display text-5xl font-bold", winner ? col(winner) : "")}
          >
            {winnerName}
          </motion.h1>
        </div>
      )}

      <div className="flex w-full max-w-md gap-3">
        {(["A", "B"] as TeamSide[]).map((side) => (
          <div
            key={side}
            className={clsx(
              "flex-1 rounded-2xl border p-4",
              winner === side
                ? side === "A"
                  ? "border-teamA-500 bg-teamA-50"
                  : "border-teamB-500 bg-teamB-50"
                : "border-line bg-surface",
            )}
          >
            <div className={clsx("break-words font-bold leading-tight", col(side))}>{side === "A" ? teams.A.name : teams.B.name}</div>
            <div className="tnum mt-1 font-display text-4xl font-bold text-ink">{side === "A" ? teams.A.score : teams.B.score}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/setup" className="btn-primary">
          <RotateCcw size={18} /> {t("win.newMatch")}
        </Link>
        <Link href="/" className="btn-soft">
          <Home size={18} /> {t("common.home")}
        </Link>
      </div>
    </div>
  );
}
