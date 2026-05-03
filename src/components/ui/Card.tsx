import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "interactive" | "selected";

const variantClasses: Record<Variant, string> = {
  default: "border border-border",
  interactive:
    "border border-border transition-all duration-150 hover:border-primary hover:shadow-md cursor-pointer",
  selected: "border-2 border-primary bg-primary-light",
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = "default", className, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl bg-bg p-5",
        variantClasses[variant],
        className
      )}
      {...rest}
    />
  );
});

export function CardHeader({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-3", className)} {...rest} />;
}

export function CardTitle({
  className,
  ...rest
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-semibold text-text-primary", className)}
      {...rest}
    />
  );
}

export function CardDescription({
  className,
  ...rest
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-sm text-text-secondary mt-1 leading-relaxed",
        className
      )}
      {...rest}
    />
  );
}
