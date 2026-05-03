import * as React from "react";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const sizeClasses: Record<Size, string> = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
};

function initialsFromName(name?: string | null, email?: string | null) {
  const src = name?.trim() || email?.trim() || "?";
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase();
}

export function Avatar({
  src,
  name,
  email,
  size = "md",
  className,
}: {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: Size;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "shrink-0 inline-flex items-center justify-center rounded-full bg-primary-light text-primary-dark font-semibold uppercase overflow-hidden",
        sizeClasses[size],
        className
      )}
      aria-hidden={!name && !email}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name ?? email ?? "Avatar"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{initialsFromName(name, email)}</span>
      )}
    </div>
  );
}
