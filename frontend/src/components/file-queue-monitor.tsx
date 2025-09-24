"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  X,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Folder,
  File,
  AlertCircle,
  Pause
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadQueue, QueuedFile } from "@/hooks/use-file-queue";

interface FileQueueMonitorProps {
  queues: UploadQueue[];
  onCancelQueue: (queueId: string) => void;
  className?: string;
}

interface QueueCardProps {
  queue: UploadQueue;
  onCancel: (queueId: string) => void;
}

interface FileItemProps {
  file: QueuedFile;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "processing":
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case "cancelled":
      return <Pause className="h-4 w-4 text-zinc-500" />;
    default:
      return <Clock className="h-4 w-4 text-yellow-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "failed":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "processing":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "cancelled":
      return "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-300";
    case "active":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
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

const formatTimeAgo = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return "Just now";
};

const FileItem: React.FC<FileItemProps> = ({ file }) => {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {getStatusIcon(file.status)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {file.fileName}
            </span>
            {file.filePath && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {file.filePath}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatFileSize(file.fileSize)}
            </span>
            <Badge variant="outline" className={cn("text-xs", getStatusColor(file.status))}>
              {file.status}
            </Badge>
          </div>
        </div>
      </div>

      {file.status === "processing" && (
        <div className="flex items-center gap-2">
          <Progress value={file.progress} className="w-16 h-2" />
          <span className="text-xs text-zinc-500 dark:text-zinc-400 w-8">
            {file.progress}%
          </span>
        </div>
      )}

      {file.error && (
        <div className="flex items-center gap-1 text-red-500">
          <AlertCircle className="h-3 w-3" />
          <span className="text-xs truncate max-w-32" title={file.error}>
            {file.error}
          </span>
        </div>
      )}
    </div>
  );
};

const QueueCard: React.FC<QueueCardProps> = ({ queue, onCancel }) => {
  const progress = queue.totalFiles > 0
    ? Math.round(((queue.completedFiles + queue.failedFiles) / queue.totalFiles) * 100)
    : 0;

  const canCancel = queue.status === "active";

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {queue.isFolder ? (
              <Folder className="h-4 w-4 text-blue-500" />
            ) : (
              <File className="h-4 w-4 text-zinc-500" />
            )}
            <CardTitle className="text-sm font-medium truncate">
              {queue.name}
            </CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-xs", getStatusColor(queue.status))}>
              {queue.status}
            </Badge>

            {canCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancel(queue.queueId)}
                className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            {queue.completedFiles} of {queue.totalFiles} completed
            {queue.failedFiles > 0 && ` • ${queue.failedFiles} failed`}
          </span>
          <span>{formatTimeAgo(queue.createdAt)}</span>
        </div>

        {queue.status === "active" && (
          <Progress value={progress} className="w-full h-2" />
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {queue.files.map((file) => (
            <FileItem key={file.id} file={file} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const FileQueueMonitor: React.FC<FileQueueMonitorProps> = ({
  queues,
  onCancelQueue,
  className
}) => {
  if (queues.length === 0) {
    return null;
  }

  // Sort queues by status and creation time
  const sortedQueues = [...queues].sort((a, b) => {
    // Active queues first
    if (a.status === "active" && b.status !== "active") return -1;
    if (b.status === "active" && a.status !== "active") return 1;

    // Then by creation time (newest first)
    return b.createdAt - a.createdAt;
  });

  const activeQueues = queues.filter(q => q.status === "active");
  const completedQueues = queues.filter(q => q.status === "completed");
  const failedQueues = queues.filter(q => q.status === "failed");

  return (
    <div className={cn("space-y-4", className)}>
      {/* Summary */}
      {queues.length > 0 && (
        <div className="flex items-center gap-4 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              File Processing Queue
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            {activeQueues.length > 0 && (
              <span>{activeQueues.length} active</span>
            )}
            {completedQueues.length > 0 && (
              <span>{completedQueues.length} completed</span>
            )}
            {failedQueues.length > 0 && (
              <span className="text-red-500">{failedQueues.length} failed</span>
            )}
          </div>
        </div>
      )}

      {/* Queue Cards */}
      <div className="space-y-3">
        {sortedQueues.map((queue) => (
          <QueueCard
            key={queue.queueId}
            queue={queue}
            onCancel={onCancelQueue}
          />
        ))}
      </div>
    </div>
  );
};
