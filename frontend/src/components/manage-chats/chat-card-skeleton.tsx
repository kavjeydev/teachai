"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function ChatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="h-1 w-full bg-zinc-300 dark:bg-zinc-700" />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="w-6 h-6 rounded" />
        </div>
        <Skeleton className="h-5 w-20 mb-3" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-3/4 mb-4" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}

