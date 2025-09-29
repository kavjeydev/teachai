"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Network, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Id } from "../../convex/_generated/dataModel";

const GraphVisualizationNVL = dynamic(
  () => import("@/components/GraphVisualizationNVL"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-700 dark:from-amber-400 dark:to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
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

interface GraphSidebarProps {
  chatId: Id<"chats">;
  isOpen: boolean;
  onToggle: () => void;
  reasoningContext?: any[];
  refreshTrigger?: number; // Add refresh trigger prop
}

export const GraphSidebar: React.FC<GraphSidebarProps> = ({
  chatId,
  isOpen,
  onToggle,
  reasoningContext,
  refreshTrigger,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/";

  return (
    <>
      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onToggle}
        />
      )}

      {/* Graph Overlay */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full bg-white/98 dark:bg-zinc-900/98 backdrop-blur-xl border-l border-zinc-200 dark:border-zinc-700 shadow-2xl z-50 transition-all duration-300 ease-out",
          isOpen
            ? isCollapsed
              ? "w-16 translate-x-0"
              : "w-[90vw] md:w-[70vw] lg:w-[60vw] xl:w-[50vw] translate-x-0"
            : "w-[90vw] md:w-[70vw] lg:w-[60vw] xl:w-[50vw] translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-amber-700 dark:from-amber-400 dark:to-amber-600 rounded-lg flex items-center justify-center shadow-lg">
                <Network className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Knowledge Graph
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Explore your knowledge relationships
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Collapse/Expand Toggle */}
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Minimize"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}

            {isCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Expand"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
            )}

            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Close Graph"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 h-full overflow-hidden">
          {!isCollapsed ? (
            <div className="h-full p-4">
              <div className="h-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-lg">
                <GraphVisualizationNVL
                  chatId={chatId as string}
                  baseUrl={baseUrl}
                  reasoningContext={reasoningContext}
                  refreshTrigger={refreshTrigger}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 space-y-4">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-700 dark:from-amber-400 dark:to-amber-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                <Network className="w-5 h-5 text-white" />
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 writing-mode-vertical transform rotate-90 mt-4">
                Graph
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
