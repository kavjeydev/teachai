"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { useSidebarWidth } from "@/hooks/use-sidebar-width";
import { Toaster } from "sonner";
import dynamic from "next/dynamic";
import { Id } from "../../../../../convex/_generated/dataModel";

// Load sidebar once - it will persist across route changes
const ResizableSidebar = dynamic(
  () =>
    import("@/app/(main)/components/resizable-sidebar").then((mod) => ({
      default: mod.ResizableSidebar,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="w-72 bg-white dark:bg-zinc-900 animate-pulse fixed left-0 top-0 h-screen" />
    ),
  },
);

// Load navbar once - it will persist across route changes
const ChatNavbar = dynamic(
  () =>
    import("@/app/(main)/components/chat-navbar").then((mod) => ({
      default: mod.ChatNavbar,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-16 bg-white dark:bg-zinc-900 animate-pulse border-b border-zinc-200 dark:border-zinc-800" />
    ),
  },
);

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { sidebarWidth } = useSidebarWidth();

  // Extract chatId from pathname if it exists
  // Pathname format: /dashboard/[chatId] or /dashboard/[chatId]/graph, etc.
  // Exclude known non-chat routes like "manage"
  const chatIdMatch = pathname.match(/\/dashboard\/([^\/]+)/);
  const potentialChatId = chatIdMatch ? chatIdMatch[1] : undefined;

  // Only treat as chatId if it's not a known non-chat route
  // Valid chatIds are typically long strings (Convex IDs), not short words like "manage"
  const knownNonChatRoutes = ["manage"];
  const chatId = potentialChatId && !knownNonChatRoutes.includes(potentialChatId)
    ? (potentialChatId as Id<"chats">)
    : undefined;

  return (
    <div className="rounded-3xl overflow-hidden">
      <div className="h-full w-screen bg-gradient-to-br overflow-hidden rounded-3xl dark:bg-[#090909] bg-white px-4 pb-4">
        <Toaster position="top-center" richColors />

        {/* Persistent Sidebar - only loads once, stays mounted */}
        <Suspense
          fallback={
            <div className="w-72 bg-white dark:bg-zinc-900 animate-pulse fixed left-0 top-0 h-screen" />
          }
        >
          <ResizableSidebar chatId={chatId} />
        </Suspense>

        {/* Content Area - only this changes on navigation */}
        <div
          className="h-[98vh] flex flex-col relative bg-gradient-to-b from-white via-white to-white dark:from-[#090909] dark:via-[#090909] dark:to-[#090909] rounded-3xl"
          style={{
            marginLeft: `${sidebarWidth}px`,
            transition: "margin-left 300ms ease-out",
          }}
        >
          {/* Persistent ChatNavbar - only reloads when chatId changes */}
          <Suspense
            fallback={
              <div className="h-16 bg-white dark:bg-zinc-900 animate-pulse border-b border-zinc-200 dark:border-zinc-800" />
            }
          >
            <ChatNavbar key={chatId || "no-chat"} chatId={chatId} />
          </Suspense>

          {children}
        </div>
      </div>
    </div>
  );
}

