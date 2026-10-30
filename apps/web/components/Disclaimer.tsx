"use client";

import { Info } from "lucide-react";
import { useLang } from "@/lib/i18n";

/** Small, subtle transparency note. Unobtrusive; never a banner or modal. */
export function Disclaimer({ className = "" }: { className?: string }) {
  const { t } = useLang();
  return (
    <p className={`flex items-start justify-center gap-1.5 px-2 text-center text-[11px] leading-relaxed text-ink-muted ${className}`}>
      <Info size={12} className="mt-0.5 shrink-0 opacity-70" aria-hidden />
      <span>{t("disclaimer.text")}</span>
    </p>
  );
}
