"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Play, Trash2, Inbox } from "lucide-react";
import { listGameHints, removeGameHint, type GameHint } from "@/lib/store";
import { Logo } from "@/components/Logo";

export default function GamesPage() {
  const [hints, setHints] = useState<GameHint[]>([]);

  useEffect(() => setHints(listGameHints()), []);

  function remove(id: string) {
    removeGameHint(id);
    setHints(listGameHints());
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="grid size-10 place-items-center rounded-xl border border-line bg-surface text-ink-soft hover:text-ink" aria-label="رجوع">
          <ChevronRight size={20} />
        </Link>
        <Logo size={34} withText={false} />
        <span className="w-10" />
      </div>

      <h1 className="font-display text-3xl font-bold text-ink">المباريات المحفوظة</h1>
      <p className="mt-1 text-ink-soft">المباريات التي بدأتها على هذا الجهاز. تابع أياً منها من حيث توقفت.</p>

      {hints.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center gap-3 p-10 text-center text-ink-muted">
          <Inbox size={36} />
          <p>لا توجد مباريات محفوظة على هذا الجهاز بعد.</p>
          <Link href="/setup" className="btn-primary mt-2">ابدأ مباراة جديدة</Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {hints.map((h) => (
            <li key={h.gameId} className="card flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="truncate font-bold text-ink">
                  <span className="text-teamA-700">{h.teamA}</span>
                  <span className="mx-1 text-ink-muted">ضد</span>
                  <span className="text-teamB-700">{h.teamB}</span>
                </div>
                <div className="text-xs text-ink-muted">{new Date(h.createdAt).toLocaleString("ar")}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link href={`/game/${h.gameId}`} className="btn-primary !min-h-0 !px-3 !py-2 text-sm"><Play size={16} /> متابعة</Link>
                <button onClick={() => remove(h.gameId)} className="btn-soft !min-h-0 !px-3 !py-2" aria-label="حذف"><Trash2 size={16} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-xs text-ink-muted">
        الحذف هنا يزيل الاختصار من هذا الجهاز فقط، ولا يحذف المباراة من قاعدة البيانات.
      </p>
    </main>
  );
}
