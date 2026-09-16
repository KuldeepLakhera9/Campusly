import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-stone-200/70 dark:bg-stone-800/60",
        className
      )}
      {...props}
    />
  );
}

export function PostCardSkeleton() {
  return (
    <div className="p-5 rounded-xl border border-campus-border/70 bg-white shadow-2xs space-y-3.5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="w-28 h-3.5" />
            <Skeleton className="w-20 h-2.5" />
          </div>
        </div>
        <Skeleton className="w-16 h-5 rounded-full" />
      </div>
      <div className="space-y-2 pt-1">
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-5/6 h-4" />
        <Skeleton className="w-2/3 h-4" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-campus-border/40">
        <div className="flex gap-4">
          <Skeleton className="w-12 h-6 rounded-md" />
          <Skeleton className="w-12 h-6 rounded-md" />
        </div>
        <Skeleton className="w-8 h-6 rounded-md" />
      </div>
    </div>
  );
}

export function HangoutCardSkeleton() {
  return (
    <div className="p-5 rounded-xl border border-campus-border/70 bg-white shadow-2xs space-y-3.5 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="w-24 h-5 rounded-md" />
        <Skeleton className="w-16 h-4 rounded-full" />
      </div>
      <Skeleton className="w-3/4 h-5" />
      <div className="space-y-2">
        <Skeleton className="w-48 h-3.5" />
        <Skeleton className="w-36 h-3.5" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-campus-border/40">
        <div className="flex -space-x-1.5">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="w-6 h-6 rounded-full" />
        </div>
        <Skeleton className="w-20 h-7 rounded-lg" />
      </div>
    </div>
  );
}

export function ChatMessageSkeleton() {
  return (
    <div className="space-y-4 p-4 animate-pulse">
      <div className="flex items-start gap-2 max-w-[70%]">
        <Skeleton className="w-7 h-7 rounded-full shrink-0" />
        <div className="space-y-1.5">
          <Skeleton className="w-44 h-10 rounded-2xl rounded-tl-xs" />
          <Skeleton className="w-12 h-2.5" />
        </div>
      </div>
      <div className="flex items-start gap-2 max-w-[70%] ml-auto flex-row-reverse">
        <div className="space-y-1.5 items-end flex flex-col">
          <Skeleton className="w-56 h-12 rounded-2xl rounded-tr-xs bg-stone-300" />
          <Skeleton className="w-14 h-2.5" />
        </div>
      </div>
      <div className="flex items-start gap-2 max-w-[70%]">
        <Skeleton className="w-7 h-7 rounded-full shrink-0" />
        <div className="space-y-1.5">
          <Skeleton className="w-32 h-8 rounded-2xl rounded-tl-xs" />
          <Skeleton className="w-10 h-2.5" />
        </div>
      </div>
    </div>
  );
}

export function ConversationThreadSkeleton() {
  return (
    <div className="p-4 flex items-start gap-3 animate-pulse">
      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between items-center">
          <Skeleton className="w-24 h-3.5" />
          <Skeleton className="w-12 h-2.5" />
        </div>
        <Skeleton className="w-40 h-3" />
        <Skeleton className="w-20 h-2.5" />
      </div>
    </div>
  );
}

