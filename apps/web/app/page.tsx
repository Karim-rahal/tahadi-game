import Link from "next/link";
import { Play, RotateCcw, BookOpen, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 py-8">
      <header className="flex items-center justify-between">
        <Logo size={44} />
      </header>

      <section className="flex flex-1 flex-col items-center justify-center py-10 text-center">
        <div className="chip mb-5 !text-gold-300">
          <Sparkles size={14} /> مسابقة الفريقين — بجهاز واحد يديره الحكَم
        </div>
        <h1 className="font-display text-5xl font-extrabold leading-tight text-slate-50 sm:text-6xl">
          تحدي <span className="bg-gradient-to-l from-gold-300 to-gold-500 bg-clip-text text-transparent">الدروندي</span>
        </h1>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">
          لعبة أسئلة تنافسية بين فريقين. يقرأ الحكَم الأسئلة، ويجيب اللاعبون شفهياً، ويتولّى التطبيق إدارة الأدوار
          والنقاط والأخطاء والتمريرات.
        </p>

        <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
          <Link href="/setup" className="btn-gold text-lg">
            <Play size={20} /> ابدأ لعبة جديدة
          </Link>
          <div className="flex gap-3">
            <Link href="/games" className="btn-ghost flex-1">
              <RotateCcw size={18} /> متابعة لعبة
            </Link>
            <Link href="/questions" className="btn-ghost flex-1">
              <BookOpen size={18} /> بنك الأسئلة
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="panel p-4">
          <div className="text-2xl">🕌</div>
          <div className="mt-1 font-bold text-slate-100">أسئلة دينية</div>
          <div className="text-sm text-muted">٦٠٠ سؤال (مسودة للمراجعة)</div>
        </div>
        <div className="panel p-4">
          <div className="text-2xl">🌍</div>
          <div className="mt-1 font-bold text-slate-100">بلاد العالم والجغرافيا</div>
          <div className="text-sm text-muted">٦٠٠ سؤال (حزمة تجريبية)</div>
        </div>
      </section>

      <footer className="mt-8 text-center text-xs text-muted">
        أربعة أنواع أسئلة: الأسرع يجاوب · من أنا؟ · صح أم خطأ · عدّد الإجابات
      </footer>
    </main>
  );
}
