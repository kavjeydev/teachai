"use client";

import { useUser } from "@clerk/clerk-react";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ResizableSidebar } from "@/app/(main)/components/resizable-sidebar";
import { useSidebarWidth } from "@/hooks/use-sidebar-width";
import { ChatNavbar } from "@/app/(main)/components/chat-navbar";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Sparkles, Network, Eye } from "lucide-react";
import { captureEvent } from "@/lib/posthog";

const GraphVisualizationNVL = dynamic(
  () => import("@/components/GraphVisualizationNVL"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
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
  const { sidebarWidth } = useSidebarWidth();
  const [chatId, setChatId] = useState<Id<"chats"> | null>(null);

  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params;
      setChatId(resolvedParams.chatId);

      // Track graph page view in PostHog
      if (resolvedParams.chatId) {
        captureEvent("graph_page_viewed", {
          chatId: resolvedParams.chatId,
          source: "direct_navigation",
        });
      }
    };
    unwrapParams();
  }, [params]);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/";

  return (
    <div className="rounded-3xl overflow-hidden">
      <div className="h-full w-screen bg-gradient-to-br overflow-hidden rounded-3xl dark:bg-[#090909] bg-white px-4 pb-4">
        <Toaster position="top-center" richColors />

        {/* Resizable Sidebar */}
        <ResizableSidebar chatId={chatId} />

        {/* Main Content Area - Responsive to sidebar width */}
        <div
          className="h-[98vh] flex flex-col relative bg-gradient-to-b from-white via-white to-white dark:from-[#090909] dark:via-[#090909] dark:to-[#090909] rounded-3xl"
          style={{
            marginLeft: `${sidebarWidth}px`,
            transition: "margin-left 300ms ease-out",
          }}
        >
          <ChatNavbar chatId={chatId} />

          {/* Graph Container */}
          <div className="flex-1 overflow-hidden relative border rounded-3xl border-zinc-200 dark:border-zinc-800 p-4">
            {!user || !chatId ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 animate-pulse">
                    {!user ? "Loading..." : "Loading graph..."}
                  </p>
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

                {/* Graph Visualization */}
                <div className="flex-1 relative">
                  <GraphVisualizationNVL
                    chatId={chatId as string}
                    baseUrl={baseUrl}
                    disableAutoHighlight={true}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
