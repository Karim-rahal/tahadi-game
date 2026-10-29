"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { ChevronLeft, Loader2, Rocket, Settings2, Zap } from "lucide-react";
import {
  DEFAULT_SETTINGS,
  DIFFICULTIES,
  QUESTION_TYPES,
  type CategoryDto,
  type Difficulty,
  type GameSettings,
  type QuestionType,
} from "@darundi/shared";
import { api, ApiError } from "@/lib/api";
import { saveGameHint } from "@/lib/store";
import { difficultyLabel, typeIcon, typeLabel } from "@/lib/labels";
import { Logo } from "@/components/Logo";
import type { CreateGameResult, GameState } from "@/lib/types";

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
        active ? "border-gold-400/60 bg-gold-400/15 text-gold-200" : "border-white/10 bg-ink-800/60 text-slate-300 hover:border-white/20",
      )}
    >
      {children}
    </button>
  );
}

export default function SetupPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [teamA, setTeamA] = useState("الفريق الأول");
  const [teamB, setTeamB] = useState("الفريق الثاني");
  const [catIds, setCatIds] = useState<string[]>([]);
  const [types, setTypes] = useState<QuestionType[]>([...QUESTION_TYPES]);
  const [diffs, setDiffs] = useState<Difficulty[]>([...DIFFICULTIES]);
  const [total, setTotal] = useState(20);
  const [excludeFlagged, setExcludeFlagged] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(structuredClone(DEFAULT_SETTINGS));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<CategoryDto[]>("/categories")
      .then((c) => {
        setCategories(c);
        setCatIds(c.map((x) => x.id));
      })
      .catch(() => setError("تعذّر تحميل التصنيفات. تأكد من تشغيل الخادم واستيراد الأسئلة."))
      .finally(() => setLoadingCats(false));
  }, []);

  const toggle = <T,>(list: T[], v: T, set: (x: T[]) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  async function start(quick: boolean) {
    setError(null);
    const useCatIds = quick ? categories.map((c) => c.id) : catIds;
    const useTypes = quick ? [...QUESTION_TYPES] : types;
    const useDiffs = quick ? [...DIFFICULTIES] : diffs;
    if (useCatIds.length === 0) return setError("اختر تصنيفاً واحداً على الأقل.");
    if (useTypes.length === 0) return setError("اختر نوع سؤال واحداً على الأقل.");
    if (useDiffs.length === 0) return setError("اختر مستوى صعوبة واحداً على الأقل.");

    setSubmitting(true);
    try {
      const res = await api<CreateGameResult>("/games", {
        method: "POST",
        body: {
          teamAName: teamA.trim() || "الفريق الأول",
          teamBName: teamB.trim() || "الفريق الثاني",
          selection: {
            categoryIds: useCatIds,
            types: useTypes,
            difficulties: useDiffs,
            totalQuestions: quick ? 20 : total,
            excludeFlaggedForReview: quick ? false : excludeFlagged,
            excludeDisabled: true,
          },
          settings: quick ? DEFAULT_SETTINGS : settings,
        },
      });
      saveGameHint({ gameId: res.gameId, token: res.resumeToken, teamA, teamB, createdAt: new Date().toISOString() });
      await api<GameState>(`/games/${res.gameId}/start`, { method: "POST", token: res.resumeToken });
      router.push(`/game/${res.gameId}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذّر إنشاء المباراة.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-6">
      <div className="mb-5 flex items-center justify-between">
        <Link href="/" className="text-muted hover:text-slate-200"><ChevronLeft /></Link>
        <Logo size={34} />
        <span className="w-6" />
      </div>

      <h1 className="font-display text-3xl font-extrabold">إعداد مباراة</h1>
      <p className="mt-1 text-muted">اضبط الفريقين والأسئلة، أو ابدأ فوراً بالإعدادات الموصى بها.</p>

      <button className="btn-gold mt-5 w-full text-lg" disabled={submitting || loadingCats} onClick={() => start(true)}>
        {submitting ? <Loader2 className="animate-spin" /> : <Zap size={20} />} بداية سريعة (موصى بها)
      </button>

      <div className="my-6 flex items-center gap-3 text-xs text-muted">
        <div className="h-px flex-1 bg-white/10" /> أو خصّص الإعدادات <div className="h-px flex-1 bg-white/10" />
      </div>

      {error && <div className="mb-4 rounded-xl border border-bad/40 bg-bad/10 p-3 text-sm text-bad">{error}</div>}

      <div className="space-y-5">
        <div className="panel p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">اسم الفريق أ</label>
              <input className="input" value={teamA} onChange={(e) => setTeamA(e.target.value)} maxLength={40} />
            </div>
            <div>
              <label className="label">اسم الفريق ب</label>
              <input className="input" value={teamB} onChange={(e) => setTeamB(e.target.value)} maxLength={40} />
            </div>
          </div>
        </div>

        <div className="panel p-4">
          <div className="label">التصنيفات</div>
          {loadingCats ? (
            <div className="text-sm text-muted">جارِ التحميل…</div>
          ) : categories.length === 0 ? (
            <div className="text-sm text-muted">لا توجد تصنيفات — شغّل أمر الاستيراد أولاً.</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <Toggle key={c.id} active={catIds.includes(c.id)} onClick={() => toggle(catIds, c.id, setCatIds)}>
                  {c.nameAr} <span className="text-xs opacity-70">({c.questionCount})</span>
                </Toggle>
              ))}
            </div>
          )}
        </div>

        <div className="panel p-4">
          <div className="label">أنواع الأسئلة</div>
          <div className="grid grid-cols-2 gap-2">
            {QUESTION_TYPES.map((t) => (
              <Toggle key={t} active={types.includes(t)} onClick={() => toggle(types, t, setTypes)}>
                {typeIcon[t]} {typeLabel(t)}
              </Toggle>
            ))}
          </div>
        </div>

        <div className="panel p-4">
          <div className="label">مستويات الصعوبة</div>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTIES.map((d) => (
              <Toggle key={d} active={diffs.includes(d)} onClick={() => toggle(diffs, d, setDiffs)}>
                {difficultyLabel(d)}
              </Toggle>
            ))}
          </div>
        </div>

        <div className="panel p-4">
          <label className="label">عدد الأسئلة: {total}</label>
          <input type="range" min={4} max={60} step={2} value={total} onChange={(e) => setTotal(Number(e.target.value))} className="w-full accent-gold-400" />
          <label className="mt-3 flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={excludeFlagged} onChange={(e) => setExcludeFlagged(e.target.checked)} className="size-4 accent-gold-400" />
            استبعاد الأسئلة الموسومة للمراجعة (معظم أسئلة المسودة موسومة)
          </label>
        </div>

        <button className="btn-ghost w-full" onClick={() => setShowAdvanced((s) => !s)}>
          <Settings2 size={18} /> إعدادات متقدمة (النقاط، الأخطاء، التمريرات، المؤقّت)
        </button>

        {showAdvanced && <AdvancedSettings settings={settings} onChange={setSettings} />}
      </div>

      <div className="h-20" />
      <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-ink-800/90 backdrop-blur" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-3">
          <Link href="/" className="btn-ghost flex-1">إلغاء</Link>
          <button className="btn-gold flex-[1.6]" disabled={submitting || loadingCats} onClick={() => start(false)}>
            {submitting ? <Loader2 className="animate-spin" /> : <Rocket size={18} />} ابدأ المباراة
          </button>
        </div>
      </div>
    </main>
  );
}

function Num({ label, value, onChange, min = 0, max = 100 }: { label: string; value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm text-slate-300">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
        className="w-20 rounded-lg border border-white/10 bg-ink-800 px-2 py-1 text-center text-slate-100"
      />
    </label>
  );
}

function AdvancedSettings({ settings, onChange }: { settings: GameSettings; onChange: (s: GameSettings) => void }) {
  const s = settings;
  const set = (patch: Partial<GameSettings>) => onChange({ ...s, ...patch });
  return (
    <div className="panel space-y-4 p-4 animate-fade-up">
      <div>
        <div className="label">النقاط حسب الصعوبة</div>
        <div className="grid grid-cols-3 gap-3">
          <Num label="سهل" value={s.pointsByDifficulty.EASY} onChange={(v) => set({ pointsByDifficulty: { ...s.pointsByDifficulty, EASY: v } })} />
          <Num label="متوسط" value={s.pointsByDifficulty.MEDIUM} onChange={(v) => set({ pointsByDifficulty: { ...s.pointsByDifficulty, MEDIUM: v } })} />
          <Num label="صعب" value={s.pointsByDifficulty.HARD} onChange={(v) => set({ pointsByDifficulty: { ...s.pointsByDifficulty, HARD: v } })} />
        </div>
      </div>
      <div className="border-t border-white/10 pt-3">
        <div className="label">عدّد الإجابات</div>
        <div className="space-y-2">
          <Num label="عدد الأخطاء المسموح" value={s.enumerate.strikesPerTeam} min={1} max={10} onChange={(v) => set({ enumerate: { ...s.enumerate, strikesPerTeam: v } })} />
          <Num label="عدد التمريرات" value={s.enumerate.passesPerTeam} min={0} max={10} onChange={(v) => set({ enumerate: { ...s.enumerate, passesPerTeam: v } })} />
          <Num label="نقاط كل إجابة" value={s.enumerate.pointsPerAnswer} onChange={(v) => set({ enumerate: { ...s.enumerate, pointsPerAnswer: v } })} />
        </div>
      </div>
      <div className="border-t border-white/10 pt-3">
        <div className="label">من أنا؟</div>
        <Num label="نقص النقاط لكل تلميح إضافي" value={s.whoAmI.penaltyPerClue} onChange={(v) => set({ whoAmI: { ...s.whoAmI, penaltyPerClue: v } })} />
      </div>
      <div className="border-t border-white/10 pt-3">
        <label className="flex items-center justify-between text-sm text-slate-300">
          <span>تفعيل المؤقّت</span>
          <input type="checkbox" checked={s.timers.enabled} onChange={(e) => set({ timers: { ...s.timers, enabled: e.target.checked } })} className="size-4 accent-gold-400" />
        </label>
      </div>
    </div>
  );
}
