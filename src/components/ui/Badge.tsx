import * as React from "react";
import { cn } from "@/lib/utils";

type Color = "green" | "amber" | "red" | "blue" | "grey";

const colorClasses: Record<Color, string> = {
  green: "bg-primary-light text-primary-dark",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800",
  grey: "bg-surface text-text-secondary",
};

const dotColorClasses: Record<Color, string> = {
  green: "bg-primary",
  amber: "bg-warning",
  red: "bg-error",
  blue: "bg-blue-500",
  grey: "bg-text-secondary",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: Color;
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({
  color = "grey",
  dot = false,
  pulse = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        colorClasses[color],
        className
      )}
      {...rest}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            dotColorClasses[color],
            pulse && "sf-pulse"
          )}
        />
      )}
      {children}
    </span>
  );
}
