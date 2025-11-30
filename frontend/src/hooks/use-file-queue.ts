import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { captureEvent } from "@/lib/posthog";
import { useUser } from "@clerk/nextjs";

// Generate unique ID
const uid = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Global set to track files currently being processed to prevent duplicates
const globalProcessingFiles = new Set<string>();

// Utility function to format relative time
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  } else {
    // For longer periods, show the actual date
    return new Date(timestamp).toLocaleDateString();
  }
};

// Map database status to UI status
const mapDatabaseStatusToUI = (
  dbStatus: string,
): "processing" | "uploaded" | "cancelled" | "deleted" => {
  switch (dbStatus) {
    case "completed":
      return "uploaded";
    case "failed":
    case "cancelled":
      return "cancelled";
    case "deleted":
      return "deleted";
    case "processing":
    default:
      return "processing";
  }
};

// Map UI status to database status
const mapUIStatusToDatabase = (
  uiStatus: "processing" | "uploaded" | "cancelled",
): string => {
  switch (uiStatus) {
    case "uploaded":
      return "completed";
    case "cancelled":
      return "failed";
    case "processing":
    default:
      return "processing";
  }
};

export interface QueuedFile {
  file: File;
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath?: string;
  status: "processing" | "uploaded" | "cancelled" | "deleted";
  progress: number;
  error?: string;
  fileId?: string;
  convexFileId?: Id<"file_upload_queue">; // Convex document ID for updates
  id: string;
  uploadedAt?: number; // Unix timestamp in milliseconds
  extractedTextLength?: number; // Length of extracted text (for accurate KU calculation)
  knowledgeUnits?: number; // Actual Knowledge Units consumed (calculated from extracted text)
}

// Interface for persisted file data (without File object)
export interface PersistedFile {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath?: string;
  status: "processing" | "uploaded" | "cancelled" | "deleted";
  progress: number;
  error?: string;
  fileId?: string;
  convexFileId?: Id<"file_upload_queue">;
  uploadedAt?: number; // Unix timestamp in milliseconds
  extractedTextLength?: number; // Length of extracted text (for accurate KU calculation)
  knowledgeUnits?: number; // Actual Knowledge Units consumed (calculated from extracted text)
}

export interface UploadQueue {
  queueId: string;
  name: string;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  status: "processing" | "uploaded" | "cancelled" | "deleted";
  isFolder: boolean;
  files: QueuedFile[] | PersistedFile[]; // Can be either active or persisted files
  createdAt: number;
}

interface UseFileQueueProps {
  chatId: Id<"chats"> | null;
  chatInfo?: { chatType?: string; chatId?: string }; // Optional chat info to avoid extra queries
  onFileProcessed?: (fileId: string, fileName: string) => void;
  onQueueComplete?: (queueId: string) => void;
}

export function useFileQueue({
  chatId,
  chatInfo,
  onFileProcessed,
  onQueueComplete,
}: UseFileQueueProps) {
  const [activeQueues, setActiveQueues] = useState<Map<string, UploadQueue>>(
    new Map(),
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [abortControllers, setAbortControllers] = useState<
    Map<string, AbortController>
  >(new Map());
  const [cancelledFiles, setCancelledFiles] = useState<Set<string>>(new Set());

  const createUploadQueue = useMutation(api.fileQueue.createUploadQueue);
  const addFilesToQueue = useMutation(api.fileQueue.addFilesToQueue);
  const updateFileProgress = useMutation(api.fileQueue.updateFileProgress);
  const cancelQueue = useMutation(api.fileQueue.cancelQueue);
  const addTokenIngestion = useMutation(api.fileStorage.addTokenIngestion);

  // Get chat to retrieve userId for token tracking
  const currentChat = useQuery(
    api.chats.getChatById,
    chatId ? { id: chatId } : "skip",
  );

  const queues = useQuery(
    api.fileQueue.getUserQueues,
    chatId ? { chatId } : "skip",
  );

  // Clean up active queues that have been persisted to database
  useEffect(() => {
    if (!queues) return;

    // Remove active queues that are completed and have been persisted
    setActiveQueues((prev) => {
      const updated = new Map(prev);
      let hasChanges = false;

      for (const [queueId, activeQueue] of prev.entries()) {
        // Find corresponding persisted queue
        const persistedQueue = queues.find((q) => q.queueId === queueId);

        if (persistedQueue && activeQueue.status !== "processing") {
          // Check if all files in the active queue have been persisted with correct status
          const allFilesPersisted = activeQueue.files.every(
            (activeFile: any) => {
              const persistedFile = persistedQueue.files?.find(
                (pf: any) =>
                  pf.id === activeFile.convexFileId ||
                  pf._id === activeFile.convexFileId,
              );
              // Compare using mapped status (database status mapped to UI status)
              return (
                persistedFile &&
                mapDatabaseStatusToUI(persistedFile.status) ===
                  activeFile.status
              );
            },
          );

          if (allFilesPersisted) {
            updated.delete(queueId);
            hasChanges = true;
          }
        }
      }

      return hasChanges ? updated : prev;
    });
  }, [queues]);

  // Process files in the background
  const processFile = useCallback(
    async (queuedFile: QueuedFile, queueId: string, chatId: Id<"chats">) => {
      const fileKey = `${queueId}-${queuedFile.id}`;

      // Create a global key to track this specific file across all instances
      const globalFileKey = `${chatId}_${queuedFile.fileName}_${queuedFile.fileSize}`;

      // Check if this exact file is already being processed globally
      if (globalProcessingFiles.has(globalFileKey)) {
        return;
      }

      // Check if this file is already being processed in this instance
      if (abortControllers.has(fileKey)) {
        return;
      }

      // Mark this file as being processed globally
      globalProcessingFiles.add(globalFileKey);

      // Create AbortController for this file
      const abortController = new AbortController();
      setAbortControllers(
        (prev) => new Map(prev.set(fileKey, abortController)),
      );

      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/";
        // Create a more deterministic file ID based on file content and name
        const uniqueFileId = `file_${queuedFile.fileName.replace(/[^a-zA-Z0-9]/g, "_")}_${queuedFile.fileSize}_${Date.now()}`;

        // Check if already cancelled before starting
        if (abortController.signal.aborted || cancelledFiles.has(fileKey)) {
          return;
        }

        // CRITICAL: Only process files that passed validation (have convexFileId)
        // This prevents processing files that failed size/storage validation
        if (!queuedFile.convexFileId) {
          console.warn(
            `Skipping file ${queuedFile.fileName} - no convexFileId (validation may have failed)`,
          );
          setActiveQueues((prev) => {
            const updated = new Map(prev);
            const queue = updated.get(queueId);
            if (queue) {
              const fileIndex = queue.files.findIndex(
                (f) => f.id === queuedFile.id,
              );
              if (fileIndex !== -1) {
                queue.files[fileIndex] = {
                  ...queue.files[fileIndex],
                  status: "cancelled",
                  error: "File validation failed - file not processed",
                };
                queue.failedFiles += 1;
                updated.set(queueId, { ...queue });
              }
            }
            return updated;
          });
          return;
        }

        // Update status to processing
        setActiveQueues((prev) => {
          const updated = new Map(prev);
          const queue = updated.get(queueId);
          if (queue) {
            const fileIndex = queue.files.findIndex(
              (f) => f.id === queuedFile.id,
            );
            if (fileIndex !== -1) {
              queue.files[fileIndex] = {
                ...queue.files[fileIndex],
                status: "processing",
                progress: 10,
              };
              updated.set(queueId, { ...queue });
            }
          }
          return updated;
        });

        // Step 1: Extract text from file
        const formData = new FormData();
        formData.append("file", queuedFile.file);

        setActiveQueues((prev) => {
          const updated = new Map(prev);
          const queue = updated.get(queueId);
          if (queue) {
            const fileIndex = queue.files.findIndex(
              (f) => f.id === queuedFile.id,
            );
            if (fileIndex !== -1) {
              queue.files[fileIndex] = {
                ...queue.files[fileIndex],
                progress: 30,
              };
              updated.set(queueId, { ...queue });
            }
          }
          return updated;
        });

        const extractResponse = await fetch(baseUrl + "extract-pdf-text", {
          method: "POST",
          body: formData,
          signal: abortController.signal,
        });

        // Check if cancelled after first request
        if (abortController.signal.aborted || cancelledFiles.has(fileKey)) {
          return;
        }

        if (!extractResponse.ok) {
          const errorData = await extractResponse.json();
          throw new Error(
            errorData.detail || "Failed to extract text from file.",
          );
        }

        const extractData = await extractResponse.json();

        // Use extracted_text_length from backend response (more accurate than calculating from text)
        // Fallback to text.length if backend doesn't provide it (backward compatibility)
        const extractedText = extractData.text || "";
        const extractedTextLength =
          extractData.extracted_text_length ?? extractedText.length;

        // Calculate actual Knowledge Units from extracted text length
        // Formula: tokens = Math.ceil(text.length / 4), KU = Math.ceil(tokens / 500)
        const actualTokens = Math.ceil(extractedTextLength / 4);
        const actualKnowledgeUnits = Math.ceil(actualTokens / 500);

        // Check if cancelled before second step
        if (abortController.signal.aborted || cancelledFiles.has(fileKey)) {
          return;
        }

        // Step 2: Create nodes and embeddings
        setActiveQueues((prev) => {
          const updated = new Map(prev);
          const queue = updated.get(queueId);
          if (queue) {
            const fileIndex = queue.files.findIndex(
              (f) => f.id === queuedFile.id,
            );
            if (fileIndex !== -1) {
              queue.files[fileIndex] = {
                ...queue.files[fileIndex],
                progress: 60,
              };
              updated.set(queueId, { ...queue });
            }
          }
          return updated;
        });

        // Check if this is a subchat and get the correct chat ID to use
        let isSubchat = false;
        let actualChatId = chatId as string; // Default to the passed chatId

        // Use passed chatInfo if available, otherwise detect from chatId format
        if (chatInfo) {
          isSubchat = chatInfo.chatType === "app_subchat";
          if (isSubchat && chatInfo.chatId) {
            actualChatId = chatInfo.chatId;
          }
        } else {
          // Fallback: detect subchat from string format
          const chatIdStr = chatId as string;
          if (chatIdStr && chatIdStr.startsWith("subchat_")) {
            isSubchat = true;
            actualChatId = chatIdStr;
          }
        }

        // For subchats, skip embeddings creation since V1 API handles it
        if (isSubchat) {
          // Just mark as completed without calling create_nodes_and_embeddings
          setActiveQueues((prev) => {
            const updated = new Map(prev);
            const queue = updated.get(queueId);
            if (queue) {
              const fileIndex = queue.files.findIndex(
                (f) => f.id === queuedFile.id,
              );
              if (fileIndex !== -1) {
                queue.files[fileIndex] = {
                  ...queue.files[fileIndex],
                  status: "uploaded",
                  progress: 100,
                  uploadedAt: Date.now(),
                  fileId: `subchat_${queuedFile.fileName}_${Date.now()}`, // Generate a simple file ID
                };
                updated.set(queueId, { ...queue });
              }
            }
            return updated;
          });

          // Call onFileProcessed callback
          onFileProcessed?.(
            `subchat_${queuedFile.fileName}_${Date.now()}`,
            queuedFile.fileName,
          );

          return; // Skip the rest of the processing
        }

        const embeddingsPayload = {
          pdf_text: extractData.text,
          pdf_id: uniqueFileId,
          chat_id: actualChatId,
          filename: queuedFile.fileName,
        };

        const nodesResponse = await fetch(
          baseUrl + "create_nodes_and_embeddings",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(embeddingsPayload),
            signal: abortController.signal,
          },
        );

        // Check if cancelled after second request
        if (abortController.signal.aborted || cancelledFiles.has(fileKey)) {
          return;
        }

        if (!nodesResponse.ok) {
          const errorData = await nodesResponse.json();
          throw new Error(
            errorData.detail || "Failed to create knowledge graph nodes.",
          );
        }

        if (queuedFile.convexFileId) {
          try {
            const result = await updateFileProgress({
              fileId: queuedFile.convexFileId,
              status: "completed", // Use 'completed' to match database schema
              progress: 100,
              extractedTextLength: extractedTextLength,
              knowledgeUnits: actualKnowledgeUnits,
            });

            // Also update token ingestion directly to ensure navbar updates
            // This is a backup in case the backend call fails silently
            if (currentChat?.userId) {
              try {
                await addTokenIngestion({
                  userId: currentChat.userId,
                  tokens: actualTokens,
                });
                console.log(
                  `✅ Token ingestion updated in frontend: ${actualTokens} tokens (${actualKnowledgeUnits} KU)`,
                );
              } catch (tokenError) {
                // Don't fail the upload if token tracking fails - backend should handle it
                console.warn(
                  "Failed to update token ingestion from frontend (non-fatal):",
                  tokenError,
                );
              }
            }
          } catch (error) {
            console.error("Failed to update file progress in Convex:", error);
            console.error("Error details:", {
              fileId: queuedFile.convexFileId,
              fileName: queuedFile.fileName,
              error: error,
            });
          }
        } else {
          console.error("No convexFileId found for file:", queuedFile.fileName);
        }

        // Mark as completed and cleanup old files
        setActiveQueues((prev) => {
          const updated = new Map(prev);
          const queue = updated.get(queueId);
          if (queue) {
            const fileIndex = queue.files.findIndex(
              (f) => f.id === queuedFile.id,
            );
            if (fileIndex !== -1) {
              queue.files[fileIndex] = {
                ...queue.files[fileIndex],
                status: "uploaded",
                progress: 100,
                fileId: uniqueFileId,
                uploadedAt: extractData.uploaded_at || Date.now(),
                extractedTextLength: extractedTextLength,
                knowledgeUnits: actualKnowledgeUnits,
              };
              queue.completedFiles += 1;

              // Check if queue is complete
              if (
                queue.completedFiles + queue.failedFiles >=
                queue.totalFiles
              ) {
                queue.status = queue.failedFiles > 0 ? "cancelled" : "uploaded";
                onQueueComplete?.(queueId);
              }

              updated.set(queueId, { ...queue });
            }
          }

          // Cleanup: Keep only the last 20 uploaded files across all queues
          const allUploadedFiles: Array<{
            file: QueuedFile | PersistedFile;
            queueId: string;
          }> = [];

          for (const [qId, q] of updated) {
            q.files.forEach((file) => {
              if (file.status === "uploaded" && file.uploadedAt) {
                allUploadedFiles.push({ file, queueId: qId });
              }
            });
          }

          // Sort by upload time (newest first) and keep only last 20
          allUploadedFiles.sort(
            (a, b) => (b.file.uploadedAt || 0) - (a.file.uploadedAt || 0),
          );
          const filesToKeep = allUploadedFiles.slice(0, 20);
          const fileIdsToKeep = new Set(
            filesToKeep.map((item) => item.file.id),
          );

          // Remove old uploaded files from queues
          for (const [qId, q] of updated) {
            q.files = q.files.filter((file) => {
              // Keep processing files and files within the last 20 uploaded
              return (
                file.status === "processing" ||
                file.status === "cancelled" ||
                fileIdsToKeep.has(file.id)
              );
            });
          }

          return updated;
        });

        // Final check before marking as completed - don't call onFileProcessed if cancelled
        if (!cancelledFiles.has(fileKey)) {
          onFileProcessed?.(uniqueFileId, queuedFile.fileName);

          // Track successful file processing in PostHog
          captureEvent("file_processed", {
            chatId: chatId,
            queueId: queueId,
            fileName: queuedFile.fileName,
            fileSize: queuedFile.fileSize,
            fileType: queuedFile.fileType,
          });

          toast.success(`${queuedFile.fileName} processed successfully!`);
        }
      } catch (error) {
        // Handle AbortError (cancellation) silently
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error("Error processing file:", error);

        // Update Convex database to persist the failure
        if (queuedFile.convexFileId) {
          try {
            await updateFileProgress({
              fileId: queuedFile.convexFileId,
              status: "failed", // Use 'failed' to match database schema
              progress: 0,
              error:
                error instanceof Error ? error.message : "Processing failed",
            });
          } catch (convexError) {
            console.error(
              "Failed to update file error in Convex:",
              convexError,
            );
          }
        }

        setActiveQueues((prev) => {
          const updated = new Map(prev);
          const queue = updated.get(queueId);
          if (queue) {
            const fileIndex = queue.files.findIndex(
              (f) => f.id === queuedFile.id,
            );
            if (fileIndex !== -1) {
              queue.files[fileIndex] = {
                ...queue.files[fileIndex],
                status: "cancelled",
                error:
                  error instanceof Error ? error.message : "Processing failed",
              };
              queue.failedFiles += 1;

              // Check if queue is complete
              if (
                queue.completedFiles + queue.failedFiles >=
                queue.totalFiles
              ) {
                queue.status = queue.failedFiles > 0 ? "cancelled" : "uploaded";
                onQueueComplete?.(queueId);
              }

              updated.set(queueId, { ...queue });
            }
          }
          return updated;
        });

        toast.error(
          `Failed to process ${queuedFile.fileName}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      } finally {
        // Cleanup: Remove abort controller and global processing lock
        setAbortControllers((prev) => {
          const updated = new Map(prev);
          updated.delete(fileKey);
          return updated;
        });

        // Remove from global processing set
        const globalFileKey = `${chatId}_${queuedFile.fileName}_${queuedFile.fileSize}`;
        globalProcessingFiles.delete(globalFileKey);
      }
    },
    [
      onFileProcessed,
      onQueueComplete,
      cancelledFiles,
      currentChat?.userId,
      addTokenIngestion,
    ],
  );

  // Process queue in background
  const processQueue = useCallback(
    async (queue: UploadQueue) => {
      setIsProcessing(true);

      // Process files sequentially to avoid overwhelming the server
      for (const file of queue.files) {
        const fileKey = `${queue.queueId}-${file.id}`;

        // Only process files that have the File object (QueuedFile type) AND passed validation (have convexFileId)
        if (
          file.status === "processing" &&
          !cancelledFiles.has(fileKey) &&
          "file" in file && // Type guard to ensure it's a QueuedFile
          "convexFileId" in file && // Only process files that passed validation
          file.convexFileId // Ensure convexFileId exists
        ) {
          await processFile(file as QueuedFile, queue.queueId, chatId);
          // Small delay between files to prevent rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      setIsProcessing(false);
    },
    [processFile, chatId, cancelledFiles],
  );

  // Upload files (single files or folders)
  const uploadFiles = useCallback(
    async (files: FileList | File[], isFolder = false, folderName?: string) => {
      // Ensure isFolder is always a boolean
      const isFolderBoolean = Boolean(isFolder);
      const fileArray = Array.from(files);

      if (fileArray.length === 0) {
        toast.error("No files selected.");
        return null;
      }

      try {
        // Create queue
        const queueName =
          folderName ||
          (fileArray.length === 1
            ? fileArray[0].name
            : `${fileArray.length} files`);

        const { queueId } = await createUploadQueue({
          chatId,
          name: queueName,
          totalFiles: fileArray.length,
          isFolder: isFolderBoolean,
        });

        // Track file upload started in PostHog
        const totalSize = fileArray.reduce((sum, file) => sum + file.size, 0);
        captureEvent("file_upload_started", {
          chatId: chatId,
          queueId: queueId,
          fileCount: fileArray.length,
          totalSize: totalSize,
          isFolder: isFolderBoolean,
          fileTypes: [...new Set(fileArray.map((f) => f.type || "unknown"))],
        });

        // Prepare queued files
        const queuedFiles: QueuedFile[] = fileArray.map((file) => ({
          file, // Include the File object for processing
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || "application/octet-stream",
          filePath: isFolderBoolean
            ? (file as any).webkitRelativePath
            : undefined,
          status: "processing" as const,
          progress: 0,
          id: uid(),
        }));

        // Add to local state
        const newQueue: UploadQueue = {
          queueId,
          name: queueName,
          totalFiles: fileArray.length,
          completedFiles: 0,
          failedFiles: 0,
          status: "processing",
          isFolder: isFolderBoolean,
          files: queuedFiles,
          createdAt: Date.now(),
        };

        setActiveQueues((prev) => new Map(prev.set(queueId, newQueue)));

        let convexFileIds;
        try {
          convexFileIds = await addFilesToQueue({
            queueId,
            chatId,
            files: queuedFiles.map((f) => ({
              fileName: f.fileName,
              fileSize: f.fileSize,
              fileType: f.fileType,
              filePath: f.filePath,
            })),
          });
        } catch (error) {
          // Validation failed - clean up local state
          setActiveQueues((prev) => {
            const updated = new Map(prev);
            updated.delete(queueId);
            return updated;
          });

          const errorMessage =
            error instanceof Error ? error.message : "File validation failed";
          toast.error(errorMessage);
          console.error("File validation failed:", error);
          return null;
        }

        // Validate the response from Convex
        if (!convexFileIds || !Array.isArray(convexFileIds)) {
          console.error("Invalid Convex file IDs response:", convexFileIds);
          // Clean up local state
          setActiveQueues((prev) => {
            const updated = new Map(prev);
            updated.delete(queueId);
            return updated;
          });
          toast.error(
            "Failed to initialize file processing - invalid server response",
          );
          return null;
        }

        if (convexFileIds.length !== fileArray.length) {
          console.error(
            "Mismatch between uploaded files and Convex file IDs:",
            {
              expectedCount: fileArray.length,
              receivedCount: convexFileIds.length,
              fileNames: fileArray.map((f) => f.name),
              convexFileIds,
            },
          );
          // Clean up local state
          setActiveQueues((prev) => {
            const updated = new Map(prev);
            updated.delete(queueId);
            return updated;
          });
          toast.error(
            `File processing initialization incomplete - expected ${fileArray.length} files, got ${convexFileIds.length} IDs`,
          );
          return null;
        }

        // Update local state with Convex file IDs and start processing
        setActiveQueues((prev) => {
          const updated = new Map(prev);
          const queue = updated.get(queueId);

          if (!queue) {
            console.error("Queue not found in local state:", {
              queueId,
              availableQueues: Array.from(updated.keys()),
            });
            toast.error("Failed to start file processing - queue not found");
            return prev; // Return unchanged state
          }

          if (queue.files.length !== convexFileIds.length) {
            console.error("File count mismatch between queue and Convex IDs:", {
              queueFileCount: queue.files.length,
              convexIdCount: convexFileIds.length,
              queueId,
            });
            toast.error(
              "File processing initialization error - file count mismatch",
            );
            return prev; // Return unchanged state
          }

          const updatedFiles = queue.files.map((file, index) => {
            const convexId = convexFileIds[index];
            if (!convexId) {
              console.error(
                `Missing Convex file ID for file at index ${index}:`,
                file.fileName,
              );
              return file; // Return file unchanged if no Convex ID
            }

            const updatedFile = {
              ...file,
              convexFileId: convexId,
              extractedTextLength: undefined, // Will be set after extraction
              knowledgeUnits: undefined, // Will be set after extraction
            };
            return updatedFile;
          });

          const updatedQueue = { ...queue, files: updatedFiles };
          updated.set(queueId, updatedQueue);

          setTimeout(() => {
            processQueue(updatedQueue);
          }, 0);

          return updated;
        });

        toast.success(
          `Started processing ${fileArray.length} file${fileArray.length > 1 ? "s" : ""}`,
        );
        return queueId;
      } catch (error) {
        console.error("Error creating upload queue:", error);
        toast.error("Failed to start file upload");
        return null;
      }
    },
    [chatId, createUploadQueue, addFilesToQueue, processQueue],
  );

  // Cancel queue
  const cancelUploadQueue = useCallback(
    async (queueId: string) => {
      try {
        // First, abort all HTTP requests for files in this queue and mark them as cancelled
        const cancelledFileKeys = new Set<string>();
        abortControllers.forEach((controller, fileKey) => {
          if (fileKey.startsWith(queueId)) {
            controller.abort();
            cancelledFileKeys.add(fileKey);
          }
        });

        // Add to cancelled files set
        setCancelledFiles((prev) => new Set([...prev, ...cancelledFileKeys]));

        await cancelQueue({ queueId });

        setActiveQueues((prev) => {
          const updated = new Map(prev);
          const queue = updated.get(queueId);
          if (queue) {
            updated.set(queueId, {
              ...queue,
              status: "cancelled",
              files: queue.files.map((f) =>
                f.status === "processing"
                  ? { ...f, status: "cancelled" as const }
                  : f,
              ),
            });
          }
          return updated;
        });

        toast.success("Upload cancelled");
      } catch (error) {
        console.error("Error cancelling queue:", error);
        toast.error("Failed to cancel upload");
      }
    },
    [cancelQueue, abortControllers, cancelledFiles],
  );

  // Get queue progress
  const getQueueProgress = useCallback(
    (queueId: string) => {
      const queue = activeQueues.get(queueId);
      if (!queue) return { completed: 0, total: 0, percentage: 0 };

      const completed = queue.completedFiles;
      const total = queue.totalFiles;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return { completed, total, percentage };
    },
    [activeQueues],
  );

  // Use Convex queues as the primary source (they now include files)
  // Merge with active queues to get real-time updates for processing files
  const allQueuesWithFiles = (queues || []).map((convexQueue) => {
    const activeQueue = activeQueues.get(convexQueue.queueId);

    if (activeQueue) {
      // Always use active queue data when available (for real-time updates)
      // This ensures we see status changes immediately, even before DB propagation
      return activeQueue;
    } else {
      // Use Convex data for queues without active state (persistent)
      // Transform to PersistedFile format (no File objects)
      return {
        ...convexQueue,
        status: mapDatabaseStatusToUI(convexQueue.status),
        files: (convexQueue.files || []).map(
          (file: any): PersistedFile => ({
            id: file.id || file._id,
            fileName: file.fileName,
            fileSize: file.fileSize,
            fileType: file.fileType,
            filePath: file.filePath,
            status: mapDatabaseStatusToUI(file.status), // Map database status to UI status
            progress: file.progress || 0,
            error: file.error,
            fileId: file.fileId,
            convexFileId: file.convexFileId || file._id,
            extractedTextLength: file.extractedTextLength,
            knowledgeUnits: file.knowledgeUnits,
          }),
        ),
      } as UploadQueue;
    }
  });

  return {
    activeQueues: Array.from(activeQueues.values()),
    allQueues: allQueuesWithFiles,
    isProcessing,
    uploadFiles,
    cancelUploadQueue,
    getQueueProgress,
  };
}
