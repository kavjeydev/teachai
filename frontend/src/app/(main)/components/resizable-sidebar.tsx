"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { useRouter, usePathname } from "next/navigation";
import { useOptimizedNavigation } from "@/hooks/use-optimized-navigation";
import { startTransition } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Settings,
  LayoutGrid,
  ChevronRight,
  ChevronLeft,
  GripVertical,
  LogOut,
  Rocket,
  Wrench,
  Key,
  BarChart3,
  TestTube,
  Network,
  MessageSquare,
  Upload,
  FileText,
} from "lucide-react";
import { SignOutButton } from "@clerk/clerk-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigationLoading } from "@/components/app-loading-provider";
import { useConvexAuth } from "@/hooks/use-auth-state";
import { FeedbackForm } from "@/components/feedback-form";
import { useOrganization } from "@/components/organization-provider";

interface ResizableSidebarParams {
  chatId?: Id<"chats">;
}

export function ResizableSidebar({ chatId }: ResizableSidebarParams) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const { startNavigation } = useNavigationLoading();
  const { canQuery, skipQuery } = useConvexAuth();
  const { navigate } = useOptimizedNavigation();
  const { currentOrganizationId } = useOrganization();

  const chats = useQuery(
    api.chats.getChats,
    currentOrganizationId && canQuery
      ? { organizationId: currentOrganizationId }
      : skipQuery,
  );
  const chatLimits = useQuery(
    api.chats.getUserChatLimits,
    currentOrganizationId && canQuery
      ? { organizationId: currentOrganizationId }
      : skipQuery,
  );
  const addChat = useMutation(api.chats.createChat);

  // Sidebar state
  const [sidebarWidth, setSidebarWidth] = React.useState(250); // Default 200px
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);
  const [showContent, setShowContent] = React.useState(true); // For smooth expand animation
  const [isNavigatingToManage, setIsNavigatingToManage] = React.useState(false);
  const [activeView, setActiveView] = React.useState<string>("testing");
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);
  const sidebarRef = React.useRef<HTMLDivElement>(null);

  // Sync activeView with URL pathname
  React.useEffect(() => {
    if (pathname === "/") {
      setActiveView("home");
    } else if (pathname.includes("/dashboard/manage")) {
      setActiveView("manage");
    } else if (pathname.includes("/graph")) {
      setActiveView("graph");
    } else if (pathname.includes("/testing")) {
      setActiveView("testing");
    } else if (pathname.includes("/files")) {
      setActiveView("files");
    } else if (pathname.includes("/api-keys")) {
      setActiveView("api-keys");
    } else if (pathname.includes("/custom-settings")) {
      setActiveView("custom-settings");
    } else if (pathname.includes("/usage")) {
      setActiveView("usage");
    } else if (pathname === "/dashboard") {
      setActiveView("manage");
    } else if (pathname.includes("/dashboard/")) {
      // Default to testing for regular dashboard pages
      setActiveView("testing");
    }
  }, [pathname]);

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

    if (!currentOrganizationId) {
      toast.error("Please select an organization first");
      return;
    }

    try {
      const newChatId = await addChat({
        title: "Untitled Chat",
        organizationId: currentOrganizationId,
      });
      // Navigate to testing view when creating new chat
      startTransition(() => {
        navigate(`/dashboard/${newChatId}/testing`);
      });
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
        className="fixed left-0 top-0 h-full z-40 bg-white/95 dark:bg-[#090909] backdrop-blur-2xl"
        style={{
          width: `${currentWidth}px`,
          transition: isResizing ? "none" : "width 300ms ease-out",
        }}
      >
        <div className="w-full h-full flex flex-col">
          {/* Header */}
          <div
            className={cn(
              "border-zinc-200/50 dark:border-zinc-800/50",
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

                  {/* Navigation Menu */}
                  <div className="mb-6">
                    <div className="space-y-0">
                      {/* Get Started */}
                      <button
                        onClick={() => {
                          window.open(
                            "https://docs.trainlyai.com/sdk-quickstart",
                            "_blank",
                          );
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 h-12 rounded-lg transition-all duration-150 group active:scale-[0.98] active:transition-transform active:duration-75",
                          "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        )}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 group-hover:text-amber-400",
                          )}
                        >
                          <Rocket className="w-4 h-4" />
                        </div>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            "text-zinc-900 dark:text-white group-hover:text-amber-400",
                          )}
                        >
                          Get Started
                        </span>
                      </button>

                      {/* Manage Chats */}
                      <button
                        onClick={() => {
                          startTransition(() => {
                            navigate("/dashboard/manage");
                          });
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-150 group h-12 active:scale-[0.98] active:transition-transform active:duration-75",
                          activeView === "manage"
                            ? "bg-amber-400/10 border border-amber-400/20"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        )}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            activeView === "manage"
                              ? "bg-amber-400 text-white"
                              : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 group-hover:text-amber-400",
                          )}
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </div>
                        <span
                          className={cn(
                            "text-sm font-medium flex-1 text-left",
                            activeView === "manage"
                              ? "text-amber-400"
                              : "text-zinc-900 dark:text-white group-hover:text-amber-400",
                          )}
                        >
                          Manage Chats
                        </span>
                        <span className="text-xs text-zinc-400">
                          {chats?.length || 0}
                        </span>
                      </button>

                      {/* Graph */}
                      <button
                        onClick={() => {
                          if (!chatId) {
                            toast.error("Please select a chat first");
                            return;
                          }
                          startTransition(() => {
                            navigate(`/dashboard/${chatId}/graph`);
                          });
                        }}
                        disabled={!chatId}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-150 group h-12 active:scale-[0.98] active:transition-transform active:duration-75",
                          !chatId
                            ? "opacity-40 cursor-not-allowed"
                            : activeView === "graph"
                              ? "bg-amber-400/10 border border-amber-400/20"
                              : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        )}
                        title={!chatId ? "Select a chat first" : "Graph View"}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            !chatId
                              ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-400"
                              : activeView === "graph"
                                ? "bg-amber-400 text-white"
                                : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 group-hover:text-amber-400",
                          )}
                        >
                          <Network className="w-4 h-4" />
                        </div>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            !chatId
                              ? "text-zinc-400"
                              : activeView === "graph"
                                ? "text-amber-400"
                                : "text-zinc-900 dark:text-white group-hover:text-amber-400",
                          )}
                        >
                          Graph
                        </span>
                      </button>

                      {/* Testing - Shows chat interface for selected chat */}
                      <button
                        onClick={() => {
                          if (!chatId) {
                            toast.error("Please select a chat first");
                            return;
                          }
                          startTransition(() => {
                            navigate(`/dashboard/${chatId}/testing`);
                          });
                        }}
                        disabled={!chatId}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-150 group h-12 active:scale-[0.98] active:transition-transform active:duration-75",
                          !chatId
                            ? "opacity-40 cursor-not-allowed"
                            : activeView === "testing"
                              ? "bg-amber-400/10 border border-amber-400/20"
                              : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        )}
                        title={!chatId ? "Select a chat first" : "Sandbox"}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            !chatId
                              ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-400"
                              : activeView === "testing"
                                ? "bg-amber-400 text-white"
                                : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 group-hover:text-amber-400",
                          )}
                        >
                          <TestTube className="w-4 h-4" />
                        </div>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            !chatId
                              ? "text-zinc-400"
                              : activeView === "testing"
                                ? "text-amber-400"
                                : "text-zinc-900 dark:text-white group-hover:text-amber-400",
                          )}
                        >
                          Sandbox
                        </span>
                      </button>

                      {/* File Ingestion */}
                      <button
                        onClick={() => {
                          if (!chatId) {
                            toast.error("Please select a chat first");
                            return;
                          }
                          startTransition(() => {
                            navigate(`/dashboard/${chatId}/files`);
                          });
                        }}
                        disabled={!chatId}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-150 group h-12 active:scale-[0.98] active:transition-transform active:duration-75",
                          !chatId
                            ? "opacity-40 cursor-not-allowed"
                            : activeView === "files"
                              ? "bg-amber-400/10 border border-amber-400/20"
                              : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        )}
                        title={!chatId ? "Select a chat first" : "File Ingestion"}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            !chatId
                              ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-400"
                              : activeView === "files"
                                ? "bg-amber-400 text-white"
                                : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 group-hover:text-amber-400",
                          )}
                        >
                          <Upload className="w-4 h-4" />
                        </div>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            !chatId
                              ? "text-zinc-400"
                              : activeView === "files"
                                ? "text-amber-400"
                                : "text-zinc-900 dark:text-white group-hover:text-amber-400",
                          )}
                        >
                          File Ingestion
                        </span>
                      </button>

                      {/* API Keys */}
                      <button
                        onClick={() => {
                          if (!chatId) {
                            toast.error("Please select a chat first");
                            return;
                          }
                          startTransition(() => {
                            navigate(`/dashboard/${chatId}/api-keys`);
                          });
                        }}
                        disabled={!chatId}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-150 group h-12 active:scale-[0.98] active:transition-transform active:duration-75",
                          !chatId
                            ? "opacity-40 cursor-not-allowed"
                            : activeView === "api-keys"
                              ? "bg-amber-400/10 border border-amber-400/20"
                              : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        )}
                        title={!chatId ? "Select a chat first" : "API Keys"}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            !chatId
                              ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-400"
                              : activeView === "api-keys"
                                ? "bg-amber-400 text-white"
                                : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 group-hover:text-amber-400",
                          )}
                        >
                          <Key className="w-4 h-4" />
                        </div>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            !chatId
                              ? "text-zinc-400"
                              : activeView === "api-keys"
                                ? "text-amber-400"
                                : "text-zinc-900 dark:text-white group-hover:text-amber-400",
                          )}
                        >
                          API Keys
                        </span>
                      </button>

                      {/* Custom Settings */}
                      <button
                        onClick={() => {
                          if (!chatId) {
                            toast.error("Please select a chat first");
                            return;
                          }
                          startTransition(() => {
                            navigate(`/dashboard/${chatId}/custom-settings`);
                          });
                        }}
                        disabled={!chatId}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-150 group h-12 active:scale-[0.98] active:transition-transform active:duration-75",
                          !chatId
                            ? "opacity-40 cursor-not-allowed"
                            : activeView === "custom-settings"
                              ? "bg-amber-400/10 border border-amber-400/20"
                              : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        )}
                        title={
                          !chatId ? "Select a chat first" : "Custom Settings"
                        }
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            !chatId
                              ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-400"
                              : activeView === "custom-settings"
                                ? "bg-amber-400 text-white"
                                : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 group-hover:text-amber-400",
                          )}
                        >
                          <Wrench className="w-4 h-4" />
                        </div>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            !chatId
                              ? "text-zinc-400"
                              : activeView === "custom-settings"
                                ? "text-amber-400"
                                : "text-zinc-900 dark:text-white group-hover:text-amber-400",
                          )}
                        >
                          Custom Settings
                        </span>
                      </button>

                      {/* Usage */}
                      <button
                        onClick={() => {
                          if (!chatId) {
                            toast.error("Please select a chat first");
                            return;
                          }
                          startTransition(() => {
                            navigate(`/dashboard/${chatId}/usage`);
                          });
                        }}
                        disabled={!chatId}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-150 group h-12 active:scale-[0.98] active:transition-transform active:duration-75",
                          !chatId
                            ? "opacity-40 cursor-not-allowed"
                            : activeView === "usage"
                              ? "bg-amber-400/10 border border-amber-400/20"
                              : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        )}
                        title={!chatId ? "Select a chat first" : "Usage"}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            !chatId
                              ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-400"
                              : activeView === "usage"
                                ? "bg-amber-400 text-white"
                                : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 group-hover:text-amber-400",
                          )}
                        >
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            !chatId
                              ? "text-zinc-400"
                              : activeView === "usage"
                                ? "text-amber-400"
                                : "text-zinc-900 dark:text-white group-hover:text-amber-400",
                          )}
                        >
                          Usage
                        </span>
                      </button>

                      {/* Feedback */}
                      <button
                        onClick={() => setIsFeedbackOpen(true)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-150 group h-12 active:scale-[0.98] active:transition-transform active:duration-75 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title="Share Feedback"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 group-hover:text-amber-400">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-amber-400">
                          Feedback
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
                    onClick={() => {
                      startTransition(() => {
                        navigate("/");
                      });
                    }}
                    className={cn(
                      "w-10 h-10 rounded-lg transition-all duration-150 flex items-center justify-center mx-auto active:scale-95",
                      activeView === "home"
                        ? "bg-amber-400/10 ring-2 ring-amber-400/30"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                    )}
                    title="Get Started"
                  >
                    <Rocket className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  </button>

                  <button
                    onClick={() => {
                      startTransition(() => {
                        navigate("/dashboard/manage");
                      });
                    }}
                    className={cn(
                      "w-10 h-10 rounded-lg transition-all duration-150 flex items-center justify-center mx-auto active:scale-95",
                      activeView === "manage"
                        ? "bg-amber-400/10 ring-2 ring-amber-400/30"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                    )}
                    title="Manage Chats"
                  >
                    <LayoutGrid className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  </button>

                  <button
                    onClick={() => {
                      if (!chatId) {
                        toast.error("Please select a chat first");
                        return;
                      }
                      startTransition(() => {
                        navigate(`/dashboard/${chatId}/graph`);
                      });
                    }}
                    disabled={!chatId}
                    className={cn(
                      "w-10 h-10 rounded-lg transition-all duration-150 flex items-center justify-center mx-auto active:scale-95",
                      !chatId
                        ? "opacity-40 cursor-not-allowed"
                        : activeView === "graph"
                          ? "bg-amber-400/10 ring-2 ring-amber-400/30"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                    )}
                    title={!chatId ? "Select a chat first" : "Graph View"}
                  >
                    <Network className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  </button>

                  <button
                    onClick={() => {
                      if (!chatId) {
                        toast.error("Please select a chat first");
                        return;
                      }
                      startTransition(() => {
                        navigate(`/dashboard/${chatId}/testing`);
                      });
                    }}
                    disabled={!chatId}
                    className={cn(
                      "w-10 h-10 rounded-lg transition-all duration-150 flex items-center justify-center mx-auto active:scale-95",
                      !chatId
                        ? "opacity-40 cursor-not-allowed"
                        : activeView === "testing"
                          ? "bg-amber-400/10 ring-2 ring-amber-400/30"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                    )}
                    title={!chatId ? "Select a chat first" : "Sandbox"}
                  >
                    <TestTube className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  </button>

                  <button
                    onClick={() => {
                      if (!chatId) {
                        toast.error("Please select a chat first");
                        return;
                      }
                      startTransition(() => {
                        navigate(`/dashboard/${chatId}/files`);
                      });
                    }}
                    disabled={!chatId}
                    className={cn(
                      "w-10 h-10 rounded-lg transition-all duration-150 flex items-center justify-center mx-auto active:scale-95",
                      !chatId
                        ? "opacity-40 cursor-not-allowed"
                        : activeView === "files"
                          ? "bg-amber-400/10 ring-2 ring-amber-400/30"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                    )}
                    title={!chatId ? "Select a chat first" : "File Ingestion"}
                  >
                    <Upload className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  </button>

                  <button
                    onClick={() => {
                      if (!chatId) {
                        toast.error("Please select a chat first");
                        return;
                      }
                      startTransition(() => {
                        navigate(`/dashboard/${chatId}/api-keys`);
                      });
                    }}
                    disabled={!chatId}
                    className={cn(
                      "w-10 h-10 rounded-lg transition-all duration-150 flex items-center justify-center mx-auto active:scale-95",
                      !chatId
                        ? "opacity-40 cursor-not-allowed"
                        : activeView === "api-keys"
                          ? "bg-amber-400/10 ring-2 ring-amber-400/30"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                    )}
                    title={!chatId ? "Select a chat first" : "API Keys"}
                  >
                    <Key className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  </button>

                  <button
                    onClick={() => {
                      if (!chatId) {
                        toast.error("Please select a chat first");
                        return;
                      }
                      startTransition(() => {
                        navigate(`/dashboard/${chatId}/custom-settings`);
                      });
                    }}
                    disabled={!chatId}
                    className={cn(
                      "w-10 h-10 rounded-lg transition-all duration-150 flex items-center justify-center mx-auto active:scale-95",
                      !chatId
                        ? "opacity-40 cursor-not-allowed"
                        : activeView === "custom-settings"
                          ? "bg-amber-400/10 ring-2 ring-amber-400/30"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                    )}
                    title={!chatId ? "Select a chat first" : "Custom Settings"}
                  >
                    <Wrench className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  </button>

                  <button
                    onClick={() => {
                      if (!chatId) {
                        toast.error("Please select a chat first");
                        return;
                      }
                      startTransition(() => {
                        navigate(`/dashboard/${chatId}/usage`);
                      });
                    }}
                    disabled={!chatId}
                    className={cn(
                      "w-10 h-10 rounded-lg transition-all duration-150 flex items-center justify-center mx-auto active:scale-95",
                      !chatId
                        ? "opacity-40 cursor-not-allowed"
                        : activeView === "usage"
                          ? "bg-amber-400/10 ring-2 ring-amber-400/30"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                    )}
                    title={!chatId ? "Select a chat first" : "Usage"}
                  >
                    <BarChart3 className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  </button>

                  <button
                    onClick={() => setIsFeedbackOpen(true)}
                    className="w-10 h-10 rounded-lg transition-all duration-150 flex items-center justify-center mx-auto active:scale-95 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    title="Share Feedback"
                  >
                    <MessageSquare className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          {!isCollapsed ? (
            <div className="p-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={() => {
                    startTransition(() => {
                      navigate("/profile");
                    });
                  }}
                  className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity active:scale-[0.98]"
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
                  {/* <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/profile")}
                    className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-amber-400 rounded-lg"
                    title="Profile Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button> */}
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
                onClick={() => {
                  startTransition(() => {
                    navigate("/profile");
                  });
                }}
                className="w-full flex justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg p-2 transition-colors active:scale-95"
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

      {/* Feedback Form Dialog */}
      <FeedbackForm isOpen={isFeedbackOpen} onOpenChange={setIsFeedbackOpen} />
    </>
  );
}
