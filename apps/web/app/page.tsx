"use client";

import Link from "next/link";
import { Play, RotateCcw, BookOpen, Landmark, Globe2, Swords } from "lucide-react";
import { QUESTION_TYPES } from "@darundi/shared";
import { Logo } from "@/components/Logo";
import { LangToggle } from "@/components/LangToggle";
import { typeIcons } from "@/lib/labels";
import { useLang } from "@/lib/i18n";

export default function HomePage() {
  const { t } = useLang();
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 py-7">
      <header className="flex items-center justify-between">
        <Logo size={44} />
        <LangToggle />
      </header>

      <section className="flex flex-1 flex-col items-center justify-center py-8 text-center">
        <h1 className="font-display text-5xl font-bold leading-[1.1] text-ink sm:text-6xl" dir="rtl">
          تحدي{" "}
          <span className="bg-gradient-to-l from-teamA-500 to-teamB-500 bg-clip-text text-transparent">الدروندي</span>
        </h1>

        {/* The duel — the signature motif: two teams meeting across a seam. */}
        <div className="mt-7 flex w-full max-w-sm items-stretch justify-center gap-0 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <div className="flex-1 bg-teamA-50 py-4 text-teamA-700">
            <div className="text-xs font-semibold opacity-80">{t("common.team1")}</div>
            <div className="font-display text-2xl font-bold">A</div>
          </div>
          <div className="relative grid w-14 shrink-0 place-items-center bg-ink text-white">
            <Swords size={20} />
          </div>
          <div className="flex-1 bg-teamB-50 py-4 text-teamB-700">
            <div className="text-xs font-semibold opacity-80">{t("common.team2")}</div>
            <div className="font-display text-2xl font-bold">B</div>
          </div>
        </div>

        <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft">{t("home.intro")}</p>

        <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
          <Link href="/setup" className="btn-primary text-lg">
            <Play size={20} /> {t("home.newMatch")}
          </Link>
          <div className="flex gap-3">
            <Link href="/games" className="btn-soft flex-1">
              <RotateCcw size={18} /> {t("home.resume")}
            </Link>
            <Link href="/questions" className="btn-soft flex-1">
              <BookOpen size={18} /> {t("home.bank")}
            </Link>
          </div>
        </div>
      </section>

      {/* Four question modes */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUESTION_TYPES.map((type) => {
          const Icon = typeIcons[type];
          return (
            <div key={type} className="card flex flex-col items-center gap-2 p-4 text-center">
              <span className="grid size-10 place-items-center rounded-xl bg-paper text-ink">
                <Icon size={20} />
              </span>
              <div className="text-sm font-semibold text-ink">{t(`type.${type}`)}</div>
            </div>
          );
        })}
      </section>

      {/* Banks */}
      <section className="mt-3 grid grid-cols-2 gap-3">
        <div className="card flex items-center gap-3 p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-teamA-50 text-teamA-600">
            <Landmark size={20} />
          </span>
          <div>
            <div className="font-semibold text-ink">{t("home.bankReligious")}</div>
            <div className="text-xs text-ink-muted">{t("home.count600")}</div>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-teamB-50 text-teamB-600">
            <Globe2 size={20} />
          </span>
          <div>
            <div className="font-semibold text-ink">{t("home.bankGeography")}</div>
            <div className="text-xs text-ink-muted">{t("home.count600")}</div>
          </div>
        </div>
      </section>

      <footer className="mt-8 text-center text-xs text-ink-muted">
        {QUESTION_TYPES.map((type) => t(`type.${type}`)).join("  ·  ")}
      </footer>
    </main>
  );
}
