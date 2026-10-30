import { Swords } from "lucide-react";

/**
 * Brand mark: a rounded tile split by a diagonal "duel seam" — Team A teal
 * meeting Team B orange — with the crossed-swords motif on top.
 */
export function Logo({ size = 40, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="relative grid shrink-0 place-items-center rounded-2xl shadow-pop"
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, #0E9CB8 0 49.4%, #F97316 50.6% 100%)",
        }}
        aria-hidden
      >
        <Swords size={size * 0.52} className="text-white" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }} />
      </div>
      {withText && <div className="font-display text-lg font-bold text-ink">تحدي الدروندي</div>}
    </div>
  );
}
