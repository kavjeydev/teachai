"use client";

import React, { Suspense } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

const ChatSettingsPage = dynamic(
  () =>
    import("@/components/chat-settings-page").then((mod) => ({
      default: mod.ChatSettingsPage,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse h-64 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
    ),
  },
);

interface CustomSettingsViewProps {
  effectiveChatId: Id<"chats"> | null;
  showSkeleton: boolean;
}

export function CustomSettingsView({
  effectiveChatId,
  showSkeleton,
}: CustomSettingsViewProps) {
  return (
    <div className="flex-1 overflow-y-auto relative p-12">
      <div className="w-full h-full px-4 py-3 max-w-4xl mx-auto space-y-6">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
            Custom Settings
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Configure AI model settings for this chat
          </p>
        </div>

        {showSkeleton ? (
          <div className="space-y-4">
            <Skeleton className="h-48 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
            <Skeleton className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
          </div>
        ) : effectiveChatId ? (
          <Suspense
            fallback={
              <div className="animate-pulse h-64 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
            }
          >
            <ChatSettingsPage chatId={effectiveChatId} />
          </Suspense>
        ) : (
          <div className="space-y-4">
            <Skeleton className="h-48 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
            <Skeleton className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
          </div>
        )}
      </div>
    </div>
  );
}

