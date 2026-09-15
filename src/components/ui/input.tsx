import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, helperText, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold tracking-wide uppercase text-campus-muted"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            "w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg text-campus-charcoal placeholder:text-campus-subtle transition-colors duration-150 outline-none",
            error
              ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500/20"
              : "border-campus-border hover:border-campus-border-strong focus:border-campus-charcoal focus:ring-1 focus:ring-campus-charcoal/15",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-600 font-medium">{error}</p>
        )}
        {!error && helperText && (
          <p className="text-xs text-campus-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helperText, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold tracking-wide uppercase text-campus-muted"
          >
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={cn(
            "w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg text-campus-charcoal placeholder:text-campus-subtle transition-colors duration-150 outline-none resize-y min-h-[90px]",
            error
              ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500/20"
              : "border-campus-border hover:border-campus-border-strong focus:border-campus-charcoal focus:ring-1 focus:ring-campus-charcoal/15",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-600 font-medium">{error}</p>
        )}
        {!error && helperText && (
          <p className="text-xs text-campus-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
