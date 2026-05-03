import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const sizeMap: Record<Size, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-[2.5px]",
  lg: "h-10 w-10 border-[3px]",
};

export function Spinner({
  size = "md",
  className,
}: {
  size?: Size;
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block rounded-full border-current border-r-transparent border-b-transparent text-primary",
        "[animation:sf-spin_0.8s_linear_infinite]",
        sizeMap[size],
        className
      )}
    />
  );
}
