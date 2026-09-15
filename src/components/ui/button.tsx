import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "subtle";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-campus-accent/40 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98]";

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 rounded-md gap-1.5 tracking-wide",
      md: "text-sm px-4 py-2 rounded-lg gap-2",
      lg: "text-base px-5 py-2.5 rounded-lg gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-campus-accent text-white hover:bg-campus-accent-hover shadow-xs border border-transparent",
      secondary:
        "bg-campus-charcoal text-white hover:bg-stone-800 shadow-xs border border-transparent",
      outline:
        "bg-transparent text-campus-charcoal border border-campus-border hover:bg-campus-muted-bg hover:border-campus-border-strong",
      ghost:
        "bg-transparent text-campus-body hover:bg-campus-muted-bg hover:text-campus-charcoal",
      danger:
        "bg-red-700 text-white hover:bg-red-800 border border-transparent",
      subtle:
        "bg-campus-accent-soft text-campus-accent hover:bg-stone-200/60 border border-campus-accent-border/50",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
