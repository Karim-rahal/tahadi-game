/**
 * Brand mark: a rounded tile split by a diagonal "duel seam" — Team A cyan
 * meeting Team B magenta — the recurring motif of the whole product.
 */
export function Logo({ size = 40, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="relative grid shrink-0 place-items-center rounded-2xl font-display font-bold text-white shadow-pop"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.46,
          background: "linear-gradient(135deg, #0E9CB8 0 49.4%, #C32E91 50.6% 100%)",
        }}
        aria-hidden
      >
        <span style={{ textShadow: "0 1px 3px rgba(0,0,0,0.28)" }}>د</span>
      </div>
      {withText && (
        <div className="leading-tight">
          <div className="font-display text-lg font-bold text-ink">تحدي الدروندي</div>
          <div className="text-xs font-medium text-ink-muted">مسابقة الفريقين</div>
        </div>
      )}
    </div>
  );
}
