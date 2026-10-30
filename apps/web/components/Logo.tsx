/**
 * Brand mark: a rounded tile split by a diagonal "duel seam" — the two-team
 * motif — in cyan and red.
 */
export function Logo({ size = 40, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="shrink-0 rounded-2xl shadow-pop"
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, #0E9CB8 0 49.4%, #E23744 50.6% 100%)",
        }}
        aria-hidden
      />
      {withText && <div className="font-display text-lg font-bold text-ink">تحدي الدروندي</div>}
    </div>
  );
}
