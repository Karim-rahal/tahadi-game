"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Play, Trash2, Inbox } from "lucide-react";
import { listGameHints, removeGameHint, type GameHint } from "@/lib/store";
import { useLang } from "@/lib/i18n";
import { Logo } from "@/components/Logo";
import { LangToggle } from "@/components/LangToggle";

export default function GamesPage() {
  const { t } = useLang();
  const [hints, setHints] = useState<GameHint[]>([]);

  useEffect(() => setHints(listGameHints()), []);

  function remove(id: string) {
    removeGameHint(id);
    setHints(listGameHints());
  }

  return (
    <main className="pt-safe pb-page mx-auto max-w-2xl px-5">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="grid size-10 place-items-center rounded-xl border border-line bg-surface text-ink-soft hover:text-ink" aria-label={t("common.back")}>
          <ChevronLeft size={20} className="rtl:rotate-180" />
        </Link>
        <Logo size={34} withText={false} />
        <LangToggle />
      </div>

      <h1 className="font-display text-3xl font-bold text-ink">{t("saved.title")}</h1>
      <p className="mt-1 text-ink-soft">{t("saved.subtitle")}</p>

      {hints.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center gap-3 p-10 text-center text-ink-muted">
          <Inbox size={36} />
          <p>{t("saved.empty")}</p>
          <Link href="/setup" className="btn-primary mt-2">{t("home.newMatch")}</Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {hints.map((h) => (
            <li key={h.gameId} className="card flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="truncate font-bold text-ink">
                  <span className="text-teamA-700">{h.teamA}</span>
                  <span className="mx-1 text-ink-muted">{t("saved.vs")}</span>
                  <span className="text-teamB-700">{h.teamB}</span>
                </div>
                <div className="text-xs text-ink-muted">{new Date(h.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link href={`/game/${h.gameId}`} className="btn-primary !min-h-0 !px-3 !py-2 text-sm"><Play size={16} /> {t("saved.resumeBtn")}</Link>
                <button onClick={() => remove(h.gameId)} className="btn-soft !min-h-0 !px-3 !py-2" aria-label="delete"><Trash2 size={16} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-xs text-ink-muted">{t("saved.note")}</p>
    </main>
  );
}
