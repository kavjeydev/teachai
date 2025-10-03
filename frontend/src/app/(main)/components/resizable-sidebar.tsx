"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { useRouter, usePathname } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PlusCircle,
  Home,
  Settings,
  MessageSquare,
  Star,
  Clock,
  LayoutGrid,
  ChevronRight,
  ChevronLeft,
  Network,
  Code,
  GripVertical,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { SignOutButton } from "@clerk/clerk-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigationLoading } from "@/components/app-loading-provider";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useConvexAuth } from "@/hooks/use-auth-state";
import { useSmoothNavigation } from "@/hooks/use-smooth-navigation";

interface ResizableSidebarParams {
  chatId?: Id<"chats">;
}

// Memoized chat item component for better performance
const ChatItem = React.memo(
  ({
    chat,
    isActive,
    onClick,
    isNavigatingTo,
  }: {
    chat: any;
    isActive: boolean;
    onClick: () => void;
    isNavigatingTo?: boolean;
  }) => {
    const handleClick = () => {
      onClick();
    };

    return (
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 group",
          isActive && "bg-amber-400/10 border border-amber-400/20",
          isNavigatingTo && "bg-amber-400/5", // Immediate feedback
        )}
      >
        <div
          className={cn(
            "w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0",
            isActive
              ? "bg-amber-400 text-white"
              : isNavigatingTo
                ? "bg-amber-400/50 text-white"
                : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400",
          )}
        >
          <MessageSquare className="h-3 w-3" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div
            className={cn(
              "text-sm font-medium truncate",
              isActive
                ? "text-amber-400"
                : isNavigatingTo
                  ? "text-amber-400/70"
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
        {isNavigatingTo && !isActive && (
          <div className="w-3 h-3 border border-amber-400/50 border-t-amber-400 rounded-full animate-spin" />
        )}
      </button>
    );
  },
);

ChatItem.displayName = "ChatItem";

export function ResizableSidebar({ chatId }: ResizableSidebarParams) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const { startNavigation } = useNavigationLoading();
  const { canQuery, skipQuery } = useConvexAuth();
  const { navigateTo, isNavigating } = useSmoothNavigation();

  // Extract current chatId from URL for immediate highlighting
  const currentChatId = React.useMemo(() => {
    const match = pathname.match(/\/dashboard\/([^\/]+)/);
    return match ? match[1] : chatId;
  }, [pathname, chatId]);

  const chats = useQuery(api.chats.getChats, canQuery ? undefined : skipQuery);
  const chatLimits = useQuery(
    api.chats.getUserChatLimits,
    canQuery ? undefined : skipQuery,
  );
  const favoriteChats = useQuery(
    api.chats.getFavoriteChats,
    canQuery ? undefined : skipQuery,
  );
  const addChat = useMutation(api.chats.createChat);

  // Sidebar state
  const [sidebarWidth, setSidebarWidth] = React.useState(320); // Default 320px
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);
  const [showContent, setShowContent] = React.useState(true); // For smooth expand animation
  const [isNavigatingToManage, setIsNavigatingToManage] = React.useState(false);
  const sidebarRef = React.useRef<HTMLDivElement>(null);

  // Load saved state from localStorage
  React.useEffect(() => {
    const savedWidth = localStorage.getItem("trainly-sidebar-width");
    const savedCollapsed = localStorage.getItem("trainly-sidebar-collapsed");

    if (savedWidth) {
      setSidebarWidth(parseInt(savedWidth, 10));
    }
    if (savedCollapsed) {
      setIsCollapsed(savedCollapsed === "true");
    }
  }, []);

  // Save state to localStorage and emit events
  React.useEffect(() => {
    localStorage.setItem("trainly-sidebar-width", sidebarWidth.toString());
    localStorage.setItem("trainly-sidebar-collapsed", isCollapsed.toString());

    // Emit custom event for same-tab updates
    window.dispatchEvent(new Event("sidebar-changed"));
  }, [sidebarWidth, isCollapsed]);

  // Handle resize
  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  React.useEffect(() => {
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      // Use requestAnimationFrame for smooth performance
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        const newWidth = Math.max(240, Math.min(600, e.clientX)); // Min 240px, Max 600px
        setSidebarWidth(newWidth);

        // Update CSS custom property for immediate visual feedback
        document.documentElement.style.setProperty(
          "--sidebar-width",
          `${newWidth}px`,
        );
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isResizing]);

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

  // Get pinned chats (optimized filtering)
  const pinnedChats = React.useMemo(() => {
    if (!favoriteChats) return [];
    return favoriteChats;
  }, [favoriteChats]);

  const onCreate = async () => {
    // Wait for chat limits to load if not available yet
    if (!chatLimits) {
      toast.error("Loading your account info, please wait...");
      return;
    }

    // Check if user can create more chats
    if (!chatLimits.canCreateMore) {
      const nextTier =
        chatLimits.tierName === "free"
          ? "Pro ($39/mo)"
          : chatLimits.tierName === "pro"
            ? "Scale ($199/mo)"
            : "Enterprise";
      toast.error(
        `You've reached your chat limit of ${chatLimits.chatLimit} chat${chatLimits.chatLimit > 1 ? "s" : ""} for the ${chatLimits.tierName} plan.`,
        {
          description: `Upgrade to ${nextTier} for more chats or archive existing ones.`,
          action: {
            label: "View Plans",
            onClick: () => window.open("/pricing", "_blank"),
          },
          duration: 8000,
        },
      );
      return;
    }

    try {
      await addChat({ title: "Untitled Chat" });
      toast.success("Created new chat!");
    } catch (error) {
      if (error instanceof Error) {
        // Show the exact error message from the backend with upgrade options
        const nextTier =
          chatLimits.tierName === "free"
            ? "Pro ($39/mo)"
            : chatLimits.tierName === "pro"
              ? "Scale ($199/mo)"
              : "Enterprise";
        toast.error(error.message, {
          description: `Upgrade to ${nextTier} for more chats or archive existing ones.`,
          action: {
            label: "View Plans",
            onClick: () => window.open("/pricing", "_blank"),
          },
          duration: 8000,
        });
      } else {
        toast.error("Failed to create chat");
      }
    }
  };

  const toggleCollapse = () => {
    if (!isCollapsed) {
      // Collapsing: hide content immediately
      setShowContent(false);
      setIsCollapsed(true);
    } else {
      // Expanding: show sidebar first, then content after animation
      setIsCollapsed(false);
      setTimeout(() => {
        setShowContent(true);
      }, 150); // Half the transition time for smooth reveal
    }
  };

  const collapsedWidth = 72; // Increased from 60 to 72px for better icon spacing
  const currentWidth = isCollapsed ? collapsedWidth : sidebarWidth;

  return (
    <>
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className="fixed left-0 top-0 h-full z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border-r border-zinc-200/50 dark:border-zinc-800/50"
        style={{
          width: `${currentWidth}px`,
          transition: isResizing ? "none" : "width 300ms ease-out",
        }}
      >
        <div className="w-full h-full flex flex-col">
          {/* Header */}
          <div
            className={cn(
              "border-b border-zinc-200/50 dark:border-zinc-800/50",
              isCollapsed ? "p-2" : "p-3",
            )}
          >
            {!isCollapsed ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center">
                    <img
                      src="/trainly_icon_black.png"
                      alt="Trainly Logo"
                      className="w-5 h-5 block dark:hidden"
                    />
                    <img
                      src="/trainly_icon_white.png"
                      alt="Trainly Logo"
                      className="w-5 h-5 hidden dark:block"
                    />
                  </div>
                  <div>
                    <h2 className="font-bold text-zinc-900 dark:text-white text-sm">
                      trainly
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-none">
                      GraphRAG Platform
                    </p>
                  </div>
                </div>

                <button
                  onClick={toggleCollapse}
                  className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="h-3.5 w-3.5 text-zinc-500" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                  <img
                    src="/trainly_icon_black.png"
                    alt="Trainly Logo"
                    className="w-6 h-6 block dark:hidden"
                  />
                  <img
                    src="/trainly_icon_white.png"
                    alt="Trainly Logo"
                    className="w-6 h-6 hidden dark:block"
                  />
                </div>

                <button
                  onClick={toggleCollapse}
                  className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Expand sidebar"
                >
                  <ChevronRight className="h-3 w-3 text-zinc-500" />
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {!isCollapsed && showContent ? (
              <div className="p-4">
                <>
                  {/* Quick Actions */}
                  <div className="mb-6">
                    <Button
                      onClick={onCreate}
                      className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-400/90 hover:to-amber-600/90 text-white rounded-xl shadow-lg hover:shadow-amber-400/25 transition-all duration-200 flex items-center gap-2 mb-4"
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
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 group"
                      >
                        <Home className="w-4 h-4 text-zinc-600 dark:text-zinc-400 group-hover:text-amber-400" />
                        <span className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-amber-400">
                          Home
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setIsNavigatingToManage(true);
                          const navigation = startNavigation("My Chats");
                          router.push("/dashboard/manage");
                          // Reset loading state after navigation
                          setTimeout(() => {
                            setIsNavigatingToManage(false);
                            navigation.finish();
                          }, 1000);
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 group"
                        disabled={isNavigatingToManage}
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
                            <ChatItem
                              chat={chat}
                              isActive={chat._id === currentChatId}
                              isNavigatingTo={isNavigating(
                                `/dashboard/${chat._id}`,
                              )}
                              onClick={() =>
                                navigateTo(`/dashboard/${chat._id}`)
                              }
                            />
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
                      {!chats
                        ? // Loading skeletons with improved styling
                          Array.from({ length: 3 }).map((_, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-2 animate-pulse"
                            >
                              <div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
                              <div className="flex-1 space-y-1">
                                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
                                <div className="h-2 bg-zinc-100 dark:bg-zinc-900 rounded w-1/2"></div>
                              </div>
                            </div>
                          ))
                        : recentChats.map((chat) => (
                            <div key={chat._id}>
                              <ChatItem
                                chat={chat}
                                isActive={chat._id === currentChatId}
                                isNavigatingTo={isNavigating(
                                  `/dashboard/${chat._id}`,
                                )}
                                onClick={() =>
                                  navigateTo(`/dashboard/${chat._id}`)
                                }
                              />
                            </div>
                          ))}

                      {/* See All Chats Link */}
                      <div>
                        <button
                          onClick={() => {
                            setIsNavigatingToManage(true);
                            router.push("/dashboard/manage");
                            setTimeout(
                              () => setIsNavigatingToManage(false),
                              1000,
                            );
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 group mt-2"
                          disabled={isNavigatingToManage}
                        >
                          <span className="text-sm text-zinc-600 dark:text-zinc-400 group-hover:text-amber-400">
                            {isNavigatingToManage
                              ? "Loading..."
                              : "View all chats"}
                          </span>
                          {isNavigatingToManage ? (
                            <div className="w-3 h-3 border border-amber-400/50 border-t-amber-400 rounded-full animate-spin" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-zinc-400 group-hover:text-amber-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="mb-6">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() =>
                          currentChatId &&
                          router.push(`/dashboard/${currentChatId}/graph`)
                        }
                        className="flex flex-col items-center gap-2 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors group"
                        disabled={!currentChatId}
                      >
                        <Network className="h-4 w-4 text-zinc-600 dark:text-zinc-400 group-hover:text-amber-400" />
                        <span className="text-xs text-zinc-600 dark:text-zinc-400 group-hover:text-amber-400">
                          Graph
                        </span>
                      </button>

                      <button
                        onClick={() => window.open("/api-docs", "_blank")}
                        className="flex flex-col items-center gap-2 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors group"
                      >
                        <Code className="h-4 w-4 text-zinc-600 dark:text-zinc-400 group-hover:text-amber-400" />
                        <span className="text-xs text-zinc-600 dark:text-zinc-400 group-hover:text-amber-400">
                          API
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              </div>
            ) : isCollapsed ? (
              /* Collapsed View - Optimized for 72px width */
              <div className="flex flex-col items-center space-y-3 p-2">
                {/* Collapsed Quick Actions */}
                <div className="space-y-2 w-full">
                  <button
                    onClick={onCreate}
                    className="w-10 h-10 bg-amber-400 hover:bg-amber-400/90 text-white rounded-lg shadow-md hover:shadow-amber-400/25 transition-all duration-200 flex items-center justify-center mx-auto"
                    title="New Chat"
                  >
                    <PlusCircle className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => router.push("/")}
                    className="w-10 h-10 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center mx-auto"
                    title="Home"
                  >
                    <Home className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  </button>

                  <button
                    onClick={() => {
                      setIsNavigatingToManage(true);
                      router.push("/dashboard/manage");
                      setTimeout(() => setIsNavigatingToManage(false), 1000);
                    }}
                    className="w-10 h-10 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center relative mx-auto"
                    title={`My Chats (${chats?.length || 0})`}
                    disabled={isNavigatingToManage}
                  >
                    {isNavigatingToManage ? (
                      <div className="w-4 h-4 border border-amber-400/50 border-t-amber-400 rounded-full animate-spin" />
                    ) : (
                      <>
                        <LayoutGrid className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                        {chats && chats.length > 0 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-white text-xs rounded-full flex items-center justify-center">
                            {chats.length > 9 ? "9" : chats.length}
                          </div>
                        )}
                      </>
                    )}
                  </button>
                </div>

                {/* Divider */}
                <div className="w-6 h-px bg-zinc-200 dark:bg-zinc-800 mx-auto"></div>

                {/* Recent Chats - Collapsed */}
                <div className="space-y-2 w-full">
                  {recentChats.slice(0, 3).map((chat) => (
                    <button
                      key={chat._id}
                      onClick={() => router.push(`/dashboard/${chat._id}`)}
                      className={cn(
                        "w-10 h-10 rounded-lg transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center mx-auto",
                        chat._id === currentChatId &&
                          "bg-amber-400/10 ring-2 ring-amber-400/30",
                      )}
                      title={chat.title}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-md flex items-center justify-center",
                          chat._id === currentChatId
                            ? "bg-amber-400 text-white"
                            : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400",
                        )}
                      >
                        <MessageSquare className="h-3 w-3" />
                      </div>
                    </button>
                  ))}
                </div>

                {/* Quick Access to Graph */}
                {currentChatId && (
                  <div className="pt-2 w-full">
                    <button
                      onClick={() =>
                        router.push(`/dashboard/${currentChatId}/graph`)
                      }
                      className="w-10 h-10 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center mx-auto"
                      title="Graph View"
                    >
                      <Network className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Footer */}
          {!isCollapsed ? (
            <div className="p-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={() => router.push("/profile")}
                  className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user?.imageUrl}
                      className="rounded-full"
                    />
                    <AvatarFallback className="bg-amber-400 text-white text-sm">
                      {user?.firstName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-medium text-sm text-zinc-900 dark:text-white truncate">
                      {user?.firstName}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      View Profile & Usage
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/profile")}
                    className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-amber-400 rounded-lg"
                    title="Profile Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <SignOutButton>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-zinc-500 hover:text-red-600 rounded-lg"
                      title="Sign Out"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </SignOutButton>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
              <button
                onClick={() => router.push("/profile")}
                className="w-full flex justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg p-2 transition-colors"
                title="View Profile & Usage"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.imageUrl} className="rounded-full" />
                  <AvatarFallback className="bg-amber-400 text-white text-sm">
                    {user?.firstName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>
          )}
        </div>

        {/* Resize Handle */}
        {!isCollapsed && (
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize group hover:bg-amber-400/20 transition-colors"
            onMouseDown={handleMouseDown}
          >
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-amber-400 text-white p-1 rounded-md shadow-lg">
                <GripVertical className="h-3 w-3" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay when resizing */}
      {isResizing && <div className="fixed inset-0 z-50 cursor-col-resize" />}
    </>
  );
}
