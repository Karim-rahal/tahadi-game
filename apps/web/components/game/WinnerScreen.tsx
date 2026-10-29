"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Trophy, RotateCcw, Home } from "lucide-react";
import clsx from "clsx";
import type { GameState, TeamSide } from "@/lib/types";

export function WinnerScreen({ state }: { state: GameState }) {
  const { winner, isTie, teams } = state;
  const winnerName = winner ? (winner === "A" ? teams.A.name : teams.B.name) : null;

  function col(side: TeamSide) {
    return side === "A" ? "text-teamA-400" : "text-teamB-400";
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-6 py-8 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 14 }}
        className="grid size-28 place-items-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 shadow-glow"
      >
        <Trophy size={56} className="text-ink-900" />
      </motion.div>

      {isTie ? (
        <h1 className="font-display text-4xl font-extrabold text-gold-300">تعادل!</h1>
      ) : (
        <div>
          <div className="text-lg text-muted">الفريق الفائز</div>
          <motion.h1
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={clsx("font-display text-5xl font-extrabold", winner ? col(winner) : "")}
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
              winner === side ? "border-gold-400/60 bg-gold-400/10" : "border-white/10 bg-ink-700/60",
            )}
          >
            <div className={clsx("truncate font-bold", col(side))}>{side === "A" ? teams.A.name : teams.B.name}</div>
            <div className="tnum mt-1 font-display text-4xl font-extrabold">{side === "A" ? teams.A.score : teams.B.score}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/setup" className="btn-gold">
          <RotateCcw size={18} /> مباراة جديدة
        </Link>
        <Link href="/" className="btn-ghost">
          <Home size={18} /> الرئيسية
        </Link>
      </div>
    </div>
  );
}
