"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Play, Trash2, Inbox } from "lucide-react";
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
      <div className="mb-5 flex items-center justify-between">
        <Link href="/" className="text-muted hover:text-slate-200"><ChevronLeft /></Link>
        <Logo size={34} />
        <span className="w-6" />
      </div>

      <h1 className="font-display text-3xl font-extrabold">الألعاب المحفوظة</h1>
      <p className="mt-1 text-muted">المباريات التي بدأتها على هذا الجهاز. تابع أياً منها من حيث توقفت.</p>

      {hints.length === 0 ? (
        <div className="panel mt-6 flex flex-col items-center gap-3 p-10 text-center text-muted">
          <Inbox size={36} />
          <p>لا توجد مباريات محفوظة على هذا الجهاز بعد.</p>
          <Link href="/setup" className="btn-gold mt-2">ابدأ لعبة جديدة</Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {hints.map((h) => (
            <li key={h.gameId} className="panel flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="truncate font-bold text-slate-100">
                  {h.teamA} <span className="text-muted">ضد</span> {h.teamB}
                </div>
                <div className="text-xs text-muted">{new Date(h.createdAt).toLocaleString("ar")}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link href={`/game/${h.gameId}`} className="btn-gold !px-3 !py-2 text-sm"><Play size={16} /> متابعة</Link>
                <button onClick={() => remove(h.gameId)} className="btn-ghost !px-3 !py-2" aria-label="حذف"><Trash2 size={16} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-xs text-muted">
        الحذف هنا يزيل الاختصار من هذا الجهاز فقط، ولا يحذف المباراة من قاعدة البيانات.
      </p>
    </main>
  );
}
