# 📁 File Management API Documentation

Complete guide for using Trainly's file management features in your React applications.

## 🚀 Quick Start

### Prerequisites

- ✅ V1 Trusted Issuer authentication setup
- ✅ OAuth provider configured (Clerk, Auth0, etc.)
- ✅ `@trainly/react` version 1.2.0 or higher

### Basic Setup

```tsx
import { TrainlyProvider, useTrainly } from "@trainly/react";
import { useAuth } from "@your-oauth-provider";

function App() {
  return (
    <TrainlyProvider appId="your_app_id">
      <FileManager />
    </TrainlyProvider>
  );
}

function FileManager() {
  const { getToken } = useAuth();
  const { connectWithOAuthToken, listFiles, deleteFile } = useTrainly();

  React.useEffect(() => {
    async function connect() {
      const token = await getToken();
      await connectWithOAuthToken(token);
    }
    connect();
  }, []);

  // Your file management logic here...
}
```

## 📋 API Reference

### `listFiles(): Promise<FileListResult>`

Retrieves all files uploaded by the current user to their permanent subchat.

**Returns:**

```typescript
interface FileListResult {
  success: boolean; // Operation success status
  files: FileInfo[]; // Array of user's files
  total_files: number; // Total number of files
  total_size_bytes: number; // Total storage used in bytes
}

interface FileInfo {
  file_id: string; // Unique file identifier (use for deletion)
  filename: string; // Original filename with extension
  upload_date: string; // Unix timestamp in milliseconds as string
  size_bytes: number; // File size in bytes
  chunk_count: number; // Number of text chunks created from file
}
```

**Example Usage:**

```tsx
const { listFiles } = useTrainly();

const loadUserFiles = async () => {
  try {
    const result = await listFiles();

    if (result.success) {
      console.log(`📊 Found ${result.total_files} files`);
      console.log(`💾 Using ${formatBytes(result.total_size_bytes)} storage`);

      result.files.forEach((file, index) => {
        console.log(`${index + 1}. ${file.filename}`);
        console.log(`   📏 Size: ${formatBytes(file.size_bytes)}`);
        console.log(`   🧩 Chunks: ${file.chunk_count}`);
        console.log(`   📅 Uploaded: ${formatDate(file.upload_date)}`);
        console.log(`   🆔 ID: ${file.file_id}`);
        console.log("");
      });
    }
  } catch (error) {
    console.error("❌ Failed to list files:", error.message);
  }
};
```

**Error Scenarios:**

- `401 Unauthorized` - OAuth token expired or invalid
- `400 Bad Request` - Missing X-App-ID header
- `500 Internal Error` - Database or server issues

### `deleteFile(fileId: string): Promise<FileDeleteResult>`

Permanently deletes a specific file and all its associated data chunks.

**Parameters:**

- `fileId` (string) - The unique file identifier from `listFiles()`

**Returns:**

```typescript
interface FileDeleteResult {
  success: boolean; // Operation success status
  message: string; // Human-readable success message
  file_id: string; // ID of the deleted file
  filename: string; // Name of the deleted file
  chunks_deleted: number; // Number of text chunks removed
  size_bytes_freed: number; // Storage space freed up in bytes
}
```

**Example Usage:**

```tsx
const { deleteFile } = useTrainly();

const handleDeleteFile = async (fileId: string, filename: string) => {
  // 1. Always confirm with user first
  const confirmed = confirm(
    `Are you sure you want to delete "${filename}"?\n\n` +
      `This action cannot be undone and will permanently remove the file from your AI workspace.`,
  );

  if (!confirmed) {
    console.log("🚫 Deletion cancelled by user");
    return;
  }

  try {
    // 2. Perform deletion
    console.log(`🗑️ Deleting ${filename}...`);
    const result = await deleteFile(fileId);

    // 3. Handle success
    console.log(`✅ ${result.message}`);
    console.log(`📊 Freed ${formatBytes(result.size_bytes_freed)} of storage`);
    console.log(`🧩 Removed ${result.chunks_deleted} text chunks`);

    // 4. Update your UI state
    // Remove file from local state, refresh lists, etc.

    return result;
  } catch (error) {
    // 5. Handle errors gracefully
    console.error(`❌ Failed to delete ${filename}:`, error.message);

    if (error.message.includes("404")) {
      alert("File not found - it may have already been deleted");
    } else if (error.message.includes("401")) {
      alert("Session expired - please refresh the page");
    } else {
      alert(`Failed to delete file: ${error.message}`);
    }

    throw error;
  }
};
```

**Error Scenarios:**

- `404 Not Found` - File doesn't exist or already deleted
- `401 Unauthorized` - OAuth token expired or invalid
- `403 Forbidden` - User doesn't own this file
- `400 Bad Request` - Invalid file ID format
- `500 Internal Error` - Database or server issues

## 🎨 Pre-built Components

### `<TrainlyFileManager />`

Ready-to-use component for complete file management functionality.

**Props:**

```typescript
interface TrainlyFileManagerProps {
  className?: string; // Custom CSS class
  onFileDeleted?: (fileId: string, filename: string) => void; // Delete callback
  onError?: (error: Error) => void; // Error callback
  showUploadButton?: boolean; // Show upload button (default: true)
  maxFileSize?: number; // Max file size in MB (default: 5)
}
```

**Features:**

- 📋 File list with metadata (name, size, chunks, upload date)
- 🗑️ Delete buttons with confirmation dialogs
- 📤 Optional upload functionality
- 📊 Storage overview (total files and size)
- 🔄 Auto-refresh after operations
- ⚠️ Error handling and user feedback
- 🎨 Professional styling (inline styles, no dependencies)

**Example:**

```tsx
import { TrainlyFileManager } from "@trainly/react";

function MyFileWorkspace() {
  const [userNotification, setUserNotification] = useState("");

  return (
    <div>
      <h2>My Documents</h2>

      {userNotification && (
        <div className="notification">{userNotification}</div>
      )}

      <TrainlyFileManager
        className="my-file-manager"
        onFileDeleted={(fileId, filename) => {
          setUserNotification(`✅ Deleted "${filename}" successfully`);
          setTimeout(() => setUserNotification(""), 3000);
        }}
        onError={(error) => {
          setUserNotification(`❌ Error: ${error.message}`);
          setTimeout(() => setUserNotification(""), 5000);
        }}
        showUploadButton={true}
        maxFileSize={10} // 10MB limit
      />
    </div>
  );
}
```

## 🔧 Advanced Usage Patterns

### 1. **Bulk File Operations**

```tsx
const { listFiles, deleteFile } = useTrainly();

const bulkDeleteFiles = async (fileIds: string[]) => {
  const results = [];
  let totalFreed = 0;

  for (const fileId of fileIds) {
    try {
      const result = await deleteFile(fileId);
      results.push({ success: true, ...result });
      totalFreed += result.size_bytes_freed;
    } catch (error) {
      results.push({ success: false, fileId, error: error.message });
    }
  }

  const successful = results.filter((r) => r.success).length;
  console.log(`✅ Deleted ${successful}/${fileIds.length} files`);
  console.log(`💾 Freed ${formatBytes(totalFreed)} total storage`);

  return results;
};

// Usage
const deleteOldFiles = async () => {
  const files = await listFiles();
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const oldFiles = files.files.filter(
    (file) => parseInt(file.upload_date) < thirtyDaysAgo,
  );

  if (oldFiles.length > 0) {
    const confirmed = confirm(
      `Delete ${oldFiles.length} files older than 30 days?`,
    );
    if (confirmed) {
      await bulkDeleteFiles(oldFiles.map((f) => f.file_id));
    }
  }
};
```

### 2. **Storage Quota Management**

```tsx
const { listFiles, deleteFile } = useTrainly();

const manageStorageQuota = async (maxBytes: number) => {
  const files = await listFiles();

  if (files.total_size_bytes <= maxBytes) {
    console.log("✅ Within storage quota");
    return;
  }

  console.log(
    `⚠️ Over quota by ${formatBytes(files.total_size_bytes - maxBytes)}`,
  );

  // Sort files by size (largest first) for efficient cleanup
  const filesBySize = [...files.files].sort(
    (a, b) => b.size_bytes - a.size_bytes,
  );

  let bytesToFree = files.total_size_bytes - maxBytes;
  const filesToDelete = [];

  for (const file of filesBySize) {
    if (bytesToFree <= 0) break;
    filesToDelete.push(file);
    bytesToFree -= file.size_bytes;
  }

  const confirmed = confirm(
    `Delete ${filesToDelete.length} largest files to free ${formatBytes(filesToDelete.reduce((sum, f) => sum + f.size_bytes, 0))}?`,
  );

  if (confirmed) {
    for (const file of filesToDelete) {
      try {
        await deleteFile(file.file_id);
        console.log(`🗑️ Deleted ${file.filename}`);
      } catch (error) {
        console.error(`Failed to delete ${file.filename}:`, error);
      }
    }
  }
};
```

### 3. **File Type Management**

```tsx
const { listFiles, deleteFile } = useTrainly();

const deleteFilesByType = async (fileExtension: string) => {
  const files = await listFiles();

  const targetFiles = files.files.filter((file) =>
    file.filename.toLowerCase().endsWith(`.${fileExtension.toLowerCase()}`),
  );

  if (targetFiles.length === 0) {
    console.log(`No ${fileExtension} files found`);
    return;
  }

  const totalSize = targetFiles.reduce((sum, f) => sum + f.size_bytes, 0);
  const confirmed = confirm(
    `Delete all ${targetFiles.length} ${fileExtension} files?\n` +
      `This will free ${formatBytes(totalSize)} of storage.`,
  );

  if (confirmed) {
    for (const file of targetFiles) {
      try {
        await deleteFile(file.file_id);
      } catch (error) {
        console.error(`Failed to delete ${file.filename}:`, error);
      }
    }

    console.log(`✅ Deleted all ${fileExtension} files`);
  }
};

// Usage examples
await deleteFilesByType("pdf"); // Delete all PDFs
await deleteFilesByType("txt"); // Delete all text files
await deleteFilesByType("docx"); // Delete all Word documents
```

### 4. **Integration with State Management**

```tsx
// Using with React state
function FileManagerWithState() {
  const { listFiles, deleteFile } = useTrainly();
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [totalStorage, setTotalStorage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const refreshFiles = async () => {
    setIsLoading(true);
    try {
      const result = await listFiles();
      setFiles(result.files);
      setTotalStorage(result.total_size_bytes);
    } catch (error) {
      console.error("Failed to refresh files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      const result = await deleteFile(fileId);

      // Update local state immediately for better UX
      setFiles((prev) => prev.filter((f) => f.file_id !== fileId));
      setTotalStorage((prev) => prev - result.size_bytes_freed);

      // Show success feedback
      console.log(`✅ Deleted ${result.filename}`);
    } catch (error) {
      console.error("Delete failed:", error);
      // Refresh to ensure state consistency
      await refreshFiles();
    }
  };

  // Load files on mount
  React.useEffect(() => {
    refreshFiles();
  }, []);

  return (
    <div>
      <div>
        <h3>My Files ({files.length})</h3>
        <p>Storage: {formatBytes(totalStorage)}</p>
        <button onClick={refreshFiles} disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {files.map((file) => (
        <div key={file.file_id}>
          <span>{file.filename}</span>
          <button onClick={() => handleDelete(file.file_id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

## 🔒 Security & Privacy

### Authentication Requirements

File management operations require V1 Trusted Issuer authentication:

```tsx
// ✅ Correct - V1 mode with OAuth
<TrainlyProvider appId="your_app_id">
  {/* File management works here */}
</TrainlyProvider>

// ❌ Won't work - Legacy API key mode
<TrainlyProvider apiKey="tk_chat_123">
  {/* File management not available */}
</TrainlyProvider>

// ❌ Won't work - App secret mode
<TrainlyProvider appSecret="as_secret_123">
  {/* File management not available */}
</TrainlyProvider>
```

### Privacy Guarantees

1. **User Isolation**: Users can only access their own files
2. **Developer Blindness**: App developers cannot see user files or content
3. **Permanent Subchats**: Same user always gets the same private workspace
4. **OAuth Validation**: Every request validated against OAuth provider
5. **Audit Trail**: All operations logged for security

### Error Handling

```tsx
const handleFileOperation = async () => {
  try {
    const result = await deleteFile(fileId);
    // Handle success
  } catch (error) {
    // Parse error types
    if (error.message.includes("V1 mode")) {
      // Not using V1 authentication
      alert("File management requires V1 OAuth setup");
    } else if (error.message.includes("401")) {
      // Authentication issue
      alert("Please sign in again");
    } else if (error.message.includes("404")) {
      // File not found
      alert("File not found - it may have been deleted already");
    } else {
      // Generic error
      alert(`Operation failed: ${error.message}`);
    }
  }
};
```

## 📊 Storage Analytics

File operations automatically update storage analytics visible to developers:

### What Developers See (Privacy-Safe)

- Total files across all users
- Total storage used across all users
- File type distribution (PDF, DOCX, etc.)
- User activity summaries (hashed user IDs only)

### What Developers DON'T See

- Individual file names or content
- Specific user file lists
- Raw user data or queries
- Personal information

### Analytics Example

```tsx
// After user deletes files, developer dashboard shows:
{
  "totalFiles": 1847,           // Decreased from 1850
  "totalStorageBytes": 52428800, // Decreased by deleted file sizes
  "fileTypeStats": {
    "pdf": 892,                 // Decreased if PDFs were deleted
    "docx": 445,
    "txt": 510
  },
  "userActivitySummary": [
    {
      "userIdHash": "user_***abc", // Privacy-safe hash
      "filesUploaded": 12,         // Decreased from 15
      "storageUsedBytes": 2048000  // Decreased by deleted files
    }
  ]
}
```

## 🚨 Important Notes

### Permanent Deletion

- ⚠️ **Cannot be undone**: Deleted files are permanently removed
- 🗑️ **Immediate effect**: Files are deleted from database instantly
- 📊 **Analytics updated**: Storage counters decrease immediately
- 🤖 **AI impact**: Deleted files no longer available for AI queries

### Best Practices

1. **Always Confirm**: Use confirmation dialogs before deletion
2. **Handle Errors**: Implement proper error handling for all scenarios
3. **Update State**: Refresh file lists after operations
4. **User Feedback**: Show loading states and success/error messages
5. **Storage Awareness**: Monitor storage usage and provide cleanup options

### Performance Considerations

- **Batch Operations**: For multiple deletions, process sequentially to avoid rate limits
- **Large Files**: Deletion time scales with file size and chunk count
- **Network Timeouts**: Implement proper timeout handling for slow connections

## 🛠️ Utility Functions

### Format File Sizes

```tsx
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};
```

### Format Upload Dates

```tsx
const formatDate = (timestampString: string): string => {
  try {
    const date = new Date(parseInt(timestampString));
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  } catch {
    return "Unknown date";
  }
};
```

### File Type Detection

```tsx
const getFileType = (filename: string): string => {
  const ext = filename.toLowerCase().split(".").pop() || "";

  const typeMap: Record<string, string> = {
    pdf: "📄 PDF Document",
    docx: "📝 Word Document",
    doc: "📝 Word Document",
    txt: "📄 Text File",
    md: "📝 Markdown",
    csv: "📊 Spreadsheet",
    json: "🔧 JSON Data",
    html: "🌐 Web Page",
    xml: "🔧 XML Data",
    yaml: "⚙️ YAML Config",
    yml: "⚙️ YAML Config",
    js: "💻 JavaScript",
    ts: "💻 TypeScript",
    py: "🐍 Python",
    java: "☕ Java",
    cpp: "⚡ C++",
    cs: "🔷 C#",
    php: "🐘 PHP",
  };

  return typeMap[ext] || "📄 Document";
};
```

## 🔍 Troubleshooting

### Common Issues

**"File management requires V1 OAuth authentication"**

- Solution: Ensure you're using `appId` and `connectWithOAuthToken()`, not `apiKey` or `appSecret`

**"File not found" errors**

- Solution: File may have been deleted already, refresh file list

**"Authentication expired" errors**

- Solution: OAuth token expired, user needs to sign in again

**Empty file list when files exist**

- Solution: Check that user is properly authenticated and using correct app ID

### Debug Mode

```tsx
const debugFileOperations = async () => {
  console.log("🔍 Debug: File Management Status");

  try {
    const files = await listFiles();
    console.log("✅ listFiles() working:", files.success);
    console.log("📊 Files found:", files.total_files);

    if (files.files.length > 0) {
      const testFile = files.files[0];
      console.log("🧪 Test file:", testFile.filename);
      console.log("🆔 Test file ID:", testFile.file_id);

      // Don't actually delete in debug mode
      console.log("ℹ️ deleteFile() would work with ID:", testFile.file_id);
    }
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
    console.error("🔧 Check authentication and V1 setup");
  }
};
```

## 🎯 Migration Guide

### From Legacy File Handling

If you're upgrading from an older version:

```tsx
// OLD: Manual file tracking
const [uploadedFiles, setUploadedFiles] = useState([]);

const handleUpload = async (file) => {
  const result = await upload(file);
  setUploadedFiles((prev) => [...prev, { name: file.name, size: file.size }]);
};

// NEW: Automatic file management
const { listFiles, deleteFile, upload } = useTrainly();

const handleUpload = async (file) => {
  const result = await upload(file);
  // Files are automatically tracked, just refresh the list
  const updatedFiles = await listFiles();
  setFiles(updatedFiles.files);
};

const handleDelete = async (fileId) => {
  const result = await deleteFile(fileId);
  // Storage analytics updated automatically
  console.log(`Freed ${result.size_bytes_freed} bytes`);
};
```

---

**Need help?** Check out the [complete example](./examples/file-management-example.tsx) or visit [trainly.com/docs](https://trainly.com/docs) for more documentation.
