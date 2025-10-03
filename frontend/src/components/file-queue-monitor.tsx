"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadQueue, QueuedFile, PersistedFile } from "@/hooks/use-file-queue";

interface FileQueueMonitorProps {
  queues: UploadQueue[];
  className?: string;
}

interface FileItemProps {
  file: QueuedFile | PersistedFile;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "uploaded":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "processing":
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case "cancelled":
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <File className="h-4 w-4 text-zinc-400" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "uploaded":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "processing":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-300";
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const FileItem: React.FC<FileItemProps> = ({ file }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0">{getStatusIcon(file.status)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {file.fileName}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatFileSize(file.fileSize)}
            </span>
            {file.status === "processing" && (
              <>
                <Progress value={file.progress} className="w-24 h-1" />
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {file.progress}%
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge
          variant="outline"
          className={cn("text-xs", getStatusColor(file.status))}
        >
          {file.status}
        </Badge>
      </div>
    </div>
  );
};

export const FileQueueMonitor: React.FC<FileQueueMonitorProps> = ({
  queues,
  className,
}) => {
  // Get all files from all queues
  const allFiles = queues.flatMap((queue) =>
    (queue.files || []).map((file) => ({
      ...file,
      queueId: queue.queueId,
    })),
  );

  if (allFiles.length === 0) {
    return null;
  }

  // Sort files: processing first, then by creation time
  const sortedFiles = [...allFiles].sort((a, b) => {
    if (a.status === "processing" && b.status !== "processing") return -1;
    if (b.status === "processing" && a.status !== "processing") return 1;
    return b.queueId.localeCompare(a.queueId); // Newer files first
  });

  return (
    <div className={cn("space-y-3 max-h-96 overflow-y-auto", className)}>
      {sortedFiles.map((file) => (
        <FileItem key={`${file.queueId}-${file.id}`} file={file} />
      ))}
    </div>
  );
};
