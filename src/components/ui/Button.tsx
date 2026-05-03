import * as React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

type Variant = "primary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-dark active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary",
  outline:
    "border-[1.5px] border-primary text-primary bg-transparent hover:bg-primary-light disabled:opacity-40 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-text-primary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed",
  danger:
    "bg-error text-white hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-md",
  md: "h-11 px-5 text-[15px] rounded-lg",
  lg: "h-13 px-7 text-base rounded-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className,
      children,
      ...rest
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium",
          "transition-all duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...rest}
      >
        {loading && (
          <Spinner
            size="sm"
            className={
              variant === "primary" || variant === "danger"
                ? "text-white"
                : "text-primary"
            }
          />
        )}
        {children}
      </button>
    );
  }
);
