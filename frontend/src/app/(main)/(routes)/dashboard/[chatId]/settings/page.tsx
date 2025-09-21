"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import { SimpleApiManager } from "@/components/simple-api-manager";
import { ResizableSidebar } from "@/app/(main)/components/resizable-sidebar";
import { useSidebarWidth } from "@/hooks/use-sidebar-width";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

interface ChatSettingsPageProps {
  params: Promise<{
    chatId: Id<"chats">;
  }>;
}

export default function ChatSettingsPage({ params }: ChatSettingsPageProps) {
  const router = useRouter();
  const { sidebarWidth } = useSidebarWidth();

  // Get chatId from params
  const unwrappedParams = React.use(params);
  const chatId = unwrappedParams.chatId;

  // Get chat data
  const currentChat = useQuery(api.chats.getChatById, { id: chatId });

  if (!currentChat) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Loading chat settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">

      {/* Resizable Sidebar */}
      <ResizableSidebar chatId={chatId} />

      {/* Main Content Area */}
      <div
        className="h-screen flex flex-col"
        style={{
          marginLeft: `${sidebarWidth}px`,
          transition: "margin-left 300ms ease-out",
        }}
      >

        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/dashboard/${chatId}`)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Chat
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Chat Settings
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  {currentChat.title}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <SimpleApiManager
              chatId={chatId}
              chatTitle={currentChat.title}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
