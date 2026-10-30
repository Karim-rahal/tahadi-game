"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Flag, Loader2, Pause, Play, SkipForward, Undo2 } from "lucide-react";
import type { GameState, TeamSide } from "@/lib/types";
import { api, ApiError } from "@/lib/api";
import { getGameToken, saveGameHint } from "@/lib/store";
import { Logo } from "@/components/Logo";
import { Scoreboard } from "@/components/Scoreboard";
import { statusLabel } from "@/lib/labels";
import { FastestScreen } from "./FastestScreen";
import { WhoAmIScreen } from "./WhoAmIScreen";
import { TrueFalseScreen } from "./TrueFalseScreen";
import { EnumerateScreen } from "./EnumerateScreen";
import { WinnerScreen } from "./WinnerScreen";
import { ResultTransition } from "./ResultTransition";
import type { GameActions } from "./types";

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
const RESULT_MS = 1700;

export function GameClient({ gameId }: { gameId: string }) {
  const [state, setState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const tokenRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    tokenRef.current = getGameToken(gameId);
    try {
      const s = await api<GameState>(`/games/${gameId}`, { token: tokenRef.current });
      setState(s);
      setFatal(null);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        if (tokenRef.current) {
          try {
            const s = await api<GameState>(`/games/${gameId}/claim`, { method: "POST", body: { token: tokenRef.current } });
            setState(s);
            setFatal(null);
            return;
          } catch {
            /* fall through */
          }
        }
        setFatal("لا تملك صلاحية الوصول إلى هذه المباراة على هذا الجهاز.");
      } else {
        setFatal("تعذّر تحميل المباراة. تحقّق من الاتصال وحاول مجدداً.");
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
        const s = await fn();
        setState(s);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "حدث خطأ، حاول مرة أخرى.");
      } finally {
        setBusy(false);
      }
    },
    [busy],
  );

  const post = useCallback(
    <T = GameState,>(path: string, body?: unknown) =>
      api<T>(`/games/${gameId}${path}`, { method: "POST", body: body ?? {}, token: tokenRef.current }),
    [gameId],
  );

  // `run` returns void; keep a ref so the auto-advance timer always calls the latest.
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
    adjust: (team, delta) => run(() => post("/score", { team, delta, reason: "تعديل يدوي" })),
    pause: () => run(() => post("/pause")),
    resume: () => run(() => post("/resume")),
    finish: () => run(() => post("/finish")),
    report: async (reason) => {
      if (!state?.current) return;
      try {
        await api("/reports", { method: "POST", body: { questionId: state.current.questionId, reason, gameId } });
        setError(null);
      } catch {
        setError("تعذّر إرسال البلاغ.");
      }
    },
  };
  actionsRef.current = actions;

  const q = state?.current ?? null;
  const resultPhase =
    !!q && (q.status === "ANSWERED" || q.status === "SKIPPED") && state?.status === "ACTIVE";
  const isLastResult = !!state && state.answeredCount >= state.totalQuestions;

  // Automatic advancement: once a question is resolved, show the result for a
  // short beat, then advance (or finish on the last question). No manual click.
  useEffect(() => {
    if (!resultPhase) return;
    const t = setTimeout(() => {
      const a = actionsRef.current;
      if (!a) return;
      if (isLastResult) void a.finish();
      else void a.next();
    }, RESULT_MS);
    return () => clearTimeout(t);
    // Re-keyed per resolved question so re-answering after an undo re-arms it.
  }, [resultPhase, q?.gameQuestionId, q?.status, isLastResult]);

  if (fatal) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg text-ink">{fatal}</p>
        <div className="flex gap-3">
          <button className="btn-soft" onClick={() => void load()}>إعادة المحاولة</button>
          <Link href="/games" className="btn-primary">المباريات المحفوظة</Link>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-ink-muted">
        <Loader2 className="me-2 animate-spin" /> جارِ التحميل…
      </div>
    );
  }

  if (state.status === "SETUP") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <Logo size={56} withText={false} />
        <p className="text-ink-soft">كل شيء جاهز — ابدأ المباراة متى شئت.</p>
        <button className="btn-primary" disabled={busy} onClick={() => actions.start()}>
          <Play size={18} /> ابدأ المباراة
        </button>
      </div>
    );
  }

  const activeTeam: TeamSide | null =
    q?.type === "TRUE_FALSE" ? q.ownerTeam : q?.type === "ENUMERATE" ? q.enumActiveTeam : null;
  const finished = state.status === "FINISHED";
  const noMore = !q && !finished;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="grid size-9 place-items-center rounded-xl border border-line bg-surface text-ink-soft hover:text-ink" aria-label="الرئيسية">
          <ChevronRight size={18} />
        </Link>
        <Logo size={32} withText={false} />
        <span className="chip text-xs">{statusLabel[state.status]}</span>
      </div>

      <Scoreboard state={state} activeTeam={resultPhase ? q?.answeredByTeam ?? null : activeTeam} />

      {/* Progress */}
      {!finished && (
        <div className="mt-3 flex items-center gap-3 text-xs text-ink-muted">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-gradient-to-l from-teamA-500 to-teamB-500 transition-all"
              style={{ width: `${(state.answeredCount / Math.max(state.totalQuestions, 1)) * 100}%` }}
            />
          </div>
          <span className="tnum">{state.answeredCount}/{state.totalQuestions}</span>
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
              <p className="text-lg font-semibold text-ink">المباراة متوقفة مؤقتاً</p>
              <button className="btn-primary" disabled={busy} onClick={() => actions.resume()}><Play size={18} /> استئناف</button>
            </motion.div>
          ) : resultPhase && q ? (
            <ResultTransition key={`result-${q.gameQuestionId}`} q={q} state={state} last={isLastResult} />
          ) : noMore ? (
            <motion.div key="nomore" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card flex flex-col items-center gap-4 p-10 text-center">
              <p className="text-lg font-semibold text-ink">انتهت أسئلة المباراة</p>
              <button className="btn-primary" disabled={busy} onClick={() => actions.finish()}>عرض النتيجة النهائية</button>
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

      {/* Control bar — no Next button; advancement is automatic. */}
      {!finished && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/92 backdrop-blur" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
            <button className="btn-soft flex-1 !px-3" disabled={busy || !state.canUndo} onClick={() => actions.undo()}>
              <Undo2 size={18} /> تراجع
            </button>
            {!resultPhase && (
              <button className="btn-soft flex-1 !px-3" disabled={busy} onClick={() => actions.skip()}>
                <SkipForward size={18} /> تخطّي
              </button>
            )}
            {state.status === "ACTIVE" ? (
              <button className="btn-soft !px-3" disabled={busy} onClick={() => actions.pause()} aria-label="إيقاف مؤقت">
                <Pause size={18} />
              </button>
            ) : (
              <button className="btn-soft !px-3" disabled={busy} onClick={() => actions.resume()} aria-label="استئناف">
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
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <>
      <button className="btn-soft !px-3" disabled={busy} onClick={() => setOpen(true)} aria-label="إبلاغ عن السؤال">
        <Flag size={18} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={() => setOpen(false)}>
          <div className="card-raised w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-lg font-bold text-ink">الإبلاغ عن السؤال</h3>
            <p className="mb-3 text-sm text-ink-soft">صف المشكلة (إجابة غير دقيقة، صياغة ملتبسة…). يُحفظ البلاغ للمراجعة لاحقاً.</p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="input min-h-24" />
            <div className="mt-3 flex justify-end gap-2">
              <button className="btn-soft" onClick={() => setOpen(false)}>إلغاء</button>
              <button
                className="btn-primary"
                disabled={!reason.trim()}
                onClick={async () => {
                  await onReport(reason.trim());
                  setReason("");
                  setOpen(false);
                }}
              >
                إرسال البلاغ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
