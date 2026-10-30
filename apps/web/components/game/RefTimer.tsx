"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Pause, Play, RotateCcw, TimerReset } from "lucide-react";
import { useLang } from "@/lib/i18n";

/**
 * Referee-only countdown. The server knows nothing about it. The ref can start,
 * pause, and (once it hits zero) restart it; it resets automatically every turn
 * (new `resetKey`). Duration is chosen from presets and remembered per-device.
 */
const PRESETS = [15, 30, 45, 60];
const DKEY = "darundi.timer.seconds.v1";

export function RefTimer({ resetKey }: { resetKey: string }) {
  const { t } = useLang();
  const [duration, setDuration] = useState(30);
  const [remaining, setRemaining] = useState(30);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    try {
      const s = Number(localStorage.getItem(DKEY));
      if (s > 0) {
        setDuration(s);
        setRemaining(s);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Reset every turn (and whenever the duration changes).
  useEffect(() => {
    setRemaining(duration);
    setRunning(false);
  }, [resetKey, duration]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const done = remaining <= 0;
  const label = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
  const pct = duration > 0 ? Math.max(0, (remaining / duration) * 100) : 0;

  function setDur(s: number) {
    setDuration(s);
    setRemaining(s);
    setRunning(false);
    try {
      localStorage.setItem(DKEY, String(s));
    } catch {
      /* ignore */
    }
  }
  function toggle() {
    if (done) {
      setRemaining(duration);
      setRunning(true);
    } else {
      setRunning((r) => !r);
    }
  }

  return (
    <div className="card space-y-2.5 p-3">
      <div className="flex items-center gap-3">
        <div className="relative grid size-14 shrink-0 place-items-center">
          <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
            <circle cx="18" cy="18" r="16" fill="none" stroke="#E7E4DE" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke={done ? "#DC2626" : "#191522"}
              strokeWidth="3"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${pct} 100`}
            />
          </svg>
          <span className={clsx("tnum font-display text-sm font-bold", done ? "text-bad-600" : "text-ink")}>{label}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 text-xs font-semibold text-ink-soft">{done ? t("timer.timeUp") : t("timer.title")}</div>
          <div className="flex gap-2">
            <button onClick={toggle} className="btn-soft !min-h-0 flex-1 !px-3 !py-1.5 text-sm">
              {running ? (
                <>
                  <Pause size={14} /> {t("timer.pause")}
                </>
              ) : done ? (
                <>
                  <RotateCcw size={14} /> {t("timer.restart")}
                </>
              ) : (
                <>
                  <Play size={14} /> {t("timer.start")}
                </>
              )}
            </button>
            <button
              onClick={() => {
                setRemaining(duration);
                setRunning(false);
              }}
              className="btn-soft !min-h-0 !px-3 !py-1.5 text-sm"
              aria-label={t("timer.reset")}
            >
              <TimerReset size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setDur(p)}
            className={clsx(
              "tnum flex-1 rounded-lg px-2 py-1 text-xs font-bold transition",
              duration === p ? "bg-ink text-white" : "bg-surface2 text-ink-soft hover:text-ink",
            )}
          >
            {p}s
          </button>
        ))}
      </div>
    </div>
  );
}
