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
import { difficultyColor, typeIcons } from "@/lib/labels";
import { useLang } from "@/lib/i18n";
import { Logo } from "@/components/Logo";
import { LangToggle } from "@/components/LangToggle";

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
  const { t } = useLang();
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
    const id = setTimeout(fetchData, 250);
    return () => clearTimeout(id);
  }, [fetchData]);

  useEffect(() => setPage(1), [catId, type, diff, flaggedOnly, search]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <main className="mx-auto max-w-2xl px-5 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="grid size-10 place-items-center rounded-xl border border-line bg-surface text-ink-soft hover:text-ink" aria-label={t("common.back")}>
          <ChevronLeft size={20} className="rtl:rotate-180" />
        </Link>
        <Logo size={34} withText={false} />
        <LangToggle />
      </div>

      <h1 className="font-display text-3xl font-bold text-ink">{t("bank.title")}</h1>
      <p className="mt-1 text-ink-soft">
        {t("bank.subtitle")} {data && <span className="text-ink">({t("bank.results", { n: data.total })})</span>}
      </p>

      <div className="card mt-4 space-y-3 p-4">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input className="input !ps-10 !text-base" placeholder={t("bank.search")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <select className="input !py-2 !text-base" value={catId} onChange={(e) => setCatId(e.target.value)}>
            <option value="">{t("bank.allCats")}</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
          </select>
          <select className="input !py-2 !text-base" value={type} onChange={(e) => setType(e.target.value as QuestionType)}>
            <option value="">{t("bank.allTypes")}</option>
            {QUESTION_TYPES.map((x) => <option key={x} value={x}>{t(`type.${x}`)}</option>)}
          </select>
          <select className="input !py-2 !text-base" value={diff} onChange={(e) => setDiff(e.target.value as Difficulty)}>
            <option value="">{t("bank.allDiffs")}</option>
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{t(`diff.${d}`)}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={flaggedOnly} onChange={(e) => setFlaggedOnly(e.target.checked)} className="size-4 accent-ink" />
          {t("bank.flaggedOnly")}
        </label>
      </div>

      <div className="mt-4 space-y-3">
        {loading && <div className="text-center text-ink-muted">{t("bank.loading")}</div>}
        {data?.items.map((q) => {
          const Icon = typeIcons[q.type];
          return (
            <div key={q.id} className="card overflow-hidden">
              <button className="flex w-full items-start gap-3 p-4 text-start" onClick={() => setOpenId(openId === q.id ? null : q.id)}>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap gap-1.5">
                    <span className="chip !py-0.5 text-xs"><Icon size={12} /> {t(`type.${q.type}`)}</span>
                    <span className={clsx("chip border !py-0.5 text-xs", difficultyColor[q.difficulty])}>{t(`diff.${q.difficulty}`)}</span>
                    {q.flaggedForReview && <span className="chip !py-0.5 text-xs text-bad-600"><AlertTriangle size={12} /> {t("bank.review")}</span>}
                    {q.disabled && <span className="chip !py-0.5 text-xs text-bad-600">{t("bank.disabled")}</span>}
                    {q._count.reports > 0 && <span className="chip !py-0.5 text-xs text-bad-600">{t("bank.reports", { n: q._count.reports })}</span>}
                  </div>
                  <div className="font-semibold text-ink" dir="rtl">{q.questionText}</div>
                  <div className="mt-0.5 text-xs text-ink-muted" dir="rtl">{q.category.nameAr} · {q.originalId}</div>
                </div>
              </button>
              {openId === q.id && (
                <div className="animate-fade-up space-y-2 border-t border-line bg-surface2 p-4 text-sm" dir="rtl">
                  <div><span className="text-ink-muted">{t("bank.answer")} </span><span className="font-bold text-good-600">{q.answerText}</span></div>
                  {q.clues.length > 0 && (
                    <div>
                      <div className="text-ink-muted">{t("bank.hints")}</div>
                      <ol className="list-decimal space-y-0.5 pe-5 text-ink">{q.clues.map((c) => <li key={c.order}>{c.text}</li>)}</ol>
                    </div>
                  )}
                  {q.acceptedAnswers.length > 1 && (
                    <div><span className="text-ink-muted">{t("bank.accepted", { n: q.acceptedAnswers.length })} </span><span className="text-ink">{q.acceptedAnswers.map((a) => a.text).join("، ")}</span></div>
                  )}
                  {q.explanation && <div><span className="text-ink-muted">{t("bank.explanation")} </span><span className="text-ink-soft">{q.explanation}</span></div>}
                  {q.acceptedAnswersIncomplete && <div className="text-bad-600">{t("bank.incomplete")}</div>}
                  {q.reviewStatus && <div className="text-xs text-ink-muted">{t("bank.statusLbl")} {q.reviewStatus}</div>}
                  {q.sourceReference && <div className="text-xs text-ink-muted">{t("bank.source")} {q.sourceReference}</div>}
                </div>
              )}
            </div>
          );
        })}
        {data && data.items.length === 0 && !loading && <div className="card p-8 text-center text-ink-muted">{t("bank.noResults")}</div>}
      </div>

      {data && data.total > data.pageSize && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button className="btn-soft !min-h-0 !px-4 !py-2" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t("bank.prev")}</button>
          <span className="tnum text-sm text-ink-muted">{page} / {totalPages}</span>
          <button className="btn-soft !min-h-0 !px-4 !py-2" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>{t("bank.next")}</button>
        </div>
      )}
    </main>
  );
}
