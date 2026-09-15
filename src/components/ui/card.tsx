import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({
  className,
  interactive = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-campus-border rounded-lg shadow-2xs transition-all duration-150",
        interactive &&
          "hover:border-campus-border-strong hover:shadow-xs cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("p-5 sm:p-6 border-b border-campus-border/70", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5 sm:p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "p-4 sm:px-6 bg-campus-bg/50 border-t border-campus-border/70 flex items-center justify-between rounded-b-lg",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
