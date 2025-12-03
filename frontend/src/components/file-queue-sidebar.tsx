"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
  Brain,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileQueueMonitor } from "@/components/file-queue-monitor";
import { UploadQueue, FileStatus } from "@/hooks/use-file-queue";

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

  // Get all files from all queues
  const allFiles = useMemo(
    () =>
      queues.flatMap((queue) =>
        (queue.files || []).map((file) => ({
          ...file,
          queueId: queue.queueId,
        })),
      ),
    [queues],
  );

  // Calculate status summary
  const statusSummary = useMemo(() => {
    const summary = {
      queued: 0,
      processing: 0, // includes extracting
      ready: 0,
      failed: 0,
      total: allFiles.length,
    };

    allFiles.forEach((file) => {
      if (file.status === "queued") summary.queued++;
      else if (["processing", "extracting"].includes(file.status))
        summary.processing++;
      else if (file.status === "ready") summary.ready++;
      else if (file.status === "failed") summary.failed++;
    });

    return summary;
  }, [allFiles]);

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
          "fixed right-0 top-0 h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-700 shadow-xl z-50 transition-all duration-300 ease-in-out flex flex-col",
          isCollapsed ? "w-16" : "w-[480px]",
          className,
        )}
      >
        {/* Header */}
        <div className="flex flex-col border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between p-4">
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

          {/* Status Summary */}
          {!isCollapsed && allFiles.length > 0 && (
            <div className="px-4 pb-3 flex items-center gap-4 text-xs">
              {statusSummary.queued > 0 && (
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{statusSummary.queued} queued</span>
                </div>
              )}
              {statusSummary.processing > 0 && (
                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <Brain className="h-3.5 w-3.5 animate-pulse" />
                  <span>{statusSummary.processing} processing</span>
                </div>
              )}
              {statusSummary.ready > 0 && (
                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>{statusSummary.ready} ready</span>
                </div>
              )}
              {statusSummary.failed > 0 && (
                <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{statusSummary.failed} failed</span>
                </div>
              )}
            </div>
          )}
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
            {/* Processing indicator */}
            {statusSummary.processing > 0 && (
              <div
                className="relative"
                title={`${statusSummary.processing} files processing`}
              >
                <Brain className="h-6 w-6 text-blue-400 animate-pulse" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">
                    {statusSummary.processing > 9
                      ? "9+"
                      : statusSummary.processing}
                  </span>
                </div>
              </div>
            )}

            {/* Queued indicator */}
            {statusSummary.queued > 0 && (
              <div
                className="relative"
                title={`${statusSummary.queued} files queued`}
              >
                <Clock className="h-6 w-6 text-amber-400" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">
                    {statusSummary.queued > 9 ? "9+" : statusSummary.queued}
                  </span>
                </div>
              </div>
            )}

            {/* Ready indicator (only show if no active processing) */}
            {statusSummary.ready > 0 &&
              statusSummary.processing === 0 &&
              statusSummary.queued === 0 && (
                <div
                  className="relative"
                  title={`${statusSummary.ready} files ready`}
                >
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {statusSummary.ready > 9 ? "9+" : statusSummary.ready}
                    </span>
                  </div>
                </div>
              )}

            {/* Failed indicator */}
            {statusSummary.failed > 0 && (
              <div
                className="relative"
                title={`${statusSummary.failed} files failed`}
              >
                <AlertCircle className="h-6 w-6 text-red-400" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">
                    {statusSummary.failed > 9 ? "9+" : statusSummary.failed}
                  </span>
                </div>
              </div>
            )}

            {/* Empty state */}
            {allFiles.length === 0 && (
              <FileText className="h-6 w-6 text-zinc-400" />
            )}
          </div>
        )}
      </div>
    </>
  );
};
