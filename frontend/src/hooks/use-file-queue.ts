import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

// Generate unique ID
const uid = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Map database status to UI status
const mapDatabaseStatusToUI = (
  dbStatus: string,
): "processing" | "uploaded" | "cancelled" => {
  switch (dbStatus) {
    case "completed":
      return "uploaded";
    case "failed":
    case "cancelled":
      return "cancelled";
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
  status: "processing" | "uploaded" | "cancelled";
  progress: number;
  error?: string;
  fileId?: string;
  convexFileId?: Id<"file_upload_queue">; // Convex document ID for updates
  id: string;
}

// Interface for persisted file data (without File object)
export interface PersistedFile {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath?: string;
  status: "processing" | "uploaded" | "cancelled";
  progress: number;
  error?: string;
  fileId?: string;
  convexFileId?: Id<"file_upload_queue">;
}

export interface UploadQueue {
  queueId: string;
  name: string;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  status: "processing" | "uploaded" | "cancelled";
  isFolder: boolean;
  files: QueuedFile[] | PersistedFile[]; // Can be either active or persisted files
  createdAt: number;
}

interface UseFileQueueProps {
  chatId: Id<"chats">;
  onFileProcessed?: (fileId: string, fileName: string) => void;
  onQueueComplete?: (queueId: string) => void;
}

export function useFileQueue({
  chatId,
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

  const queues = useQuery(api.fileQueue.getUserQueues, { chatId });

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

      // Create AbortController for this file
      const abortController = new AbortController();
      setAbortControllers(
        (prev) => new Map(prev.set(fileKey, abortController)),
      );

      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/";
        const uniqueFileId = uid();

        // Check if already cancelled before starting
        if (abortController.signal.aborted || cancelledFiles.has(fileKey)) {
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

        const embeddingsPayload = {
          pdf_text: extractData.text,
          pdf_id: uniqueFileId,
          chat_id: chatId as string,
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

        const nodesData = await nodesResponse.json();

        // Update Convex database to persist the completion
        console.log("Attempting to update file progress:", {
          convexFileId: queuedFile.convexFileId,
          fileName: queuedFile.fileName,
          hasConvexFileId: !!queuedFile.convexFileId,
        });

        if (queuedFile.convexFileId) {
          try {
            const result = await updateFileProgress({
              fileId: queuedFile.convexFileId,
              status: "completed", // Use 'completed' to match database schema
              progress: 100,
            });
            console.log(
              "Successfully updated file progress in Convex:",
              result,
            );
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

        // Mark as completed
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
          return updated;
        });

        // Final check before marking as completed - don't call onFileProcessed if cancelled
        if (!cancelledFiles.has(fileKey)) {
          onFileProcessed?.(uniqueFileId, queuedFile.fileName);
          toast.success(`${queuedFile.fileName} processed successfully!`);
        }
      } catch (error) {
        // Handle AbortError (cancellation) silently
        if (error instanceof Error && error.name === "AbortError") {
          console.log(`File processing cancelled: ${queuedFile.fileName}`);
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
        // Cleanup: Remove abort controller
        setAbortControllers((prev) => {
          const updated = new Map(prev);
          updated.delete(fileKey);
          return updated;
        });
      }
    },
    [onFileProcessed, onQueueComplete, cancelledFiles],
  );

  // Process queue in background
  const processQueue = useCallback(
    async (queue: UploadQueue) => {
      setIsProcessing(true);

      // Process files sequentially to avoid overwhelming the server
      for (const file of queue.files) {
        const fileKey = `${queue.queueId}-${file.id}`;
        console.log(`Processing file ${file.fileName}:`, {
          status: file.status,
          hasFileObject: "file" in file,
          convexFileId: (file as any).convexFileId,
          cancelled: cancelledFiles.has(fileKey),
        });

        // Only process files that have the File object (QueuedFile type)
        if (
          file.status === "processing" &&
          !cancelledFiles.has(fileKey) &&
          "file" in file // Type guard to ensure it's a QueuedFile
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

        // Add files to Convex queue
        console.log(
          "Adding files to Convex queue:",
          queuedFiles.map((f) => f.fileName),
        );
        const convexFileIds = await addFilesToQueue({
          queueId,
          chatId,
          files: queuedFiles.map((f) => ({
            fileName: f.fileName,
            fileSize: f.fileSize,
            fileType: f.fileType,
            filePath: f.filePath,
          })),
        });

        console.log("Received Convex file IDs:", convexFileIds);

        // Validate the response from Convex
        if (!convexFileIds || !Array.isArray(convexFileIds)) {
          console.error("Invalid Convex file IDs response:", convexFileIds);
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
            };
            console.log(
              `✅ Updated file ${file.fileName} with convexFileId:`,
              updatedFile.convexFileId,
            );
            return updatedFile;
          });

          const updatedQueue = { ...queue, files: updatedFiles };
          updated.set(queueId, updatedQueue);

          // Start processing in background immediately with the updated queue
          console.log(
            `🚀 Starting processing for queue ${queueId} with ${updatedFiles.length} files`,
          );
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

    // Debug logging
    if (process.env.NODE_ENV === "development") {
      console.log(`Queue ${convexQueue.queueId}:`, {
        hasActiveQueue: !!activeQueue,
        convexQueueStatus: convexQueue.status,
        activeQueueStatus: activeQueue?.status,
        convexFiles: convexQueue.files?.map((f) => ({
          name: f.fileName,
          status: f.status,
        })),
        activeFiles: activeQueue?.files?.map((f: any) => ({
          name: f.fileName,
          status: f.status,
        })),
      });
    }

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
