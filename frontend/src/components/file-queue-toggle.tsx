"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Activity, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadQueue } from "@/hooks/use-file-queue";

interface FileQueueToggleProps {
  queues: UploadQueue[];
  onClick: () => void;
  isActive?: boolean;
  className?: string;
}

export const FileQueueToggle: React.FC<FileQueueToggleProps> = ({
  queues,
  onClick,
  isActive = false,
  className,
}) => {
  const activeQueues = queues.filter(q => q.status === "active");
  const hasActivity = activeQueues.length > 0;
  const totalActiveFiles = activeQueues.reduce((sum, queue) => sum + queue.totalFiles, 0);
  const totalCompletedFiles = activeQueues.reduce((sum, queue) => sum + queue.completedFiles, 0);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        "relative p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group/queue",
        isActive && "bg-slate-200 dark:bg-slate-700",
        className
      )}
      title={
        hasActivity
          ? `Processing ${totalActiveFiles} files (${totalCompletedFiles} completed)`
          : "File processing queue"
      }
    >
      {hasActivity ? (
        <>
          <Activity className="w-3.5 h-3.5 text-trainlymainlight animate-pulse" />
          {activeQueues.length > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-trainlymainlight text-white rounded-full flex items-center justify-center text-xs font-bold">
              {activeQueues.length}
            </div>
          )}
        </>
      ) : (
        <FileText className="w-3.5 h-3.5 text-slate-400 group-hover/queue:text-trainlymainlight transition-colors" />
      )}
    </Button>
  );
};
