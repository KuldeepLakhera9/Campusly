import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "py-12 px-6 text-center border border-dashed border-campus-border rounded-lg bg-campus-bg/40 max-w-lg mx-auto my-6",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="w-10 h-10 mx-auto mb-3.5 flex items-center justify-center rounded-lg bg-campus-muted-bg text-campus-muted border border-campus-border">
          {icon}
        </div>
      )}
      <h3 className="font-serif text-lg font-normal text-campus-charcoal tracking-tight">
        {title}
      </h3>
      <p className="mt-1.5 text-xs sm:text-sm text-campus-muted max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
