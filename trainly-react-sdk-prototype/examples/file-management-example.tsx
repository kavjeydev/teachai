/**
 * Complete File Management Example
 *
 * This example shows how to use Trainly's new file management features
 * with V1 OAuth authentication (using Clerk as an example).
 *
 * NOTE: This example requires @clerk/nextjs to be installed.
 * Replace with your OAuth provider's hooks (Auth0, Firebase, etc.)
 */

import React from "react";
// @ts-ignore - Replace with your OAuth provider
import { useAuth } from "@clerk/nextjs";
import {
  useTrainly,
  TrainlyFileManager,
  FileInfo,
  FileListResult,
  FileDeleteResult,
  BulkUploadResult,
} from "@trainly/react";

export function FileManagementExample() {
  const { getToken } = useAuth();
  const {
    ask,
    upload,
    bulkUploadFiles,
    listFiles,
    deleteFile,
    connectWithOAuthToken,
    isConnected,
    isLoading,
    error,
  } = useTrainly();

  const [files, setFiles] = React.useState<FileInfo[]>([]);
  const [totalSize, setTotalSize] = React.useState(0);
  const [isLoadingFiles, setIsLoadingFiles] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);

  // Auto-connect with OAuth when component mounts
  React.useEffect(() => {
    async function setupTrainly() {
      try {
        const idToken = await getToken();
        if (idToken) {
          await connectWithOAuthToken(idToken);
        }
      } catch (error) {
        console.error("Failed to connect to Trainly:", error);
      }
    }
    setupTrainly();
  }, [getToken, connectWithOAuthToken]);

  // Load files when connected
  React.useEffect(() => {
    if (isConnected) {
      loadFiles();
    }
  }, [isConnected]);

  const loadFiles = async () => {
    try {
      setIsLoadingFiles(true);
      const result: FileListResult = await listFiles();
      setFiles(result.files);
      setTotalSize(result.total_size_bytes);
      console.log(
        `Loaded ${result.total_files} files (${formatBytes(result.total_size_bytes)})`,
      );
    } catch (error) {
      console.error("Failed to load files:", error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      console.log(`Uploading ${file.name} (${formatBytes(file.size)})...`);
      const result = await upload(file);

      if (result.success) {
        console.log(`✅ Upload successful: ${result.filename}`);
        // Reload files to show the new upload
        await loadFiles();
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleDeleteFile = async (fileId: string, filename: string) => {
    if (!confirm(`Delete "${filename}"? This cannot be undone.`)) {
      return;
    }

    try {
      console.log(`Deleting ${filename}...`);
      const result: FileDeleteResult = await deleteFile(fileId);

      console.log(
        `✅ Deleted ${result.filename}, freed ${formatBytes(result.size_bytes_freed)}`,
      );

      // Remove from local state
      setFiles((prev) => prev.filter((f) => f.file_id !== fileId));
      setTotalSize((prev) => prev - result.size_bytes_freed);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleAskAboutFiles = async () => {
    try {
      const answer = await ask(
        "What files do I have uploaded? Give me a summary.",
      );
      alert(`AI Response:\n\n${answer}`);
    } catch (error) {
      console.error("Query failed:", error);
    }
  };

  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0) {
      alert("Please select files first");
      return;
    }

    try {
      console.log(`Starting bulk upload of ${selectedFiles.length} files...`);
      const result = await bulkUploadFiles(selectedFiles);

      console.log("Bulk upload completed:", result);

      // Show detailed results
      const successCount = result.successful_uploads;
      const failCount = result.failed_uploads;

      let message = `Bulk Upload Results:\n\n`;
      message += `✅ Successful: ${successCount}/${result.total_files}\n`;
      message += `❌ Failed: ${failCount}\n`;
      message += `📊 Total Size: ${formatBytes(result.total_size_bytes)}\n\n`;

      if (result.results.length > 0) {
        message += "Individual File Results:\n";
        result.results.forEach((fileResult) => {
          const status = fileResult.success ? "✅" : "❌";
          message += `${status} ${fileResult.filename}`;
          if (fileResult.error) {
            message += ` - ${fileResult.error}`;
          }
          message += `\n`;
        });
      }

      alert(message);

      // Clear selected files and refresh list
      setSelectedFiles([]);
      await loadFiles();
    } catch (error) {
      console.error("Bulk upload failed:", error);
      alert(`Bulk upload failed: ${error}`);
    }
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 10) {
      alert("Maximum 10 files allowed per bulk upload");
      return;
    }
    setSelectedFiles(files);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const styles = {
    container: {
      maxWidth: "800px",
      margin: "0 auto",
      padding: "20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    storageOverview: {
      background: "#f8fafc",
      padding: "20px",
      borderRadius: "8px",
      marginBottom: "20px",
    },
    storageOverviewTitle: {
      margin: "0 0 10px 0",
      color: "#1f2937",
    },
    quickActions: {
      marginBottom: "30px",
    },
    buttonGroup: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap" as const,
    },
    button: {
      background: "#3b82f6",
      color: "white",
      border: "none",
      padding: "10px 16px",
      borderRadius: "6px",
      cursor: "pointer",
      textDecoration: "none",
      display: "inline-block",
    },
    buttonDisabled: {
      background: "#9ca3af",
      cursor: "not-allowed",
    },
    fileGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: "16px",
    },
    fileCard: {
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      padding: "16px",
      background: "white",
    },
    fileInfoTitle: {
      margin: "0 0 8px 0",
      color: "#1f2937",
    },
    fileInfoText: {
      margin: "0 0 4px 0",
      color: "#6b7280",
    },
    fileInfoSmall: {
      color: "#9ca3af",
    },
    deleteButton: {
      background: "#dc2626",
      marginTop: "12px",
      color: "white",
      border: "none",
      padding: "6px 12px",
      borderRadius: "4px",
      cursor: "pointer",
    },
    prebuiltComponent: {
      marginTop: "40px",
      paddingTop: "40px",
      borderTop: "2px solid #e5e7eb",
    },
    error: {
      background: "#fef2f2",
      color: "#dc2626",
      padding: "12px",
      borderRadius: "6px",
      margin: "10px 0",
    },
  };

  if (!isConnected) {
    return (
      <div style={styles.container}>
        <h2>🔐 Connecting to Trainly...</h2>
        <p>Setting up your private workspace with OAuth authentication.</p>
        {error && <div style={styles.error}>Error: {error.message}</div>}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2>📁 File Management Example</h2>

      {/* Storage Overview */}
      <div style={styles.storageOverview}>
        <h3 style={styles.storageOverviewTitle}>Your Storage</h3>
        <p>
          <strong>{files.length} files</strong> •{" "}
          <strong>{formatBytes(totalSize)}</strong> total
        </p>
        {isLoadingFiles && <p>Loading files...</p>}
      </div>

      {/* Quick Actions */}
      <div style={styles.quickActions}>
        <h3>Quick Actions</h3>
        <div style={styles.buttonGroup}>
          <input
            type="file"
            onChange={handleFileUpload}
            accept=".pdf,.docx,.txt,.md,.csv,.json"
            style={{ display: "none" }}
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            style={styles.button}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#2563eb";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#3b82f6";
            }}
          >
            📤 Upload File
          </label>

          <input
            type="file"
            multiple
            onChange={handleFileSelection}
            accept=".pdf,.docx,.txt,.md,.csv,.json"
            style={{ display: "none" }}
            id="bulk-file-upload"
          />
          <label
            htmlFor="bulk-file-upload"
            style={{ ...styles.button, background: "#059669" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#047857";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#059669";
            }}
          >
            📁 Select Multiple Files
          </label>

          {selectedFiles.length > 0 && (
            <button
              onClick={handleBulkUpload}
              style={{ ...styles.button, background: "#dc2626" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#b91c1c";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#dc2626";
              }}
            >
              🚀 Upload {selectedFiles.length} Files
            </button>
          )}

          <button
            onClick={loadFiles}
            disabled={isLoadingFiles}
            style={{
              ...styles.button,
              ...(isLoadingFiles ? styles.buttonDisabled : {}),
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.background = "#2563eb";
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.background = "#3b82f6";
              }
            }}
          >
            🔄 Refresh Files
          </button>

          <button
            onClick={handleAskAboutFiles}
            disabled={isLoading}
            style={{
              ...styles.button,
              ...(isLoading ? styles.buttonDisabled : {}),
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.background = "#2563eb";
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.background = "#3b82f6";
              }
            }}
          >
            🤖 Ask AI About My Files
          </button>
        </div>
      </div>

      {/* Selected Files for Bulk Upload */}
      {selectedFiles.length > 0 && (
        <div
          style={{
            ...styles.storageOverview,
            background: "#f0fdf4",
            border: "1px solid #22c55e",
          }}
        >
          <h3 style={{ color: "#059669" }}>
            📁 Selected Files for Bulk Upload
          </h3>
          <p>
            <strong>{selectedFiles.length} files selected</strong> •{" "}
            <strong>
              {formatBytes(
                selectedFiles.reduce((total, file) => total + file.size, 0),
              )}
            </strong>{" "}
            total
          </p>
          <div style={{ marginTop: "10px" }}>
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "4px 0",
                  fontSize: "14px",
                }}
              >
                <span>📄 {file.name}</span>
                <span style={{ color: "#6b7280" }}>
                  {formatBytes(file.size)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom File List */}
      <div>
        <h3>Custom File Management</h3>
        {files.length === 0 ? (
          <p>No files uploaded yet. Upload a file to get started!</p>
        ) : (
          <div style={styles.fileGrid}>
            {files.map((file) => (
              <div key={file.file_id} style={styles.fileCard}>
                <div>
                  <h4 style={styles.fileInfoTitle}>{file.filename}</h4>
                  <p style={styles.fileInfoText}>
                    {formatBytes(file.size_bytes)} • {file.chunk_count} chunks
                  </p>
                  <small style={styles.fileInfoSmall}>
                    Uploaded:{" "}
                    {new Date(parseInt(file.upload_date)).toLocaleDateString()}
                  </small>
                </div>
                <button
                  onClick={() => handleDeleteFile(file.file_id, file.filename)}
                  style={styles.deleteButton}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#b91c1c";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#dc2626";
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pre-built File Manager Component */}
      <div style={styles.prebuiltComponent}>
        <h3>Pre-built File Manager Component</h3>
        <TrainlyFileManager
          onFileDeleted={(fileId, filename) => {
            console.log(`File deleted via component: ${filename}`);
            // Update local state
            setFiles((prev) => prev.filter((f) => f.file_id !== fileId));
          }}
          onError={(error) => {
            console.error("File manager error:", error);
            alert(`Error: ${error.message}`);
          }}
          showUploadButton={true}
          maxFileSize={5}
        />
      </div>
    </div>
  );
}

export default FileManagementExample;
