"use client";

import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight, FileText, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileQueueMonitor } from "@/components/file-queue-monitor";
import { UploadQueue } from "@/hooks/use-file-queue";

interface FileQueueSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  queues: UploadQueue[];
  onCancelQueue: (queueId: string) => void;
  className?: string;
}

export const FileQueueSidebar: React.FC<FileQueueSidebarProps> = ({
  isOpen,
  onClose,
  queues,
  onCancelQueue,
  className,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeQueues = queues.filter(q => q.status === "active");
  const completedQueues = queues.filter(q => q.status === "completed");
  const failedQueues = queues.filter(q => q.status === "failed");

  const totalActiveFiles = activeQueues.reduce((sum, queue) => sum + queue.totalFiles, 0);
  const totalCompletedFiles = activeQueues.reduce((sum, queue) => sum + queue.completedFiles, 0);

  if (!isOpen) return null;

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
          "fixed right-0 top-0 h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-700 shadow-xl z-50 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-[480px]",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                File Processing
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
          <div className="flex-1 overflow-y-auto p-4">
            {/* Stats Summary */}
            {(activeQueues.length > 0 || completedQueues.length > 0 || failedQueues.length > 0) && (
              <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">
                  Processing Summary
                </h3>

                <div className="grid grid-cols-1 gap-2 text-xs">
                  {activeQueues.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Active Files:
                      </span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {totalCompletedFiles}/{totalActiveFiles}
                      </span>
                    </div>
                  )}

                  {completedQueues.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Completed Queues:
                      </span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {completedQueues.length}
                      </span>
                    </div>
                  )}

                  {failedQueues.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Failed Queues:
                      </span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {failedQueues.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Queue Monitor */}
            {queues.length > 0 ? (
              <FileQueueMonitor
                queues={queues}
                onCancelQueue={onCancelQueue}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-zinc-400" />
                </div>
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                  No files processing
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
                  Upload files or folders to see their processing status here
                </p>
              </div>
            )}
          </div>
        )}

        {/* Collapsed State */}
        {isCollapsed && (
          <div className="flex flex-col items-center py-4 space-y-4">
            {/* Activity Indicator */}
            {activeQueues.length > 0 && (
              <div className="relative">
                <Activity className="h-6 w-6 text-amber-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">
                    {activeQueues.length}
                  </span>
                </div>
              </div>
            )}

            {/* Completed Indicator */}
            {completedQueues.length > 0 && (
              <div className="relative">
                <FileText className="h-6 w-6 text-green-500" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">
                    {completedQueues.length}
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
