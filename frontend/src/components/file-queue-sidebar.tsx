"use client";

import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileQueueMonitor } from "@/components/file-queue-monitor";
import { UploadQueue } from "@/hooks/use-file-queue";

interface FileQueueSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  queues: UploadQueue[];
  className?: string;
}

export const FileQueueSidebar: React.FC<FileQueueSidebarProps> = ({
  isOpen,
  onClose,
  queues,
  className,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isOpen) return null;

  // Get all files from all queues
  const allFiles = queues.flatMap((queue) =>
    (queue.files || []).map((file) => ({
      ...file,
      queueId: queue.queueId,
    })),
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Sidebar - Fixed to far right edge of screen */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-700 shadow-xl z-50 transition-all duration-300 ease-in-out flex flex-col",
          isCollapsed ? "w-16" : "w-[480px]",
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                File Uploads
              </h2>
            </div>
          )}

          <div className="flex items-center gap-1">
            {/* Collapse/Expand Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {isCollapsed ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {!isCollapsed && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 flex-1 flex flex-col min-h-0">
              {allFiles.length > 0 ? (
                <FileQueueMonitor queues={queues} className="flex-1" />
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-center">
                  <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-zinc-400" />
                  </div>
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                    No files uploaded
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
                    Upload files or folders to see their status here
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Collapsed State */}
        {isCollapsed && (
          <div className="flex flex-col items-center py-4 space-y-4">
            {/* File count indicator */}
            {allFiles.length > 0 && (
              <div className="relative">
                <FileText className="h-6 w-6 text-blue-400" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">
                    {allFiles.length > 9 ? "9+" : allFiles.length}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
