"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Home,
  Settings,
  MessageSquare,
  Star,
  Clock,
  LayoutGrid,
  ChevronRight,
  Network,
  Code,
} from "lucide-react";
import { SignOutButton } from "@clerk/clerk-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MinimalSidebarParams {
  chatId?: Id<"chats">;
}

export function MinimalSidebar({ chatId }: MinimalSidebarParams) {
  const router = useRouter();
  const { user } = useUser();

  const chats = useQuery(api.chats.getChats);
  const addChat = useMutation(api.chats.createChat);

  // Get recent chats (last 5)
  const recentChats = React.useMemo(() => {
    if (!chats) return [];
    return chats
      .sort(
        (a, b) =>
          new Date(b._creationTime).getTime() -
          new Date(a._creationTime).getTime(),
      )
      .slice(0, 5);
  }, [chats]);

  // Get pinned chats (simulated for now)
  const pinnedChats = React.useMemo(() => {
    if (!chats) return [];
    return chats
      .filter(
        (chat) =>
          chat.title.toLowerCase().includes("important") ||
          chat.title.toLowerCase().includes("project") ||
          chat.title.toLowerCase().includes("work"),
      )
      .slice(0, 3);
  }, [chats]);

  const onCreate = () => {
    const promise = addChat({ title: "Untitled Chat" });
    toast.success("Created new chat!");
  };

  return (
    <div className="w-full h-full flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">
              trainly
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              GraphRAG Platform
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Quick Actions */}
        <div className="mb-6">
          <Button
            onClick={onCreate}
            className="w-full bg-gradient-to-r from-trainlymainlight to-purple-600 hover:from-trainlymainlight/90 hover:to-purple-600/90 text-white rounded-xl shadow-lg hover:shadow-trainlymainlight/25 transition-all duration-200 flex items-center gap-2 mb-4"
          >
            <PlusCircle className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        {/* Navigation */}
        <div className="mb-6">
          <div className="space-y-1">
            <button
              onClick={() => router.push("/")}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 group"
            >
              <Home className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-trainlymainlight" />
              <span className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-trainlymainlight">
                Home
              </span>
            </button>

            <button
              onClick={() => router.push("/dashboard/manage")}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <LayoutGrid className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-trainlymainlight" />
                <span className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-trainlymainlight">
                  My Chats
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400">
                  {chats?.length || 0}
                </span>
                <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-trainlymainlight" />
              </div>
            </button>
          </div>
        </div>

        {/* Pinned Chats */}
        {pinnedChats.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-semibold mb-3 text-sm">
              <Star className="h-3 w-3" />
              <span>Pinned</span>
            </div>
            <div className="space-y-1">
              {pinnedChats.map((chat) => (
                <div key={chat._id}>
                  <button
                    onClick={() => router.push(`/dashboard/${chat._id}`)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800",
                      chat._id === chatId &&
                        "bg-trainlymainlight/10 border border-trainlymainlight/20",
                    )}
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0",
                        chat._id === chatId
                          ? "bg-trainlymainlight text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
                      )}
                    >
                      <MessageSquare className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div
                        className={cn(
                          "text-sm font-medium truncate",
                          chat._id === chatId
                            ? "text-trainlymainlight"
                            : "text-slate-900 dark:text-white",
                        )}
                      >
                        {chat.title}
                      </div>
                    </div>
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Chats */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-semibold mb-3 text-sm">
            <Clock className="h-3 w-3" />
            <span>Recent</span>
          </div>
          <div className="space-y-1">
            {recentChats.map((chat) => (
              <div key={chat._id}>
                <button
                  onClick={() => router.push(`/dashboard/${chat._id}`)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800",
                    chat._id === chatId &&
                      "bg-trainlymainlight/10 border border-trainlymainlight/20",
                  )}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0",
                      chat._id === chatId
                        ? "bg-trainlymainlight text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
                    )}
                  >
                    <MessageSquare className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div
                      className={cn(
                        "text-sm font-medium truncate",
                        chat._id === chatId
                          ? "text-trainlymainlight"
                          : "text-slate-900 dark:text-white",
                      )}
                    >
                      {chat.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {chat.context?.length || 0} docs •{" "}
                      {new Date(chat._creationTime).toLocaleDateString()}
                    </div>
                  </div>
                </button>
              </div>
            ))}

            {/* See All Chats Link */}
            <div>
              <button
                onClick={() => router.push("/dashboard/manage")}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 group mt-2"
              >
                <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-trainlymainlight">
                  View all chats
                </span>
                <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-trainlymainlight" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() =>
                chatId && router.push(`/dashboard/${chatId}/graph`)
              }
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
              disabled={!chatId}
            >
              <Network className="h-4 w-4 text-slate-600 dark:text-slate-400 group-hover:text-trainlymainlight" />
              <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-trainlymainlight">
                Graph
              </span>
            </button>

            <button
              onClick={() =>
                window.open("https://docs.trainlyai.com", "_blank")
              }
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
            >
              <Code className="h-4 w-4 text-slate-600 dark:text-slate-400 group-hover:text-trainlymainlight" />
              <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-trainlymainlight">
                API
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.imageUrl} className="rounded-full" />
            <AvatarFallback className="bg-trainlymainlight text-white text-sm">
              {user?.firstName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-slate-900 dark:text-white truncate">
              {user?.firstName}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {chats?.length || 0} chats
            </div>
          </div>
          <SignOutButton>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
