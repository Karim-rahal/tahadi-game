"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Flag, Pause, Play, RotateCcw, SkipForward, Undo2, Loader2 } from "lucide-react";
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
import type { GameActions } from "./types";

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

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
        // Try to re-claim with the locally stored recovery token.
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
        setFatal("لا تملك صلاحية الوصول إلى هذه اللعبة على هذا الجهاز.");
      } else {
        setFatal("تعذّر تحميل اللعبة. تحقّق من الاتصال وحاول مجدداً.");
      }
    }
  }, [gameId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Persist team names into the recovery hint when known.
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

  if (fatal) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg text-slate-200">{fatal}</p>
        <div className="flex gap-3">
          <button className="btn-ghost" onClick={() => void load()}>إعادة المحاولة</button>
          <Link href="/games" className="btn-gold">الألعاب المحفوظة</Link>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted">
        <Loader2 className="me-2 animate-spin" /> جارِ التحميل…
      </div>
    );
  }

  if (state.status === "SETUP") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <Logo size={56} />
        <p className="text-muted">كل شيء جاهز — ابدأ المباراة متى شئت.</p>
        <button className="btn-gold" disabled={busy} onClick={() => actions.start()}>
          <Play size={18} /> ابدأ المباراة
        </button>
      </div>
    );
  }

  const q = state.current;
  const activeTeam: TeamSide | null =
    q?.type === "TRUE_FALSE" ? q.ownerTeam : q?.type === "ENUMERATE" ? q.enumActiveTeam : null;
  const finished = state.status === "FINISHED";
  const noMore = !q && !finished;
  const allDone = state.answeredCount >= state.totalQuestions;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-32 pt-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="text-muted hover:text-slate-200"><ChevronLeft /></Link>
        <Logo size={34} />
        <span className="chip text-xs">{statusLabel[state.status]}</span>
      </div>

      <Scoreboard state={state} activeTeam={activeTeam} />

      {/* Progress */}
      <div className="mt-3 flex items-center gap-3 text-xs text-muted">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gold-400/70 transition-all" style={{ width: `${(state.answeredCount / Math.max(state.totalQuestions, 1)) * 100}%` }} />
        </div>
        <span className="tnum">{state.answeredCount}/{state.totalQuestions}</span>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-bad/40 bg-bad/10 p-3 text-sm text-bad">{error}</div>
      )}

      {/* Main content */}
      <div className="mt-5">
        <AnimatePresence mode="wait">
          {finished ? (
            <WinnerScreen key="winner" state={state} />
          ) : state.status === "PAUSED" ? (
            <motion.div key="paused" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="panel flex flex-col items-center gap-4 p-10 text-center">
              <Pause size={40} className="text-gold-300" />
              <p className="text-lg">اللعبة متوقفة مؤقتاً</p>
              <button className="btn-gold" disabled={busy} onClick={() => actions.resume()}><Play size={18} /> استئناف</button>
            </motion.div>
          ) : noMore ? (
            <motion.div key="nomore" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="panel flex flex-col items-center gap-4 p-10 text-center">
              <p className="text-lg">انتهت أسئلة المباراة</p>
              <button className="btn-gold" disabled={busy} onClick={() => actions.finish()}>عرض النتيجة النهائية</button>
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

      {/* Sticky action bar */}
      {!finished && (
        <div
          className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-ink-800/90 backdrop-blur"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
            <button className="btn-ghost flex-1 !px-3" disabled={busy || !state.canUndo} onClick={() => actions.undo()}>
              <Undo2 size={18} /> تراجع
            </button>
            <button className="btn-ghost flex-1 !px-3" disabled={busy} onClick={() => actions.skip()}>
              <SkipForward size={18} /> تخطّي
            </button>
            {state.status === "ACTIVE" ? (
              <button className="btn-ghost !px-3" disabled={busy} onClick={() => actions.pause()} aria-label="إيقاف مؤقت">
                <Pause size={18} />
              </button>
            ) : (
              <button className="btn-ghost !px-3" disabled={busy} onClick={() => actions.resume()} aria-label="استئناف">
                <Play size={18} />
              </button>
            )}
            <ReportButton onReport={actions.report} busy={busy} />
            <button
              className="btn-gold flex-[1.4] !px-3"
              disabled={busy}
              onClick={() => (allDone ? actions.finish() : actions.next())}
            >
              {allDone ? "إنهاء المباراة" : "التالي"}
            </button>
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
      <button className="btn-ghost !px-3" disabled={busy} onClick={() => setOpen(true)} aria-label="إبلاغ عن السؤال">
        <Flag size={18} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="panel w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-lg font-bold">الإبلاغ عن السؤال</h3>
            <p className="mb-3 text-sm text-muted">صف المشكلة (إجابة غير دقيقة، صياغة ملتبسة، إلخ). يُحفظ البلاغ للمراجعة لاحقاً.</p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="input min-h-24" />
            <div className="mt-3 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setOpen(false)}>إلغاء</button>
              <button
                className="btn-gold"
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
