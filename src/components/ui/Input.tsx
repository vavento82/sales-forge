import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string | null;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ error, label, id, className, ...rest }, ref) {
    const inputId = id || rest.name;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-medium uppercase tracking-[0.06em] text-text-secondary mb-2"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full h-13 px-4 rounded-md text-base text-text-primary bg-bg",
            "border-[1.5px] border-border outline-none transition-all duration-150",
            "focus:border-primary focus:ring-[3px] focus:ring-primary/15",
            error && "border-error focus:border-error focus:ring-error/15",
            className
          )}
          {...rest}
        />
        {error && (
          <p role="alert" className="mt-2 text-[13px] text-error">
            {error}
          </p>
        )}
      </div>
    );
  }
);
