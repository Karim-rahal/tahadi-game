"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { ChevronLeft, Loader2, Minus, Plus, Rocket, Zap } from "lucide-react";
import { QUESTION_TYPES, type CategoryDto, type QuestionType, type TeamSide } from "@darundi/shared";
import { api, ApiError } from "@/lib/api";
import { saveGameHint } from "@/lib/store";
import { typeIcons } from "@/lib/labels";
import { useLang } from "@/lib/i18n";
import { Logo } from "@/components/Logo";
import { LangToggle } from "@/components/LangToggle";
import { Disclaimer } from "@/components/Disclaimer";
import type { CreateGameResult, GameState } from "@/lib/types";

const DEFAULT_COUNT = 20;

function Choice({
  active,
  onClick,
  children,
  tone = "neutral",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "neutral" | "A" | "B";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-center text-sm font-semibold leading-tight transition",
        !active && "border-line bg-surface text-ink-soft hover:border-ink/20",
        active && tone === "neutral" && "border-ink bg-ink text-white",
        active && tone === "A" && "border-teamA-500 bg-teamA-50 text-teamA-700",
        active && tone === "B" && "border-teamB-500 bg-teamB-50 text-teamB-700",
      )}
    >
      {children}
    </button>
  );
}

export default function SetupPage() {
  const router = useRouter();
  const { t } = useLang();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [teamA, setTeamA] = useState(t("common.team1"));
  const [teamB, setTeamB] = useState(t("common.team2"));
  const [catIds, setCatIds] = useState<string[]>([]);
  const [types, setTypes] = useState<QuestionType[]>([...QUESTION_TYPES]);
  const [startingTeam, setStartingTeam] = useState<TeamSide>("A");
  const [count, setCount] = useState<string>(String(DEFAULT_COUNT));
  const [pool, setPool] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Synchronous single-flight guard: `submitting` state is stale within a
  // double-tap's first render, so a ref stops a second /games POST (which would
  // create a duplicate match) before React disables the button.
  const startingRef = useRef(false);

  useEffect(() => {
    api<CategoryDto[]>("/categories")
      .then((c) => {
        setCategories(c);
        setCatIds(c.map((x) => x.id));
      })
      .catch(() => setError(t("setup.errCats")))
      .finally(() => setLoadingCats(false));
  }, [t]);

  const refreshPool = useCallback(async () => {
    if (catIds.length === 0 || types.length === 0) {
      setPool(0);
      return;
    }
    try {
      const res = await api<{ count: number }>("/games/pool-count", {
        method: "POST",
        body: { categoryIds: catIds, types },
      });
      setPool(res.count);
    } catch {
      setPool(null);
    }
  }, [catIds, types]);

  useEffect(() => {
    const id = setTimeout(refreshPool, 200);
    return () => clearTimeout(id);
  }, [refreshPool]);

  const toggle = <T,>(list: T[], v: T, set: (x: T[]) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const n = Number.parseInt(count, 10);
  const max = pool ?? 0;
  const countError = useMemo(() => {
    if (count.trim() === "" || Number.isNaN(n)) return t("setup.errEnterCount");
    if (n < 1) return t("setup.errMin");
    if (pool !== null && n > max) return max === 0 ? t("setup.errNone") : t("setup.errMax", { n: max });
    return null;
  }, [count, n, max, pool, t]);

  const clamp = (v: number) => Math.max(1, pool ? Math.min(pool, v) : v);

  async function start(quick: boolean) {
    if (startingRef.current) return;
    setError(null);
    const useCatIds = quick ? categories.map((c) => c.id) : catIds;
    const useTypes = quick ? [...QUESTION_TYPES] : types;
    if (useCatIds.length === 0) return setError(t("setup.errPickCat"));
    if (useTypes.length === 0) return setError(t("setup.errPickType"));
    const total = quick ? Math.min(DEFAULT_COUNT, max || DEFAULT_COUNT) : n;
    if (!quick && countError) return setError(countError);

    startingRef.current = true;
    setSubmitting(true);
    try {
      const res = await api<CreateGameResult>("/games", {
        method: "POST",
        body: {
          teamAName: teamA.trim() || t("common.team1"),
          teamBName: teamB.trim() || t("common.team2"),
          selection: {
            categoryIds: useCatIds,
            types: useTypes,
            totalQuestions: Math.max(1, total),
            excludeDisabled: true,
          },
          settings: { startingTeam },
        },
      });
      saveGameHint({ gameId: res.gameId, token: res.resumeToken, teamA, teamB, createdAt: new Date().toISOString() });
      await api<GameState>(`/games/${res.gameId}/start`, { method: "POST", token: res.resumeToken });
      router.push(`/game/${res.gameId}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("setup.errCreate"));
      setSubmitting(false);
      startingRef.current = false; // allow a retry after a failure
    }
  }

  return (
    <main className="pt-safe pb-bar mx-auto max-w-2xl px-5">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="grid size-10 place-items-center rounded-xl border border-line bg-surface text-ink-soft hover:text-ink" aria-label={t("common.back")}>
          <ChevronLeft size={20} className="rtl:rotate-180" />
        </Link>
        <Logo size={34} withText={false} />
        <LangToggle />
      </div>

      <h1 className="font-display text-3xl font-bold text-ink">{t("setup.title")}</h1>
      <p className="mt-1 text-ink-soft">{t("setup.subtitle")}</p>

      <button className="btn-primary mt-5 w-full text-lg" disabled={submitting || loadingCats} onClick={() => start(true)}>
        {submitting ? <Loader2 className="animate-spin" /> : <Zap size={20} />} {t("setup.quickStart")}
      </button>

      <div className="my-6 flex items-center gap-3 text-xs font-medium text-ink-muted">
        <div className="h-px flex-1 bg-line" /> {t("setup.orCustomize")} <div className="h-px flex-1 bg-line" />
      </div>

      {error && <div className="mb-4 rounded-xl border border-bad-500/30 bg-bad-50 p-3 text-sm font-medium text-bad-600">{error}</div>}

      <div className="space-y-4">
        {/* Teams */}
        <div className="card p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-teamA-700">{t("setup.team1Name")}</label>
              <input className="input border-teamA-500/30 focus:border-teamA-500/60 focus:ring-teamA-500/10" value={teamA} onChange={(e) => setTeamA(e.target.value)} maxLength={40} />
            </div>
            <div>
              <label className="label text-teamB-700">{t("setup.team2Name")}</label>
              <input className="input border-teamB-500/30 focus:border-teamB-500/60 focus:ring-teamB-500/10" value={teamB} onChange={(e) => setTeamB(e.target.value)} maxLength={40} />
            </div>
          </div>
          <div className="mt-4">
            <div className="label">{t("setup.whoStarts")}</div>
            <div className="grid grid-cols-2 gap-3">
              <Choice active={startingTeam === "A"} tone="A" onClick={() => setStartingTeam("A")}>
                {teamA.trim() || t("common.team1")}
              </Choice>
              <Choice active={startingTeam === "B"} tone="B" onClick={() => setStartingTeam("B")}>
                {teamB.trim() || t("common.team2")}
              </Choice>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="card p-4">
          <div className="label">{t("setup.categories")}</div>
          {loadingCats ? (
            <div className="py-2 text-sm text-ink-muted">{t("setup.loadingCats")}</div>
          ) : categories.length === 0 ? (
            <div className="py-2 text-sm text-ink-muted">{t("setup.noCats")}</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <Choice key={c.id} active={catIds.includes(c.id)} onClick={() => toggle(catIds, c.id, setCatIds)}>
                  <span className="min-w-0 break-words" dir="rtl">{c.nameAr}</span>
                  <span className="shrink-0 text-xs opacity-60">({c.questionCount})</span>
                </Choice>
              ))}
            </div>
          )}
        </div>

        {/* Question types */}
        <div className="card p-4">
          <div className="label">{t("setup.types")}</div>
          <div className="grid grid-cols-2 gap-2">
            {QUESTION_TYPES.map((type) => {
              const Icon = typeIcons[type];
              return (
                <Choice key={type} active={types.includes(type)} onClick={() => toggle(types, type, setTypes)}>
                  <Icon size={16} /> {t(`type.${type}`)}
                </Choice>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-ink-muted">{t("setup.typesNote")}</p>
        </div>

        {/* Number of questions — typed */}
        <div className="card p-4">
          <label htmlFor="qcount" className="label">{t("setup.numQuestions")}</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="grid size-12 shrink-0 place-items-center rounded-xl border border-line bg-surface text-ink hover:bg-surface2"
              onClick={() => setCount(String(clamp((Number.isNaN(n) ? DEFAULT_COUNT : n) - 1)))}
              aria-label="−"
            >
              <Minus size={18} />
            </button>
            <input
              id="qcount"
              inputMode="numeric"
              pattern="[0-9]*"
              value={count}
              onChange={(e) => setCount(e.target.value.replace(/[^\d]/g, ""))}
              className={clsx(
                "input flex-1 text-center font-display text-2xl font-bold tnum",
                countError && count.trim() !== "" && "border-bad-500/50 focus:border-bad-500/60 focus:ring-bad-500/10",
              )}
            />
            <button
              type="button"
              className="grid size-12 shrink-0 place-items-center rounded-xl border border-line bg-surface text-ink hover:bg-surface2"
              onClick={() => setCount(String(clamp((Number.isNaN(n) ? DEFAULT_COUNT : n) + 1)))}
              aria-label="+"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={clsx(countError ? "font-medium text-bad-600" : "text-ink-muted")}>
              {countError ?? t("setup.ready")}
            </span>
            <span className="text-ink-muted">
              {t("setup.available")}: <b className="tnum text-ink">{pool ?? "…"}</b>
            </span>
          </div>
        </div>
      </div>

      <Disclaimer className="mt-6" />

      <div className="pb-inset fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-3">
          <Link href="/" className="btn-soft flex-1">{t("common.cancel")}</Link>
          <button className="btn-primary flex-[1.7]" disabled={submitting || loadingCats || !!countError} onClick={() => start(false)}>
            {submitting ? <Loader2 className="animate-spin" /> : <Rocket size={18} />} {t("setup.start")}
          </button>
        </div>
      </div>
    </main>
  );
}
