import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

// Generate unique ID
const uid = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export interface QueuedFile {
  file: File;
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath?: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  progress: number;
  error?: string;
  fileId?: string;
  id: string;
}

export interface UploadQueue {
  queueId: string;
  name: string;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  status: "active" | "completed" | "failed" | "cancelled";
  isFolder: boolean;
  files: QueuedFile[];
  createdAt: number;
}

interface UseFileQueueProps {
  chatId: Id<"chats">;
  onFileProcessed?: (fileId: string, fileName: string) => void;
  onQueueComplete?: (queueId: string) => void;
}

export function useFileQueue({ chatId, onFileProcessed, onQueueComplete }: UseFileQueueProps) {
  const [activeQueues, setActiveQueues] = useState<Map<string, UploadQueue>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);

  const createUploadQueue = useMutation(api.fileQueue.createUploadQueue);
  const addFilesToQueue = useMutation(api.fileQueue.addFilesToQueue);
  const updateFileProgress = useMutation(api.fileQueue.updateFileProgress);
  const cancelQueue = useMutation(api.fileQueue.cancelQueue);

  const queues = useQuery(api.fileQueue.getUserQueues, { chatId });

  // Process files in the background
  const processFile = useCallback(async (
    queuedFile: QueuedFile,
    queueId: string,
    chatId: Id<"chats">
  ) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/";
      const uniqueFileId = uid();

      // Update status to processing
      setActiveQueues(prev => {
        const updated = new Map(prev);
        const queue = updated.get(queueId);
        if (queue) {
          const fileIndex = queue.files.findIndex(f => f.id === queuedFile.id);
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

      setActiveQueues(prev => {
        const updated = new Map(prev);
        const queue = updated.get(queueId);
        if (queue) {
          const fileIndex = queue.files.findIndex(f => f.id === queuedFile.id);
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
      });

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json();
        throw new Error(errorData.detail || "Failed to extract text from file.");
      }

      const extractData = await extractResponse.json();

      // Step 2: Create nodes and embeddings
      setActiveQueues(prev => {
        const updated = new Map(prev);
        const queue = updated.get(queueId);
        if (queue) {
          const fileIndex = queue.files.findIndex(f => f.id === queuedFile.id);
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

      const nodesResponse = await fetch(baseUrl + "create_nodes_and_embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(embeddingsPayload),
      });

      if (!nodesResponse.ok) {
        const errorData = await nodesResponse.json();
        throw new Error(errorData.detail || "Failed to create knowledge graph nodes.");
      }

      const nodesData = await nodesResponse.json();

      // Mark as completed
      setActiveQueues(prev => {
        const updated = new Map(prev);
        const queue = updated.get(queueId);
        if (queue) {
          const fileIndex = queue.files.findIndex(f => f.id === queuedFile.id);
          if (fileIndex !== -1) {
            queue.files[fileIndex] = {
              ...queue.files[fileIndex],
              status: "completed",
              progress: 100,
              fileId: uniqueFileId,
            };
            queue.completedFiles += 1;

            // Check if queue is complete
            if (queue.completedFiles + queue.failedFiles >= queue.totalFiles) {
              queue.status = queue.failedFiles > 0 ? "failed" : "completed";
              onQueueComplete?.(queueId);
            }

            updated.set(queueId, { ...queue });
          }
        }
        return updated;
      });

      onFileProcessed?.(uniqueFileId, queuedFile.fileName);
      toast.success(`${queuedFile.fileName} processed successfully!`);

    } catch (error) {
      console.error("Error processing file:", error);

      setActiveQueues(prev => {
        const updated = new Map(prev);
        const queue = updated.get(queueId);
        if (queue) {
          const fileIndex = queue.files.findIndex(f => f.id === queuedFile.id);
          if (fileIndex !== -1) {
            queue.files[fileIndex] = {
              ...queue.files[fileIndex],
              status: "failed",
              error: error instanceof Error ? error.message : "Processing failed",
            };
            queue.failedFiles += 1;

            // Check if queue is complete
            if (queue.completedFiles + queue.failedFiles >= queue.totalFiles) {
              queue.status = queue.failedFiles > 0 ? "failed" : "completed";
              onQueueComplete?.(queueId);
            }

            updated.set(queueId, { ...queue });
          }
        }
        return updated;
      });

      toast.error(`Failed to process ${queuedFile.fileName}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, [onFileProcessed, onQueueComplete]);

  // Process queue in background
  const processQueue = useCallback(async (queue: UploadQueue) => {
    setIsProcessing(true);

    // Process files sequentially to avoid overwhelming the server
    for (const file of queue.files) {
      if (file.status === "pending") {
        await processFile(file, queue.queueId, chatId);
        // Small delay between files to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    setIsProcessing(false);
  }, [processFile, chatId]);

  // Upload files (single files or folders)
  const uploadFiles = useCallback(async (
    files: FileList | File[],
    isFolder = false,
    folderName?: string
  ) => {
    // Ensure isFolder is always a boolean
    const isFolderBoolean = Boolean(isFolder);
    const fileArray = Array.from(files);

    if (fileArray.length === 0) {
      toast.error("No files selected.");
      return null;
    }

    try {
      // Create queue
      const queueName = folderName ||
        (fileArray.length === 1 ? fileArray[0].name : `${fileArray.length} files`);

      const { queueId } = await createUploadQueue({
        chatId,
        name: queueName,
        totalFiles: fileArray.length,
        isFolder: isFolderBoolean,
      });

      // Prepare queued files
      const queuedFiles: QueuedFile[] = fileArray.map(file => ({
        file,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "application/octet-stream",
        filePath: isFolderBoolean ? (file as any).webkitRelativePath : undefined,
        status: "pending" as const,
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
        status: "active",
        isFolder: isFolderBoolean,
        files: queuedFiles,
        createdAt: Date.now(),
      };

      setActiveQueues(prev => new Map(prev.set(queueId, newQueue)));

      // Add files to Convex queue
      await addFilesToQueue({
        queueId,
        chatId,
        files: queuedFiles.map(f => ({
          fileName: f.fileName,
          fileSize: f.fileSize,
          fileType: f.fileType,
          filePath: f.filePath,
        })),
      });

      // Start processing in background
      processQueue(newQueue);

      toast.success(`Started processing ${fileArray.length} file${fileArray.length > 1 ? 's' : ''}`);
      return queueId;

    } catch (error) {
      console.error("Error creating upload queue:", error);
      toast.error("Failed to start file upload");
      return null;
    }
  }, [chatId, createUploadQueue, addFilesToQueue, processQueue]);

  // Cancel queue
  const cancelUploadQueue = useCallback(async (queueId: string) => {
    try {
      await cancelQueue({ queueId });

      setActiveQueues(prev => {
        const updated = new Map(prev);
        const queue = updated.get(queueId);
        if (queue) {
          updated.set(queueId, {
            ...queue,
            status: "cancelled",
            files: queue.files.map(f =>
              f.status === "pending" ? { ...f, status: "cancelled" as const } : f
            ),
          });
        }
        return updated;
      });

      toast.success("Upload queue cancelled");
    } catch (error) {
      console.error("Error cancelling queue:", error);
      toast.error("Failed to cancel upload queue");
    }
  }, [cancelQueue]);

  // Get queue progress
  const getQueueProgress = useCallback((queueId: string) => {
    const queue = activeQueues.get(queueId);
    if (!queue) return { completed: 0, total: 0, percentage: 0 };

    const completed = queue.completedFiles;
    const total = queue.totalFiles;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  }, [activeQueues]);

  return {
    activeQueues: Array.from(activeQueues.values()),
    isProcessing,
    uploadFiles,
    cancelUploadQueue,
    getQueueProgress,
  };
}
