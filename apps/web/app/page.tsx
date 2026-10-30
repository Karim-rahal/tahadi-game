import Link from "next/link";
import { Play, RotateCcw, BookOpen, Sparkles, Landmark, Globe2, Swords } from "lucide-react";
import { QUESTION_TYPES } from "@darundi/shared";
import { Logo } from "@/components/Logo";
import { typeIcons, typeLabel } from "@/lib/labels";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 py-7">
      <header className="flex items-center justify-between">
        <Logo size={44} />
      </header>

      <section className="flex flex-1 flex-col items-center justify-center py-8 text-center">
        <div className="chip mb-6">
          <Sparkles size={14} className="text-teamB-500" /> مسابقة الفريقين — بجهاز واحد يديره الحكَم
        </div>

        <h1 className="font-display text-5xl font-bold leading-[1.1] text-ink sm:text-6xl">
          تحدي{" "}
          <span className="bg-gradient-to-l from-teamA-500 to-teamB-500 bg-clip-text text-transparent">
            الدروندي
          </span>
        </h1>

        {/* The duel — the signature motif: two teams meeting across a seam. */}
        <div className="mt-7 flex w-full max-w-sm items-stretch justify-center gap-0 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <div className="flex-1 bg-teamA-50 py-4 text-teamA-700">
            <div className="text-xs font-semibold opacity-80">الفريق الأول</div>
            <div className="font-display text-2xl font-bold">أ</div>
          </div>
          <div className="relative grid w-14 shrink-0 place-items-center bg-ink text-white">
            <Swords size={20} />
          </div>
          <div className="flex-1 bg-teamB-50 py-4 text-teamB-700">
            <div className="text-xs font-semibold opacity-80">الفريق الثاني</div>
            <div className="font-display text-2xl font-bold">ب</div>
          </div>
        </div>

        <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft">
          فريقان يتبارزان، والحكَم يقرأ الأسئلة ويحتسب النقاط. كل سؤال بنقطة واحدة —
          والتطبيق يدير الأدوار والأخطاء والتمريرات والانتقال تلقائياً.
        </p>

        <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
          <Link href="/setup" className="btn-primary text-lg">
            <Play size={20} /> ابدأ مباراة جديدة
          </Link>
          <div className="flex gap-3">
            <Link href="/games" className="btn-soft flex-1">
              <RotateCcw size={18} /> متابعة مباراة
            </Link>
            <Link href="/questions" className="btn-soft flex-1">
              <BookOpen size={18} /> بنك الأسئلة
            </Link>
          </div>
        </div>
      </section>

      {/* Four question modes */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUESTION_TYPES.map((t) => {
          const Icon = typeIcons[t];
          return (
            <div key={t} className="card flex flex-col items-center gap-2 p-4 text-center">
              <span className="grid size-10 place-items-center rounded-xl bg-paper text-ink">
                <Icon size={20} />
              </span>
              <div className="text-sm font-semibold text-ink">{typeLabel(t)}</div>
            </div>
          );
        })}
      </section>

      {/* Banks */}
      <section className="mt-3 grid grid-cols-2 gap-3">
        <div className="card flex items-center gap-3 p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-teamA-50 text-teamA-600">
            <Landmark size={20} />
          </span>
          <div>
            <div className="font-semibold text-ink">أسئلة دينية</div>
            <div className="text-xs text-ink-muted">٦٠٠ سؤال</div>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-teamB-50 text-teamB-600">
            <Globe2 size={20} />
          </span>
          <div>
            <div className="font-semibold text-ink">بلاد العالم والجغرافيا</div>
            <div className="text-xs text-ink-muted">٦٠٠ سؤال</div>
          </div>
        </div>
      </section>

      <footer className="mt-8 text-center text-xs text-ink-muted">
        الأسرع يجاوب · من أنا؟ · صح أم خطأ · عدّد الإجابات
      </footer>
    </main>
  );
}
