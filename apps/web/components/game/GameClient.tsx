"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Flag, Loader2, Pause, Play, SkipForward, Swords, Undo2 } from "lucide-react";
import type { GameState, TeamSide } from "@/lib/types";
import { api, ApiError } from "@/lib/api";
import { getGameToken, saveGameHint } from "@/lib/store";
import { useLang } from "@/lib/i18n";
import { Logo } from "@/components/Logo";
import { LangToggle } from "@/components/LangToggle";
import { Disclaimer } from "@/components/Disclaimer";
import { Scoreboard } from "@/components/Scoreboard";
import { FastestScreen } from "./FastestScreen";
import { WhoAmIScreen } from "./WhoAmIScreen";
import { TrueFalseScreen } from "./TrueFalseScreen";
import { EnumerateScreen } from "./EnumerateScreen";
import { WinnerScreen } from "./WinnerScreen";
import { ResultTransition } from "./ResultTransition";
import { RefTimer } from "./RefTimer";
import type { GameActions } from "./types";

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
const RESULT_MS = 1700;

export function GameClient({ gameId }: { gameId: string }) {
  const { t } = useLang();
  const [state, setState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fatalKey, setFatalKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const tokenRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    tokenRef.current = getGameToken(gameId);
    try {
      const s = await api<GameState>(`/games/${gameId}`, { token: tokenRef.current });
      setState(s);
      setFatalKey(null);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        if (tokenRef.current) {
          try {
            const s = await api<GameState>(`/games/${gameId}/claim`, { method: "POST", body: { token: tokenRef.current } });
            setState(s);
            setFatalKey(null);
            return;
          } catch {
            /* fall through */
          }
        }
        setFatalKey("game.loadFatalAccess");
      } else {
        setFatalKey("game.loadFatal");
      }
    }
  }, [gameId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (state && tokenRef.current) {
      saveGameHint({
        gameId,
        token: tokenRef.current,
        teamA: state.teams.A.name,
        teamB: state.teams.B.name,
        createdAt: new Date().toISOString(),
      });
    }
  }, [state, gameId]);

  const run = useCallback(
    async (fn: () => Promise<GameState>) => {
      if (busy) return;
      setBusy(true);
      setError(null);
      try {
        setState(await fn());
      } catch (e) {
        setError(e instanceof ApiError ? e.message : t("game.error"));
      } finally {
        setBusy(false);
      }
    },
    [busy, t],
  );

  const post = useCallback(
    <T = GameState,>(path: string, body?: unknown) =>
      api<T>(`/games/${gameId}${path}`, { method: "POST", body: body ?? {}, token: tokenRef.current }),
    [gameId],
  );

  const actionsRef = useRef<GameActions | null>(null);

  const actions: GameActions = {
    answer: (team, correct, opts) =>
      run(() => post("/answer", { team, correct, cluesRevealed: opts?.cluesRevealed, givenAnswer: opts?.givenAnswer, idempotencyKey: uid() })),
    revealClue: () => run(() => post("/clue", { idempotencyKey: uid() })),
    enumerateAnswer: (team, opts) => run(() => post("/enumerate/answer", { team, ...opts, idempotencyKey: uid() })),
    strike: (team) => run(() => post("/strike", { team, idempotencyKey: uid() })),
    pass: (team) => run(() => post("/pass", { team, idempotencyKey: uid() })),
    skip: () => run(() => post("/skip", { idempotencyKey: uid() })),
    start: () => run(() => post("/start")),
    next: () => run(() => post("/next-question", { idempotencyKey: uid() })),
    undo: () => run(() => post("/undo")),
    adjust: (team, delta) => run(() => post("/score", { team, delta, reason: "manual" })),
    pause: () => run(() => post("/pause")),
    resume: () => run(() => post("/resume")),
    finish: () => run(() => post("/finish")),
    report: async (reason) => {
      if (!state?.current) return;
      try {
        await api("/reports", { method: "POST", body: { questionId: state.current.questionId, reason, gameId } });
        setError(null);
      } catch {
        setError(t("report.err"));
      }
    },
  };
  actionsRef.current = actions;

  const q = state?.current ?? null;
  const resultPhase =
    !!q && (q.status === "ANSWERED" || q.status === "SKIPPED") && state?.status === "ACTIVE";
  const isLastResult = !!state && state.answeredCount >= state.totalQuestions;
  const willTiebreak = !!state && isLastResult && state.teams.A.score === state.teams.B.score;

  useEffect(() => {
    if (!resultPhase) return;
    const timer = setTimeout(() => {
      const a = actionsRef.current;
      if (!a) return;
      if (isLastResult) void a.finish();
      else void a.next();
    }, RESULT_MS);
    return () => clearTimeout(timer);
  }, [resultPhase, q?.gameQuestionId, q?.status, isLastResult]);

  if (fatalKey) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg text-ink">{t(fatalKey)}</p>
        <div className="flex gap-3">
          <button className="btn-soft" onClick={() => void load()}>{t("common.retry")}</button>
          <Link href="/games" className="btn-primary">{t("game.savedMatches")}</Link>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-ink-muted">
        <Loader2 className="me-2 animate-spin" /> {t("common.loading")}
      </div>
    );
  }

  if (state.status === "SETUP") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <Logo size={56} withText={false} />
        <p className="text-ink-soft">{t("game.readyStart")}</p>
        <button className="btn-primary" disabled={busy} onClick={() => actions.start()}>
          <Play size={18} /> {t("game.start")}
        </button>
      </div>
    );
  }

  const activeTeam: TeamSide | null =
    q?.type === "TRUE_FALSE" ? q.ownerTeam : q?.type === "ENUMERATE" ? q.enumActiveTeam : null;
  const finished = state.status === "FINISHED";
  const noMore = !q && !finished;
  const showTimer = !!q && !finished && state.status === "ACTIVE" && !resultPhase;

  return (
    <div className="pt-safe pb-bar mx-auto w-full max-w-2xl px-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="grid size-9 place-items-center rounded-xl border border-line bg-surface text-ink-soft hover:text-ink" aria-label={t("common.home")}>
          <ChevronLeft size={18} className="rtl:rotate-180" />
        </Link>
        <Logo size={32} withText={false} />
        <LangToggle />
      </div>

      <Scoreboard state={state} activeTeam={resultPhase ? q?.answeredByTeam ?? null : activeTeam} />

      {/* Progress — or the sudden-death banner during a tie-breaker */}
      {!finished && state.tiebreaker ? (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-ink/15 bg-ink px-4 py-2.5 text-center text-sm font-semibold text-white">
          <Swords size={16} /> {t("game.tiebreakBanner")}
        </div>
      ) : !finished ? (
        <div className="mt-3 flex items-center gap-3 text-xs text-ink-muted">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-gradient-to-l from-teamA-500 to-teamB-500 transition-all"
              style={{ width: `${(state.answeredCount / Math.max(state.totalQuestions, 1)) * 100}%` }}
            />
          </div>
          <span className="tnum">{state.answeredCount}/{state.totalQuestions}</span>
        </div>
      ) : null}

      {showTimer && (
        <div className="mt-3">
          {/* Reset the timer every turn — a new question, or (in enumeration) the
              turn passing to the other team. */}
          <RefTimer resetKey={`${q!.gameQuestionId}:${q!.enumActiveTeam ?? ""}`} />
        </div>
      )}

      {error && <div className="mt-3 rounded-xl border border-bad-500/30 bg-bad-50 p-3 text-sm font-medium text-bad-600">{error}</div>}

      {/* Main content */}
      <div className="mt-5">
        <AnimatePresence mode="wait">
          {finished ? (
            <WinnerScreen key="winner" state={state} />
          ) : state.status === "PAUSED" ? (
            <motion.div key="paused" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card flex flex-col items-center gap-4 p-10 text-center">
              <Pause size={40} className="text-ink" />
              <p className="text-lg font-semibold text-ink">{t("game.paused")}</p>
              <button className="btn-primary" disabled={busy} onClick={() => actions.resume()}><Play size={18} /> {t("game.resume")}</button>
            </motion.div>
          ) : resultPhase && q ? (
            <ResultTransition key={`result-${q.gameQuestionId}`} q={q} state={state} last={isLastResult && !willTiebreak} tiebreakNext={willTiebreak} />
          ) : noMore ? (
            <motion.div key="nomore" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card flex flex-col items-center gap-4 p-10 text-center">
              <p className="text-lg font-semibold text-ink">{t("game.noMore")}</p>
              <button className="btn-primary" disabled={busy} onClick={() => actions.finish()}>{t("game.showFinal")}</button>
            </motion.div>
          ) : q ? (
            <div key={q.gameQuestionId}>
              {q.type === "FASTEST" && <FastestScreen q={q} state={state} actions={actions} busy={busy} />}
              {q.type === "WHO_AM_I" && <WhoAmIScreen q={q} state={state} actions={actions} busy={busy} />}
              {q.type === "TRUE_FALSE" && <TrueFalseScreen q={q} state={state} actions={actions} busy={busy} />}
              {q.type === "ENUMERATE" && <EnumerateScreen q={q} state={state} actions={actions} busy={busy} />}
            </div>
          ) : null}
        </AnimatePresence>
      </div>

      {!finished && <Disclaimer className="mt-6" />}

      {/* Control bar — no Next button; advancement is automatic. */}
      {!finished && (
        <div className="pb-inset fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/92 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
            <button className="btn-soft flex-1 !px-3" disabled={busy || !state.canUndo} onClick={() => actions.undo()}>
              <Undo2 size={18} /> {t("game.undo")}
            </button>
            {!resultPhase && (
              <button className="btn-soft flex-1 !px-3" disabled={busy} onClick={() => actions.skip()}>
                <SkipForward size={18} /> {t("game.skip")}
              </button>
            )}
            {state.status === "ACTIVE" ? (
              <button className="btn-soft !px-3" disabled={busy} onClick={() => actions.pause()} aria-label={t("game.paused")}>
                <Pause size={18} />
              </button>
            ) : (
              <button className="btn-soft !px-3" disabled={busy} onClick={() => actions.resume()} aria-label={t("game.resume")}>
                <Play size={18} />
              </button>
            )}
            {!resultPhase && <ReportButton onReport={actions.report} busy={busy} />}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportButton({ onReport, busy }: { onReport: (reason: string) => Promise<void>; busy: boolean }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <>
      <button className="btn-soft !px-3" disabled={busy} onClick={() => setOpen(true)} aria-label={t("report.aria")}>
        <Flag size={18} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={() => setOpen(false)}>
          <div className="card-raised w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-lg font-bold text-ink">{t("report.title")}</h3>
            <p className="mb-3 text-sm text-ink-soft">{t("report.desc")}</p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="input min-h-24" />
            <div className="mt-3 flex justify-end gap-2">
              <button className="btn-soft" onClick={() => setOpen(false)}>{t("common.cancel")}</button>
              <button
                className="btn-primary"
                disabled={!reason.trim()}
                onClick={async () => {
                  await onReport(reason.trim());
                  setReason("");
                  setOpen(false);
                }}
              >
                {t("report.send")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
