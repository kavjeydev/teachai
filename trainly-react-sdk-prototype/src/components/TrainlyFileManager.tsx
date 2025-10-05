"use client";

import * as React from "react";
import { useTrainly } from "../useTrainly";
import { FileInfo, FileListResult, FileDeleteResult } from "../types";

export interface TrainlyFileManagerProps {
  className?: string;
  onFileDeleted?: (fileId: string, filename: string) => void;
  onError?: (error: Error) => void;
  showUploadButton?: boolean;
  maxFileSize?: number; // in MB
}

export function TrainlyFileManager({
  className = "",
  onFileDeleted,
  onError,
  showUploadButton = true,
  maxFileSize = 5,
}: TrainlyFileManagerProps) {
  const { listFiles, deleteFile, upload, isLoading, error } = useTrainly();
  const [files, setFiles] = React.useState<FileInfo[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = React.useState(false);
  const [isDeletingFile, setIsDeletingFile] = React.useState<string | null>(
    null,
  );
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load files on component mount
  React.useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setIsLoadingFiles(true);
      const result: FileListResult = await listFiles();
      setFiles(result.files);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Failed to load files:", error);
      onError?.(error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleDeleteFile = async (fileId: string, filename: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${filename}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      setIsDeletingFile(fileId);
      const result: FileDeleteResult = await deleteFile(fileId);

      // Remove file from local state
      setFiles((prev) => prev.filter((f) => f.file_id !== fileId));

      // Notify parent component
      onFileDeleted?.(fileId, filename);

      console.log(`File deleted: ${result.message}`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Failed to delete file:", error);
      onError?.(error);
    } finally {
      setIsDeletingFile(null);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      const error = new Error(`File size must be less than ${maxFileSize}MB`);
      onError?.(error);
      return;
    }

    try {
      setIsUploading(true);
      const result = await upload(file);

      if (result.success) {
        // Reload files to show the new upload
        await loadFiles();
        console.log(`File uploaded: ${result.filename}`);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Failed to upload file:", error);
      onError?.(error);
    } finally {
      setIsUploading(false);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(parseInt(dateString));
      return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    } catch {
      return dateString;
    }
  };

  const totalSize = files.reduce((sum, file) => sum + file.size_bytes, 0);

  const styles = {
    container: {
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      padding: "16px",
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "16px",
    },
    title: {
      margin: "0 0 4px 0",
      fontSize: "18px",
      fontWeight: "600",
      color: "#1f2937",
    },
    totalSize: {
      margin: "0",
      fontSize: "14px",
      color: "#6b7280",
    },
    uploadButton: {
      backgroundColor: "#3b82f6",
      color: "white",
      border: "none",
      borderRadius: "6px",
      padding: "8px 16px",
      fontSize: "14px",
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
    uploadButtonDisabled: {
      backgroundColor: "#9ca3af",
      cursor: "not-allowed",
    },
    error: {
      backgroundColor: "#fef2f2",
      color: "#dc2626",
      padding: "12px",
      borderRadius: "6px",
      marginBottom: "16px",
      fontSize: "14px",
    },
    loading: {
      textAlign: "center" as const,
      padding: "32px",
      color: "#6b7280",
      fontSize: "14px",
    },
    emptyState: {
      textAlign: "center" as const,
      padding: "32px",
      color: "#6b7280",
    },
    emptyStateText: {
      margin: "0 0 8px 0",
      fontSize: "14px",
    },
    fileItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px",
      border: "1px solid #f3f4f6",
      borderRadius: "6px",
      backgroundColor: "#f9fafb",
      marginBottom: "8px",
      transition: "background-color 0.2s",
    },
    fileName: {
      fontWeight: "500",
      color: "#1f2937",
      fontSize: "14px",
      marginBottom: "4px",
    },
    fileMeta: {
      fontSize: "12px",
      color: "#6b7280",
    },
    deleteButton: {
      backgroundColor: "#dc2626",
      color: "white",
      border: "none",
      borderRadius: "4px",
      padding: "6px 12px",
      fontSize: "12px",
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
    deleteButtonDisabled: {
      backgroundColor: "#9ca3af",
      cursor: "not-allowed",
    },
  };

  return (
    <div className={className} style={styles.container}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Your Files ({files.length})</h3>
          <p style={styles.totalSize}>Total: {formatFileSize(totalSize)}</p>
        </div>

        {showUploadButton && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              disabled={isUploading || isLoading}
              accept=".pdf,.docx,.txt,.md,.csv,.json,.html,.xml,.yaml,.yml,.js,.py,.java,.cpp,.c,.h,.cs,.php,.rb,.sh,.bat,.ps1"
              style={{ display: "none" }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isLoading}
              style={{
                ...styles.uploadButton,
                ...(isUploading || isLoading
                  ? styles.uploadButtonDisabled
                  : {}),
              }}
            >
              {isUploading ? "Uploading..." : "Upload File"}
            </button>
          </div>
        )}
      </div>

      {error && <div style={styles.error}>{error.message}</div>}

      {isLoadingFiles ? (
        <div style={styles.loading}>Loading files...</div>
      ) : files.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>No files uploaded yet.</p>
          {showUploadButton && (
            <p style={styles.emptyStateText}>
              Click "Upload File" to add your first document.
            </p>
          )}
        </div>
      ) : (
        <div>
          {files.map((file) => (
            <div
              key={file.file_id}
              style={styles.fileItem}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f9fafb";
              }}
            >
              <div>
                <div style={styles.fileName}>{file.filename}</div>
                <div style={styles.fileMeta}>
                  {formatFileSize(file.size_bytes)} • {file.chunk_count} chunks
                  • {formatDate(file.upload_date)}
                </div>
              </div>
              <div>
                <button
                  onClick={() => handleDeleteFile(file.file_id, file.filename)}
                  disabled={isDeletingFile === file.file_id || isLoading}
                  style={{
                    ...styles.deleteButton,
                    ...(isDeletingFile === file.file_id || isLoading
                      ? styles.deleteButtonDisabled
                      : {}),
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = "#b91c1c";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = "#dc2626";
                    }
                  }}
                >
                  {isDeletingFile === file.file_id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
