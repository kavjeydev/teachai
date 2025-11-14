"use client";

import { useUser } from "@clerk/clerk-react";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import { useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { Network } from "lucide-react";
import { captureEvent } from "@/lib/posthog";

// Use React.lazy for true code splitting - only loads when rendered
const GraphVisualizationNVL = dynamic(
  () => import("@/components/GraphVisualizationNVL"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Network className="w-8 h-8 text-white" />
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Loading graph visualization...
          </p>
        </div>
      </div>
    ),
  },
);

interface GraphPageProps {
  params: Promise<{
    chatId: Id<"chats">;
  }>;
}

export default function GraphPage({ params }: GraphPageProps) {
  const { user } = useUser();
  const [chatId, setChatId] = useState<Id<"chats"> | null>(null);
  const [isResolvingParams, setIsResolvingParams] = useState(true);

  // Resolve params asynchronously - don't block render
  useEffect(() => {
    const unwrapParams = async () => {
      try {
        const resolvedParams = await params;
        setChatId(resolvedParams.chatId);
        setIsResolvingParams(false);

        // Track graph page view in PostHog
        if (resolvedParams.chatId) {
          captureEvent("graph_page_viewed", {
            chatId: resolvedParams.chatId,
            source: "direct_navigation",
          });
        }
      } catch (error) {
        setIsResolvingParams(false);
      }
    };
    unwrapParams();
  }, [params]);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/";

  // Render skeleton immediately - don't wait for params or user
  return (
    <>
      {/* Graph Container - shows skeleton immediately */}
      <div className="flex-1 overflow-hidden relative border rounded-3xl border-zinc-200 dark:border-zinc-800 p-4">
            {/* Show skeleton while resolving params or waiting for user */}
            {isResolvingParams || !user || !chatId ? (
              <div className="h-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-xl overflow-hidden flex flex-col">
                {/* Skeleton Header */}
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center animate-pulse">
                      <Network className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mb-2" />
                      <div className="h-4 w-64 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Skeleton Graph Area */}
                <div className="flex-1 relative bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <Network className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {isResolvingParams || !chatId
                        ? "Loading graph..."
                        : "Preparing visualization..."}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-xl overflow-hidden flex flex-col">
                {/* Graph Header */}
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center">
                      <Network className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                        Knowledge Graph
                      </h2>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Visual representation of your knowledge relationships
                      </p>
                    </div>
                  </div>
                </div>

                {/* Graph Visualization - loads asynchronously */}
                <div className="flex-1 relative">
                  <Suspense
                    fallback={
                      <div className="h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/50">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <Network className="w-8 h-8 text-white" />
                          </div>
                          <p className="text-zinc-600 dark:text-zinc-400">
                            Loading graph visualization...
                          </p>
                        </div>
                      </div>
                    }
                  >
                    <GraphVisualizationNVL
                      chatId={chatId as string}
                      baseUrl={baseUrl}
                      disableAutoHighlight={true}
                    />
                  </Suspense>
                </div>
              </div>
            )}
      </div>
    </>
  );
}
