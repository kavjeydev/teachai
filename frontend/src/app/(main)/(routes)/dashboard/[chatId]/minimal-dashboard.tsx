"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sanitizeHTML } from "@/lib/sanitization";

// Minimal dynamic imports for immediate loading
const HeavyDashboard = React.lazy(() =>
  import("./page").then(module => ({ default: module.default }))
);

interface MinimalDashboardProps {
  params: Promise<{
    chatId: Id<"chats">;
  }>;
}

export default function MinimalDashboard({ params }: MinimalDashboardProps) {
  const { user } = useUser();
  const [showFullDashboard, setShowFullDashboard] = useState(false);
  const [loadStartTime] = useState(Date.now());

  const unwrappedParams = React.use(params);
  const chatId = unwrappedParams.chatId;

  // Minimal chat data for immediate display
  const currentChat = useQuery(api.chats.getChatById, { id: chatId });
  const chatContent = useQuery(api.chats.getChatContent, { id: chatId });

  // Progressive enhancement - load full dashboard after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFullDashboard(true);
    }, 100); // Minimal delay to ensure smooth transition

    return () => clearTimeout(timer);
  }, []);

  // Show immediate minimal UI
  if (!showFullDashboard) {
    return (
      <div className="flex h-screen bg-white dark:bg-zinc-900">
        {/* Minimal Sidebar */}
        <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-lg font-semibold">
              <MessageSquare className="w-5 h-5" />
              <span>Trainly</span>
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {currentChat?.title || "Loading chat..."}
            </div>
          </div>
        </div>

        {/* Minimal Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b border-zinc-200 dark:border-zinc-800 p-4">
            <h1 className="text-xl font-semibold truncate">
              {currentChat?.title || "Chat"}
            </h1>
          </div>

          {/* Messages - Centered with consistent width */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              {chatContent && chatContent.length > 0 ? (
                chatContent.slice(-5).map((msg: any, index: number) => (
                  <div key={index} className="mb-4">
                    {msg.sender === "user" ? (
                      <div className="flex justify-end">
                        <div className="bg-blue-500 text-white rounded-2xl px-4 py-2 max-w-[75%] text-sm">
                          <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(msg.text) }} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-4 py-3 max-w-[85%] text-sm">
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-zinc-500 dark:text-zinc-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Start a conversation</p>
                </div>
              </div>
            )}
          </div>

          {/* Minimal Input - Same width as messages */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end space-x-2">
                <div className="flex-1 relative">
                  <textarea
                    className="w-full resize-none border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Loading full interface..."
                    rows={3}
                    disabled
                  />
                </div>
                <Button disabled size="sm">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Load full dashboard with Suspense
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-zinc-600 dark:text-zinc-400">Loading full dashboard...</p>
            <p className="text-xs text-zinc-500 mt-2">
              Loading time: {((Date.now() - loadStartTime) / 1000).toFixed(1)}s
            </p>
          </div>
        </div>
      }
    >
      <HeavyDashboard params={params} />
    </Suspense>
  );
}
