"use client";

import clsx from "clsx";
import { useLang } from "@/lib/i18n";

/** EN / ع switch for the interface language (per-device). */
export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div className={clsx("inline-flex overflow-hidden rounded-xl border border-line bg-surface text-xs font-bold", className)}>
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={clsx("px-2.5 py-1.5 transition", lang === "en" ? "bg-ink text-white" : "text-ink-soft hover:text-ink")}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("ar")}
        aria-pressed={lang === "ar"}
        className={clsx("px-2.5 py-1.5 transition", lang === "ar" ? "bg-ink text-white" : "text-ink-soft hover:text-ink")}
      >
        ع
      </button>
    </div>
  );
}
