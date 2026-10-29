"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ChevronLeft, Search, AlertTriangle } from "lucide-react";
import {
  DIFFICULTIES,
  QUESTION_TYPES,
  type CategoryDto,
  type Difficulty,
  type QuestionType,
} from "@darundi/shared";
import { api } from "@/lib/api";
import { difficultyColor, difficultyLabel, typeIcon, typeLabel } from "@/lib/labels";
import { Logo } from "@/components/Logo";

interface QItem {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  questionText: string;
  answerText: string;
  explanation: string | null;
  reviewStatus: string | null;
  reviewNotes: string | null;
  sourceReference: string | null;
  flaggedForReview: boolean;
  acceptedAnswersIncomplete: boolean;
  disabled: boolean;
  sourceFile: string;
  originalId: string;
  category: { nameAr: string };
  clues: { order: number; text: string }[];
  acceptedAnswers: { order: number; text: string }[];
  _count: { reports: number };
}
interface QResponse { total: number; page: number; pageSize: number; items: QItem[] }

export default function QuestionsPage() {
  const [cats, setCats] = useState<CategoryDto[]>([]);
  const [catId, setCatId] = useState("");
  const [type, setType] = useState<QuestionType | "">("");
  const [diff, setDiff] = useState<Difficulty | "">("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<QResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    api<CategoryDto[]>("/categories").then(setCats).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (catId) params.set("categoryId", catId);
    if (type) params.set("type", type);
    if (diff) params.set("difficulty", diff);
    if (flaggedOnly) params.set("reviewFlagged", "true");
    if (search.trim()) params.set("search", search.trim());
    params.set("page", String(page));
    params.set("pageSize", "20");
    try {
      setData(await api<QResponse>(`/questions?${params.toString()}`));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [catId, type, diff, flaggedOnly, search, page]);

  useEffect(() => {
    const t = setTimeout(fetchData, 250);
    return () => clearTimeout(t);
  }, [fetchData]);

  useEffect(() => setPage(1), [catId, type, diff, flaggedOnly, search]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <main className="mx-auto max-w-2xl px-5 py-6">
      <div className="mb-5 flex items-center justify-between">
        <Link href="/" className="text-muted hover:text-slate-200"><ChevronLeft /></Link>
        <Logo size={34} />
        <span className="w-6" />
      </div>

      <h1 className="font-display text-3xl font-extrabold">بنك الأسئلة</h1>
      <p className="mt-1 text-muted">تصفّح الأسئلة المستوردة وراجِع حالتها ومصادرها. {data && <span className="text-slate-300">({data.total} نتيجة)</span>}</p>

      <div className="panel mt-4 space-y-3 p-4">
        <div className="relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input !pr-10" placeholder="ابحث في نص السؤال…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <select className="input !py-2 !text-base" value={catId} onChange={(e) => setCatId(e.target.value)}>
            <option value="">كل التصنيفات</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
          </select>
          <select className="input !py-2 !text-base" value={type} onChange={(e) => setType(e.target.value as QuestionType)}>
            <option value="">كل الأنواع</option>
            {QUESTION_TYPES.map((t) => <option key={t} value={t}>{typeLabel(t)}</option>)}
          </select>
          <select className="input !py-2 !text-base" value={diff} onChange={(e) => setDiff(e.target.value as Difficulty)}>
            <option value="">كل المستويات</option>
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{difficultyLabel(d)}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={flaggedOnly} onChange={(e) => setFlaggedOnly(e.target.checked)} className="size-4 accent-gold-400" />
          الموسومة للمراجعة فقط
        </label>
      </div>

      <div className="mt-4 space-y-3">
        {loading && <div className="text-center text-muted">جارِ التحميل…</div>}
        {data?.items.map((q) => (
          <div key={q.id} className="panel overflow-hidden">
            <button className="flex w-full items-start gap-3 p-4 text-right" onClick={() => setOpenId(openId === q.id ? null : q.id)}>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap gap-1.5">
                  <span className="chip !py-0.5 text-xs">{typeIcon[q.type]} {typeLabel(q.type)}</span>
                  <span className={clsx("chip border !py-0.5 text-xs", difficultyColor[q.difficulty])}>{difficultyLabel(q.difficulty)}</span>
                  {q.flaggedForReview && <span className="chip !py-0.5 text-xs !text-gold-300"><AlertTriangle size={12} /> مراجعة</span>}
                  {q.disabled && <span className="chip !py-0.5 text-xs !text-bad">معطّل</span>}
                  {q._count.reports > 0 && <span className="chip !py-0.5 text-xs !text-bad">بلاغات: {q._count.reports}</span>}
                </div>
                <div className="font-semibold text-slate-100">{q.questionText}</div>
                <div className="mt-0.5 text-xs text-muted">{q.category.nameAr} · {q.originalId}</div>
              </div>
            </button>
            {openId === q.id && (
              <div className="space-y-2 border-t border-white/10 bg-ink-800/40 p-4 text-sm animate-fade-up">
                <div><span className="text-muted">الإجابة: </span><span className="font-bold text-good">{q.answerText}</span></div>
                {q.clues.length > 0 && (
                  <div>
                    <div className="text-muted">التلميحات:</div>
                    <ol className="list-decimal space-y-0.5 pe-5 text-slate-200">{q.clues.map((c) => <li key={c.order}>{c.text}</li>)}</ol>
                  </div>
                )}
                {q.acceptedAnswers.length > 1 && (
                  <div><span className="text-muted">إجابات مقبولة ({q.acceptedAnswers.length}): </span><span className="text-slate-200">{q.acceptedAnswers.map((a) => a.text).join("، ")}</span></div>
                )}
                {q.explanation && <div><span className="text-muted">تفسير: </span><span className="text-slate-300">{q.explanation}</span></div>}
                {q.acceptedAnswersIncomplete && <div className="text-gold-300">⚠ قائمة الإجابات قد تكون غير مكتملة.</div>}
                {q.reviewStatus && <div className="text-xs text-muted">الحالة: {q.reviewStatus}</div>}
                {q.sourceReference && <div className="text-xs text-muted">المصدر: {q.sourceReference}</div>}
              </div>
            )}
          </div>
        ))}
        {data && data.items.length === 0 && !loading && <div className="panel p-8 text-center text-muted">لا نتائج مطابقة.</div>}
      </div>

      {data && data.total > data.pageSize && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button className="btn-ghost !px-4" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>السابق</button>
          <span className="tnum text-sm text-muted">{page} / {totalPages}</span>
          <button className="btn-ghost !px-4" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>التالي</button>
        </div>
      )}
    </main>
  );
}
