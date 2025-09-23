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

const GraphVisualizationNVL = dynamic(
  () => import("@/components/GraphVisualizationNVL"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Network className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 dark:text-slate-400">
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
    };
    unwrapParams();
  }, [params]);

  if (!user) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!chatId) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Network className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 dark:text-slate-400">Loading graph...</p>
        </div>
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/";

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Toaster position="top-center" richColors />
      {/* Resizable Sidebar */}
      <ResizableSidebar chatId={chatId} />

      {/* Main Content Area - Responsive to sidebar width */}
      <div
        className="h-screen flex flex-col"
        style={{
          marginLeft: `${sidebarWidth}px`,
          transition: "margin-left 300ms ease-out",
        }}
      >
        <ChatNavbar chatId={chatId} />

        {/* Graph Container */}
        <div className="flex-1 p-6">
          <div className="h-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col">
            {/* Graph Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-xl flex items-center justify-center">
                  <Network className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Knowledge Graph
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
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
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
