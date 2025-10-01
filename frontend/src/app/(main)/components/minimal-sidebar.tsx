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
  CreditCard,
  User,
} from "lucide-react";
import { SignOutButton } from "@clerk/clerk-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSmoothNavigation } from "@/hooks/use-smooth-navigation";

interface MinimalSidebarParams {
  chatId?: Id<"chats">;
}

export function MinimalSidebar({ chatId }: MinimalSidebarParams) {
  const router = useRouter();
  const { user } = useUser();
  const [isCreatingChat, setIsCreatingChat] = React.useState(false);
  const [isNavigatingToManage, setIsNavigatingToManage] = React.useState(false);
  const [isNavigatingToHome, setIsNavigatingToHome] = React.useState(false);
  const { navigateTo, isNavigating } = useSmoothNavigation();

  const chats = useQuery(api.chats.getChats);
  const chatLimits = useQuery(api.chats.getUserChatLimits);
  const subscription = useQuery(api.subscriptions.getUserSubscription);
  const addChat = useMutation(api.chats.createChat);

  // State for billing portal
  const [isPortalLoading, setIsPortalLoading] = React.useState(false);

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

  const onCreate = async () => {
    // Check if user can create more chats
    if (chatLimits && !chatLimits.canCreateMore) {
      toast.error(
        `You've reached your chat limit of ${chatLimits.chatLimit} chat${chatLimits.chatLimit > 1 ? "s" : ""} for the ${chatLimits.tierName} plan. Please upgrade your plan or archive existing chats to create new ones.`,
      );
      return;
    }

    setIsCreatingChat(true);
    try {
      await addChat({ title: "Untitled Chat" });
      toast.success("Created new chat!");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create chat");
      }
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleManageBilling = async () => {
    setIsPortalLoading(true);
    try {
      const response = await fetch("/api/stripe/customer-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log("Billing portal error:", errorData); // Debug logging
        throw new Error(errorData.error || "Failed to open billing portal");
      }

      const { url } = await response.json();
      window.open(url, "_blank");
    } catch (error) {
      console.error("Billing portal failed:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to open billing portal");
      }
    } finally {
      setIsPortalLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center">
            <img
              src="/trainly_icon_white.png"
              alt="Trainly Logo"
              className="w-6 h-6 block dark:hidden"
            />
            <img
              src="/trainly_icon_black.png"
              alt="Trainly Logo"
              className="w-6 h-6 hidden dark:block"
            />
          </div>
          <div>
            <h2 className="font-bold text-zinc-900 dark:text-white">trainly</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
            disabled={isCreatingChat}
            className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-400/90 hover:to-amber-600/90 disabled:from-amber-400/50 disabled:to-amber-600/50 disabled:cursor-not-allowed text-white rounded-xl shadow-lg hover:shadow-amber-400/25 transition-all duration-200 flex items-center gap-2 mb-4"
          >
            {isCreatingChat ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4" />
                New Chat
              </>
            )}
          </Button>
        </div>

        {/* Navigation */}
        <div className="mb-6">
          <div className="space-y-1">
            <button
              onClick={() => {
                setIsNavigatingToHome(true);
                router.push("/");
                // Reset loading state after navigation
                setTimeout(() => {
                  setIsNavigatingToHome(false);
                }, 1500);
              }}
              disabled={isNavigatingToHome}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 group disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isNavigatingToHome ? (
                <div className="w-4 h-4 border border-amber-400/50 border-t-amber-400 rounded-full animate-spin" />
              ) : (
                <Home className="w-4 h-4 text-zinc-600 dark:text-zinc-400 group-hover:text-amber-400" />
              )}
              <span className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-amber-400">
                Home
              </span>
            </button>

            <button
              onClick={() => {
                setIsNavigatingToManage(true);
                router.push("/dashboard/manage");
                // Reset loading state after navigation
                setTimeout(() => {
                  setIsNavigatingToManage(false);
                }, 2000);
              }}
              disabled={isNavigatingToManage}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 group disabled:opacity-75 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <LayoutGrid className="w-4 h-4 text-zinc-600 dark:text-zinc-400 group-hover:text-amber-400" />
                <span className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-amber-400">
                  My Chats
                </span>
              </div>
              <div className="flex items-center gap-1">
                {isNavigatingToManage ? (
                  <div className="w-3 h-3 border border-amber-400/50 border-t-amber-400 rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="text-xs text-zinc-400">
                      {chats?.length || 0}
                    </span>
                    <ChevronRight className="w-3 h-3 text-zinc-400 group-hover:text-amber-400" />
                  </>
                )}
              </div>
            </button>

            <button
              onClick={() => router.push("/profile")}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 group"
            >
              <User className="w-4 h-4 text-zinc-600 dark:text-zinc-400 group-hover:text-amber-400" />
              <span className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-amber-400">
                Profile & Usage
              </span>
            </button>

            <button
              onClick={handleManageBilling}
              disabled={isPortalLoading}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPortalLoading ? (
                <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin text-zinc-600 dark:text-zinc-400" />
              ) : (
                <CreditCard className="w-4 h-4 text-zinc-600 dark:text-zinc-400 group-hover:text-amber-400" />
              )}
              <span className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-amber-400">
                {isPortalLoading ? "Opening Portal..." : "Billing & Credits"}
              </span>
            </button>
          </div>
        </div>

        {/* Pinned Chats */}
        {pinnedChats.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 font-semibold mb-3 text-sm">
              <Star className="h-3 w-3" />
              <span>Pinned</span>
            </div>
            <div className="space-y-1">
              {pinnedChats.map((chat) => (
                <div key={chat._id}>
                  <button
                    onClick={() => navigateTo(`/dashboard/${chat._id}`)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                      chat._id === chatId &&
                        "bg-amber-400/10 border border-amber-400/20",
                      isNavigating(`/dashboard/${chat._id}`) &&
                        "bg-amber-400/5",
                    )}
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0",
                        chat._id === chatId
                          ? "bg-amber-400 text-white"
                          : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400",
                      )}
                    >
                      <MessageSquare className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div
                        className={cn(
                          "text-sm font-medium truncate",
                          chat._id === chatId
                            ? "text-amber-400"
                            : "text-zinc-900 dark:text-white",
                        )}
                      >
                        {chat.title}
                      </div>
                    </div>
                    {isNavigating(`/dashboard/${chat._id}`) &&
                    chat._id !== chatId ? (
                      <div className="w-3 h-3 border border-amber-400/50 border-t-amber-400 rounded-full animate-spin" />
                    ) : (
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Chats */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 font-semibold mb-3 text-sm">
            <Clock className="h-3 w-3" />
            <span>Recent</span>
          </div>
          <div className="space-y-1">
            {recentChats.map((chat) => (
              <div key={chat._id}>
                <button
                  onClick={() => navigateTo(`/dashboard/${chat._id}`)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                    chat._id === chatId &&
                      "bg-amber-400/10 border border-amber-400/20",
                    isNavigating(`/dashboard/${chat._id}`) && "bg-amber-400/5",
                  )}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0",
                      chat._id === chatId
                        ? "bg-amber-400 text-white"
                        : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400",
                    )}
                  >
                    <MessageSquare className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div
                      className={cn(
                        "text-sm font-medium truncate",
                        chat._id === chatId
                          ? "text-amber-400"
                          : "text-zinc-900 dark:text-white",
                      )}
                    >
                      {chat.title}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {chat.context?.length || 0} docs •{" "}
                      {new Date(chat._creationTime).toLocaleDateString()}
                    </div>
                  </div>
                  {isNavigating(`/dashboard/${chat._id}`) &&
                    chat._id !== chatId && (
                      <div className="w-3 h-3 border border-amber-400/50 border-t-amber-400 rounded-full animate-spin" />
                    )}
                </button>
              </div>
            ))}

            {/* See All Chats Link */}
            <div>
              <button
                onClick={() => router.push("/dashboard/manage")}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 group mt-2"
              >
                <span className="text-sm text-zinc-600 dark:text-zinc-400 group-hover:text-amber-400">
                  View all chats
                </span>
                <ChevronRight className="w-3 h-3 text-zinc-400 group-hover:text-amber-400" />
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
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors group"
              disabled={!chatId}
            >
              <Network className="h-4 w-4 text-zinc-600 dark:text-zinc-400 group-hover:text-amber-400" />
              <span className="text-xs text-zinc-600 dark:text-zinc-400 group-hover:text-amber-400">
                Graph
              </span>
            </button>

            <button
              onClick={() =>
                window.open("https://docs.trainlyai.com", "_blank")
              }
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors group"
            >
              <Code className="h-4 w-4 text-zinc-600 dark:text-zinc-400 group-hover:text-amber-400" />
              <span className="text-xs text-zinc-600 dark:text-zinc-400 group-hover:text-amber-400">
                API
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-700">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.imageUrl} className="rounded-full" />
            <AvatarFallback className="bg-amber-400 text-white text-sm">
              {user?.firstName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-zinc-900 dark:text-white truncate">
              {user?.firstName}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {chats?.length || 0} chats
            </div>
          </div>
          <SignOutButton>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-lg"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
