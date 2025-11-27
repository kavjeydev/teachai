"use client";

import React from "react";

export function ChatSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto relative p-12">
      <div className="w-full h-full px-4 py-3 max-w-4xl mx-auto space-y-6">
        {/* Skeleton Header */}
        <div className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />

        {/* Skeleton Messages */}
        <div className="space-y-4">
          <div className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse ml-12" />
          <div className="h-20 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
        </div>

        {/* Skeleton Input */}
        <div className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse mt-8" />
      </div>
    </div>
  );
}

