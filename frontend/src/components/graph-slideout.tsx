"use client";

import React, { useState, useEffect, useCallback } from "react";
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

interface GraphSlideoutProps {
  chatId: Id<"chats">;
  isOpen: boolean;
  onClose: () => void;
  reasoningContext?: any[];
  refreshTrigger?: number;
}

export function GraphSlideout({
  chatId,
  isOpen,
  onClose,
  reasoningContext,
  refreshTrigger
}: GraphSlideoutProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/";

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure smooth slide-in animation
      setTimeout(() => {
        setIsAnimating(true);
      }, 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 500); // Match slower animation duration
  }, [onClose]);

  // Handle escape key to close slideout
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 bg-white dark:bg-slate-900 shadow-2xl z-50 transition-transform duration-500 ease-in-out overflow-hidden",
        isAnimating ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-6 py-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Knowledge Graph
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Explore your knowledge relationships
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Graph Content */}
      <div className="flex-1 h-full overflow-hidden p-6">
        <div className="h-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
          <GraphVisualizationNVL
            chatId={chatId as string}
            baseUrl={baseUrl}
            reasoningContext={reasoningContext}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>
    </div>
  );
}
