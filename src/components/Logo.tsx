import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ size = 24 }: { size?: number }) {
  const dot = size > 24 ? 4 : 3;
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5 group"
      aria-label="SaaSForge home"
    >
      <span
        style={{ width: size, height: size }}
        className={cn(
          "shrink-0 rounded-md bg-primary",
          "grid place-content-center transition-transform duration-150 group-hover:scale-[1.05]"
        )}
      >
        <span
          className="grid"
          style={{
            gridTemplateColumns: `repeat(3, ${dot}px)`,
            gridTemplateRows: `repeat(3, ${dot}px)`,
            gap: 2,
          }}
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className="bg-white rounded-[1px]"
              style={{ width: dot, height: dot }}
            />
          ))}
        </span>
      </span>
      <span className="text-[18px] font-semibold text-primary">SaaSForge</span>
    </Link>
  );
}
