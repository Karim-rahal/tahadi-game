export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="grid place-items-center rounded-2xl bg-gradient-to-br from-gold-300 to-gold-600 font-display font-extrabold text-ink-900 shadow-glow"
        style={{ width: size, height: size, fontSize: size * 0.5 }}
        aria-hidden
      >
        د
      </div>
      <div className="leading-tight">
        <div className="font-display text-xl font-extrabold text-slate-50">تحدي الدروندي</div>
        <div className="text-xs text-muted">مسابقة الفريقين</div>
      </div>
    </div>
  );
}
