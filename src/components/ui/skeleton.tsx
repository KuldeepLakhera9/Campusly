import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse bg-stone-200/70 rounded-md",
        className
      )}
      {...props}
    />
  );
}
