"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import { useFileQueue } from "@/hooks/use-file-queue";
import {
  Upload,
  FileText,
  FolderOpen,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  File,
  Folder,
  Trash2,
  Sparkles,
  MoreHorizontal,
  Clock,
  Filter,
  RefreshCw,
  Grid3x3,
  Eye,
  Download,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function FileIngestionPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as Id<"chats">;

  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<
    "all" | "processing" | "completed" | "deleted"
  >("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [queueToDelete, setQueueToDelete] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Get chat info
  const chat = useQuery(
    api.chats.getChatById,
    chatId ? { id: chatId } : "skip",
  );
  const uploadContext = useMutation(api.chats.uploadContext);
  const eraseContext = useMutation(api.chats.eraseContext);
  const markQueueAsDeleted = useMutation(api.fileQueue.markQueueAsDeleted);

  // File queue system
  const fileQueue = useFileQueue({
    chatId: chatId || null,
    chatInfo: chat ? { chatType: chat.chatType, chatId: chat._id } : undefined,
    onFileProcessed: (fileId, fileName) => {
      if (chatId) {
        uploadContext({
          id: chatId,
          context: {
            filename: fileName,
            fileId: fileId,
          },
        });
      }
    },
    onQueueComplete: (queueId) => {
      toast.success("All files processed successfully!");
      setSelectedFiles([]);
    },
  });

  // Handle file selection
  const handleFiles = useCallback(
    async (files: FileList | File[], isFolder = false, folderName?: string) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) {
        toast.error("No files selected.");
        return;
      }

      // Check if chat is archived
      if (chat?.isArchived) {
        toast.error(
          "Cannot upload files to an archived chat. Please restore it first.",
        );
        return;
      }

      // Use the queue system for file processing
      await fileQueue.uploadFiles(fileArray, isFolder, folderName);
    },
    [fileQueue, chat],
  );

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const firstFile = files[0] as any;
      const isFolder = Boolean(
        firstFile.webkitRelativePath && firstFile.webkitRelativePath.length > 0,
      );
      let folderName;
      if (isFolder) {
        const pathParts = firstFile.webkitRelativePath.split("/");
        folderName = pathParts[0];
      }
      handleFiles(files, isFolder, folderName);
    }
  };

  // File input handlers
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files, false);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const firstFile = files[0] as any;
      const isFolder = Boolean(
        firstFile.webkitRelativePath && firstFile.webkitRelativePath.length > 0,
      );
      let folderName;
      if (isFolder) {
        const pathParts = firstFile.webkitRelativePath.split("/");
        folderName = pathParts[0];
      }
      handleFiles(files, isFolder, folderName);
    }
    // Reset input
    if (folderInputRef.current) {
      folderInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    if (chat?.isArchived) {
      toast.error(
        "Cannot upload files to an archived chat. Please restore it first.",
      );
      return;
    }
    fileInputRef.current?.click();
  };

  const triggerFolderInput = () => {
    if (chat?.isArchived) {
      toast.error(
        "Cannot upload files to an archived chat. Please restore it first.",
      );
      return;
    }
    folderInputRef.current?.click();
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Get file icon
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    return <FileText className="w-5 h-5" />;
  };

  // Handle delete confirmation dialog
  const handleDeleteClick = (queue: any) => {
    setQueueToDelete(queue);
    setDeleteDialogOpen(true);
  };

  // Handle file deletion - mark as deleted instead of removing
  const handleDeleteFile = async () => {
    if (!chatId || !queueToDelete || !chat) return;

    try {
      // Mark the queue as deleted in Convex
      await markQueueAsDeleted({
        queueId: queueToDelete.queueId,
      });

      // Get file IDs from the chat context that match the queue files
      const chatContext = chat.context || [];

      // Try to get fileIds directly from queue files first, then fall back to matching by filename
      const queueFiles = queueToDelete.files || [];
      const fileIdsFromQueue = queueFiles
        .map((f: any) => f.fileId)
        .filter((id: any) => id); // Filter out undefined/null

      // If we have fileIds from queue, use those; otherwise match by filename
      let filesToDelete: any[] = [];

      if (fileIdsFromQueue.length > 0) {
        // Use fileIds directly from queue
        filesToDelete = chatContext.filter((ctx: any) =>
          fileIdsFromQueue.includes(ctx.fileId),
        );
      }

      // If no matches found, try matching by filename
      if (filesToDelete.length === 0) {
        const queueFileNames = queueFiles
          .map((f: any) => f.fileName)
          .filter((name: any) => name);
        filesToDelete = chatContext.filter((ctx: any) => {
          const ctxFilename = ctx.filename?.toLowerCase().trim();
          return queueFileNames.some((qName: string) => {
            const qFilename = qName?.toLowerCase().trim();
            return (
              ctxFilename === qFilename ||
              ctxFilename?.includes(qFilename) ||
              qFilename?.includes(ctxFilename)
            );
          });
        });
      }

      // Delete files from chat context and backend (same as before)
      let successCount = 0;
      let failCount = 0;

      for (const file of filesToDelete) {
        try {
          // First call eraseContext mutation (removes from Convex)
          await eraseContext({
            id: chatId,
            fileId: file.fileId,
          });

          // Then call backend to remove from Neo4j - same as context-list.tsx
          const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL as string) || "";
          const modusResponse = await fetch(
            `${baseUrl}remove_context/${file.fileId}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
            },
          );

          if (!modusResponse.ok) {
            const errorData = await modusResponse.json();
            console.error("❌ Failed to delete context from Neo4j:", errorData);
            failCount++;
            // Continue with other files even if one fails
          } else {
            successCount++;
          }
        } catch (error) {
          console.error("Failed to delete file:", file.filename, error);
          failCount++;
          // Continue with other files even if one fails
        }
      }

      if (successCount > 0) {
        toast.success(
          `Successfully deleted ${successCount} file${successCount > 1 ? "s" : ""}`,
        );
      }
      if (failCount > 0) {
        toast.error(
          `Failed to delete ${failCount} file${failCount > 1 ? "s" : ""}`,
        );
      }

      setDeleteDialogOpen(false);
      setQueueToDelete(null);
    } catch (error) {
      console.error("Error marking queue as deleted:", error);
      toast.error("Failed to delete file(s)");
      setDeleteDialogOpen(false);
      setQueueToDelete(null);
    }
  };

  // Handle view in graph
  const handleViewInGraph = () => {
    if (chatId) {
      router.push(`/dashboard/${chatId}/graph`);
    }
  };

  const activeQueues = fileQueue.activeQueues || [];
  const allQueues = fileQueue.allQueues || [];
  // Note: UI status "uploaded" corresponds to database status "completed"
  // The status is already mapped to UI status by useFileQueue hook
  const completedQueues = allQueues.filter(
    (q) => q.status === "uploaded" || (q as any).status === "completed",
  );
  const processingQueues = allQueues.filter((q) => q.status === "processing");
  const deletedQueues = allQueues.filter((q) => q.status === "deleted");

  // Format relative time
  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "1 day ago";
    if (days < 7) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    if (weeks === 1) return "1 week ago";
    if (weeks < 4) return `${weeks} weeks ago`;
    const months = Math.floor(days / 30);
    if (months === 1) return "1 month ago";
    return `${months} months ago`;
  };

  if (!chatId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            No Chat Selected
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            Please select a chat to upload files.
          </p>
        </div>
      </div>
    );
  }

  // Get queues based on active tab
  const getFilteredQueues = () => {
    switch (activeTab) {
      case "processing":
        return processingQueues;
      case "completed":
        return completedQueues;
      case "deleted":
        return deletedQueues;
      default:
        // Filter out deleted queues from "all" tab
        return allQueues.filter((q) => q.status !== "deleted");
    }
  };

  const filteredQueues = getFilteredQueues();

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-[#090909]">
      {/* Elegant Header */}
      <div className="px-8 pt-8 pb-6 border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white mb-1">
              File Ingestion
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Manage and upload documents to enhance your AI assistant
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              onClick={() => {
                // Refresh logic
                window.location.reload();
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-colors relative",
              activeTab === "all"
                ? "text-zinc-900 dark:text-white"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300",
            )}
          >
            <div className="flex items-center gap-2">
              <Grid3x3 className="w-4 h-4" />
              <span>All Files</span>
              {allQueues.length > 0 && (
                <Badge
                  variant="outline"
                  className="ml-2 text-xs border-zinc-300 dark:border-zinc-700"
                >
                  {allQueues.length}
                </Badge>
              )}
            </div>
            {activeTab === "all" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-white" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("processing")}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-colors relative",
              activeTab === "processing"
                ? "text-zinc-900 dark:text-white"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300",
            )}
          >
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4" />
              <span>Processing</span>
              {processingQueues.length > 0 && (
                <Badge
                  variant="outline"
                  className="ml-2 text-xs border-amber-500 text-amber-600 dark:text-amber-400"
                >
                  {processingQueues.length}
                </Badge>
              )}
            </div>
            {activeTab === "processing" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-white" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-colors relative",
              activeTab === "completed"
                ? "text-zinc-900 dark:text-white"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300",
            )}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Completed</span>
              {completedQueues.length > 0 && (
                <Badge
                  variant="outline"
                  className="ml-2 text-xs border-green-500 text-green-600 dark:text-green-400"
                >
                  {completedQueues.length}
                </Badge>
              )}
            </div>
            {activeTab === "completed" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-white" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("deleted")}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-colors relative",
              activeTab === "deleted"
                ? "text-zinc-900 dark:text-white"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300",
            )}
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              <span>Deleted</span>
              {deletedQueues.length > 0 && (
                <Badge
                  variant="outline"
                  className="ml-2 text-xs border-red-500 text-red-600 dark:text-red-400"
                >
                  {deletedQueues.length}
                </Badge>
              )}
            </div>
            {activeTab === "deleted" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-white" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-6">
          {/* Upload Area - Compact and Elegant */}
          <div
            className={cn(
              "mb-6 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer",
              isDragOver
                ? "border-amber-400 bg-amber-50/30 dark:bg-amber-950/10"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !chat?.isArchived && triggerFileInput()}
          >
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-900 mb-4">
                <Upload className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {isDragOver
                  ? "Drop files here"
                  : "Drag and drop files or click to browse"}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Supports PDF, DOC, DOCX, TXT, MD, CSV, JSON, and more
              </p>
              <div className="flex items-center justify-center gap-3 mt-4">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerFileInput();
                  }}
                  disabled={chat?.isArchived}
                  variant="outline"
                  size="sm"
                  className="border-zinc-200 dark:border-zinc-800"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Files
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerFolderInput();
                  }}
                  disabled={chat?.isArchived}
                  variant="outline"
                  size="sm"
                  className="border-zinc-200 dark:border-zinc-800"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Folder
                </Button>
              </div>
            </div>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,.html,.xml,.yaml,.yml,.js,.py,.java,.cpp,.c,.h,.cs,.php,.rb,.sh,.bat,.ps1"
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            // @ts-ignore - webkitdirectory is a valid HTML attribute
            webkitdirectory=""
            onChange={handleFolderInputChange}
            className="hidden"
          />

          {/* Elegant Table View */}
          {filteredQueues.length > 0 ? (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredQueues.map((queue) => {
                    // Check for both UI status "uploaded" and database status "completed"
                    const isProcessing = queue.status === "processing";
                    const isCompleted = queue.status === "uploaded";
                    const isDeleted = queue.status === "deleted";
                    const progress =
                      queue.totalFiles > 0
                        ? ((queue.completedFiles || 0) / queue.totalFiles) * 100
                        : 0;

                    return (
                      <tr
                        key={queue.queueId}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-zinc-400" />
                            {formatRelativeTime(queue.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {queue.isFolder ? (
                              <Folder className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                            ) : (
                              <File className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                            )}
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                              {queue.isFolder ? "Folder" : "File"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-zinc-900 dark:text-white">
                            {queue.name}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            {queue.totalFiles}{" "}
                            {queue.totalFiles === 1 ? "file" : "files"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isProcessing ? (
                            <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Processing
                            </span>
                          ) : isDeleted ? (
                            <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                              <Trash2 className="w-3 h-3" />
                              Deleted
                            </span>
                          ) : isCompleted ? (
                            <span className="text-xs text-green-600 dark:text-green-400">
                              Completed
                            </span>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-zinc-300 dark:border-zinc-700"
                            >
                              Pending
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isProcessing ? (
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-amber-400 to-amber-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-zinc-500 dark:text-zinc-400 min-w-[3rem] text-right">
                                {Math.round(progress)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">
                              {isCompleted ? "100%" : "—"}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isDeleted ? (
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                Deleted
                              </span>
                            ) : isProcessing ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  fileQueue.cancelUploadQueue(queue.queueId)
                                }
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 h-8 w-8 p-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            ) : isCompleted ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-48"
                                >
                                  <DropdownMenuItem
                                    onClick={() => {
                                      // View details - could show a modal or navigate
                                      toast.info(
                                        `Viewing details for ${queue.name}`,
                                      );
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={handleViewInGraph}
                                    className="cursor-pointer"
                                  >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    View in Graph
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteClick(queue)}
                                    className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-48"
                                >
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteClick(queue)}
                                    className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 mb-4">
                <FileText className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">
                No files{" "}
                {activeTab === "processing"
                  ? "processing"
                  : activeTab === "completed"
                    ? "completed"
                    : activeTab === "deleted"
                      ? "deleted"
                      : "uploaded"}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                {activeTab === "all"
                  ? "Upload your first files to get started"
                  : activeTab === "deleted"
                    ? "No deleted files"
                    : `No files in ${activeTab} status`}
              </p>
              <Button
                onClick={triggerFileInput}
                disabled={chat?.isArchived}
                variant="outline"
                className="border-zinc-200 dark:border-zinc-800"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 dark:text-red-400">
              Delete Files
            </AlertDialogTitle>
            <AlertDialogDescription>
              {queueToDelete && (
                <>
                  Are you sure you want to delete "{queueToDelete.name}"? This
                  will remove{" "}
                  {queueToDelete.files?.filter((f: any) => f.fileId || f.id)
                    .length || 0}{" "}
                  file
                  {queueToDelete.files?.filter((f: any) => f.fileId || f.id)
                    .length !== 1
                    ? "s"
                    : ""}{" "}
                  from your chat. This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFile}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
