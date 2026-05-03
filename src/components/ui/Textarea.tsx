"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string | null;
  label?: string;
  showCounter?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { error, label, showCounter, maxLength, value, defaultValue, id, className, onChange, ...rest },
    ref
  ) {
    const initial =
      typeof value === "string"
        ? value.length
        : typeof defaultValue === "string"
        ? defaultValue.length
        : 0;
    const [length, setLength] = React.useState(initial);
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
        <div className="relative">
          <textarea
            ref={ref}
            id={inputId}
            maxLength={maxLength}
            value={value}
            defaultValue={defaultValue}
            onChange={(e) => {
              setLength(e.target.value.length);
              onChange?.(e);
            }}
            className={cn(
              "w-full min-h-[100px] px-4 py-3.5 rounded-md text-base text-text-primary bg-bg",
              "border-[1.5px] border-border outline-none transition-all duration-150 resize-y leading-relaxed",
              "focus:border-primary focus:ring-[3px] focus:ring-primary/15",
              error && "border-error focus:border-error focus:ring-error/15",
              className
            )}
            {...rest}
          />
          {showCounter && maxLength && (
            <span
              className={cn(
                "absolute bottom-2 right-3 text-[13px] bg-bg px-1 pointer-events-none",
                length > maxLength * 0.9 ? "text-error" : "text-text-secondary"
              )}
            >
              {length} / {maxLength}
            </span>
          )}
        </div>
        {error && (
          <p role="alert" className="mt-2 text-[13px] text-error">
            {error}
          </p>
        )}
      </div>
    );
  }
);
