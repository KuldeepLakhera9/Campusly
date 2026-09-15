import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "accent" | "outline" | "subtle" | "success";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const base =
    "inline-flex items-center font-medium tracking-wide transition-colors select-none";

  const sizes = {
    sm: "text-[11px] px-2 py-0.5 rounded",
    md: "text-xs px-2.5 py-1 rounded-md",
  };

  const variants = {
    default:
      "bg-campus-muted-bg text-campus-charcoal border border-campus-border",
    accent:
      "bg-campus-accent-soft text-campus-accent border border-campus-accent-border/60",
    outline:
      "bg-transparent text-campus-muted border border-campus-border",
    subtle:
      "bg-stone-100 text-stone-700 border border-stone-200/80",
    success:
      "bg-emerald-50 text-emerald-800 border border-emerald-200",
  };

  return (
    <span className={cn(base, sizes[size], variants[variant], className)} {...props}>
      {children}
    </span>
  );
}
