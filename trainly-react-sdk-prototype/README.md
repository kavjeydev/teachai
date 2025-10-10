# @trainly/react

**Dead simple RAG integration for React apps with V1 OAuth Authentication**

Go from `npm install` to working AI in under 5 minutes. Now supports direct OAuth integration with **permanent user subchats** and complete privacy protection.

## 🆕 **NEW: V1 Trusted Issuer Authentication**

Use your existing OAuth provider (Clerk, Auth0, Cognito) directly with Trainly! Users get permanent private workspaces, and developers never see raw files or queries.

### V1 Quick Start

#### 1. Install

```bash
npm install @trainly/react
```

#### 2. Register Your OAuth App (One-time)

```bash
curl -X POST "http://localhost:8000/v1/console/apps/register" \
  -H "X-Admin-Token: admin_dev_token_123" \
  -F "app_name=My App" \
  -F "issuer=https://clerk.myapp.com" \
  -F 'allowed_audiences=["my-clerk-frontend-api"]'
```

Save the `app_id` from the response!

#### 3. Setup with V1 (Clerk Example)

```tsx
// app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs";
import { TrainlyProvider } from "@trainly/react";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ClerkProvider>
          <TrainlyProvider appId="your_app_id_from_step_2">
            {children}
          </TrainlyProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
```

#### 4. Use with OAuth Authentication

```tsx
// Any component
import { useAuth } from "@clerk/nextjs";
import { useTrainly } from "@trainly/react";

function MyComponent() {
  const { getToken } = useAuth();
  const { ask, connectWithOAuthToken } = useTrainly();

  React.useEffect(() => {
    async function setupTrainly() {
      const idToken = await getToken();
      await connectWithOAuthToken(idToken);
    }
    setupTrainly();
  }, []);

  const handleClick = async () => {
    const answer = await ask("What files do I have?");
    console.log(answer); // AI response from user's permanent private subchat!
  };

  return <button onClick={handleClick}>Ask My AI</button>;
}
```

## 🔒 **V1 Benefits**

- ✅ **Permanent User Data**: Same user = same private subchat forever
- ✅ **Complete Privacy**: Developer never sees user files or queries
- ✅ **Any OAuth Provider**: Clerk, Auth0, Cognito, Firebase, custom OIDC
- ✅ **Zero Migration**: Works with your existing OAuth setup
- ✅ **Simple Integration**: Just add `appId` and use `connectWithOAuthToken()`

## 🏷️ **NEW: Custom Scopes (Zero Config)**

Tag your documents with custom attributes for powerful filtering and organization:

```tsx
import { useTrainly } from "@trainly/react";

function MyApp() {
  const { upload, ask } = useTrainly();

  // 1. Upload with scopes - use any keys you want!
  await upload(file, {
    playlist_id: "xyz123",
    workspace_id: "acme_corp",
    project: "alpha",
  });

  // 2. Query with scope filters - only get results from matching documents
  const answer = await ask("What are the key features?", {
    scope_filters: { playlist_id: "xyz123" },
  });
  // ☝️ Only searches documents with playlist_id="xyz123"

  // Query with multiple filters
  const answer2 = await ask("Show me updates", {
    scope_filters: {
      workspace_id: "acme_corp",
      project: "alpha",
    },
  });
  // ☝️ Only searches documents matching ALL specified scopes

  // Query everything (no filters)
  const answer3 = await ask("What do I have?");
  // ☝️ Searches ALL user's documents
}
```

**No setup required!** Just pass any key-value pairs - perfect for multi-tenant apps, playlist systems, workspace organization, and more.

**Use Cases:**

- 🎵 **Playlist Apps**: Filter by `playlist_id` to query specific playlists
- 🏢 **Multi-Tenant SaaS**: Filter by `tenant_id` or `workspace_id`
- 📁 **Project Management**: Filter by `project_id` or `team_id`
- 👥 **User Segmentation**: Filter by `user_tier`, `department`, etc.

[📖 Full Scopes Guide](./SCOPES_GUIDE.md)

## 📁 **File Management**

Users can manage their uploaded files directly:

```tsx
import { useTrainly, TrainlyFileManager } from "@trainly/react";

function MyApp() {
  const { listFiles, deleteFile, upload } = useTrainly();

  // List all user's files
  const handleListFiles = async () => {
    const result = await listFiles();
    console.log(
      `${result.total_files} files, ${result.total_size_bytes} bytes total`,
    );
    result.files.forEach((file) => {
      console.log(
        `${file.filename}: ${file.size_bytes} bytes, ${file.chunk_count} chunks`,
      );
    });
  };

  // Delete a specific file
  const handleDeleteFile = async (fileId) => {
    const result = await deleteFile(fileId);
    console.log(
      `Deleted ${result.filename}, freed ${result.size_bytes_freed} bytes`,
    );
  };

  return (
    <div>
      <button onClick={handleListFiles}>List My Files</button>

      {/* Pre-built file manager component */}
      <TrainlyFileManager
        onFileDeleted={(fileId, filename) => {
          console.log(`File deleted: ${filename}`);
        }}
        onError={(error) => {
          console.error("File operation failed:", error);
        }}
        showUploadButton={true}
        maxFileSize={5} // MB
      />
    </div>
  );
}
```

### File Management Features

- 📋 **List Files**: View all uploaded documents with metadata
- 🗑️ **Delete Files**: Remove files and free up storage space
- 📊 **Storage Analytics**: Track file sizes and storage usage

## 🏷️ **NEW in v1.4.0: Custom Scopes**

Tag your documents with custom attributes for powerful data segmentation!

```tsx
import { useTrainly } from "@trainly/react";

function PlaylistUploader({ playlistId }) {
  const { upload } = useTrainly();

  const handleUpload = async (file: File) => {
    // Upload with custom scope values
    await upload(file, {
      playlist_id: playlistId,
      user_id: currentUser.id,
      is_public: false,
    });
  };

  return (
    <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
  );
}
```

### Scope Features

- 🎯 **Data Segmentation**: Keep playlists, workspaces, or projects separate
- ⚡ **Faster Queries**: Filter at database level before vector search
- 🔒 **Complete Isolation**: Multi-tenant apps with full data privacy
- 🎨 **Flexible**: Define any custom attributes you need

### With TrainlyUpload Component

```tsx
<TrainlyUpload
  variant="drag-drop"
  scopeValues={{
    playlist_id: "playlist_123",
    workspace_id: "workspace_456",
  }}
  onUpload={(files) => console.log("Uploaded with scopes!")}
/>
```

### Complete Documentation

See **[SCOPES_GUIDE.md](./SCOPES_GUIDE.md)** for:

- Complete API reference
- Real-world examples
- Advanced patterns
- Testing & debugging
- Migration guide

**Quick Reference:**

- `upload(file, scopeValues)` - Upload with scopes
- `bulkUploadFiles(files, scopeValues)` - Bulk upload with scopes
- `<TrainlyUpload scopeValues={{...}} />` - Component with scopes
- 🔄 **Auto-Refresh**: File list updates after uploads/deletions
- 🎨 **Pre-built UI**: `TrainlyFileManager` component with styling
- 🔒 **Privacy-First**: Only works in V1 mode with OAuth authentication

## 📚 **Detailed File Management Documentation**

### **1. Listing Files**

Get all files uploaded to the user's permanent subchat:

```tsx
import { useTrainly } from "@trainly/react";

function FileList() {
  const { listFiles } = useTrainly();

  const handleListFiles = async () => {
    try {
      const result = await listFiles();

      console.log(`Total files: ${result.total_files}`);
      console.log(`Total storage: ${formatBytes(result.total_size_bytes)}`);

      result.files.forEach((file) => {
        console.log(`📄 ${file.filename}`);
        console.log(`   Size: ${formatBytes(file.size_bytes)}`);
        console.log(`   Chunks: ${file.chunk_count}`);
        console.log(
          `   Uploaded: ${new Date(parseInt(file.upload_date)).toLocaleDateString()}`,
        );
        console.log(`   ID: ${file.file_id}`);
      });
    } catch (error) {
      console.error("Failed to list files:", error);
    }
  };

  return <button onClick={handleListFiles}>List My Files</button>;
}
```

**Response Structure:**

```typescript
interface FileListResult {
  success: boolean;
  files: FileInfo[];
  total_files: number;
  total_size_bytes: number;
}

interface FileInfo {
  file_id: string; // Unique identifier for deletion
  filename: string; // Original filename
  upload_date: string; // Unix timestamp (milliseconds)
  size_bytes: number; // File size in bytes
  chunk_count: number; // Number of text chunks created
}
```

### **2. Bulk Upload Files**

Upload multiple files at once (up to 10 files per request):

```tsx
import { useTrainly } from "@trainly/react";

function BulkFileUpload() {
  const { bulkUploadFiles } = useTrainly();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 10) {
      alert("Maximum 10 files allowed per bulk upload");
      return;
    }
    setSelectedFiles(files);
  };

  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      const result = await bulkUploadFiles(selectedFiles);

      console.log(`Bulk upload completed: ${result.message}`);
      console.log(
        `Successful: ${result.successful_uploads}/${result.total_files}`,
      );
      console.log(`Total size: ${formatBytes(result.total_size_bytes)}`);

      // Review individual file results
      result.results.forEach((fileResult) => {
        if (fileResult.success) {
          console.log(`✅ ${fileResult.filename} - ${fileResult.message}`);
        } else {
          console.log(`❌ ${fileResult.filename} - ${fileResult.error}`);
        }
      });

      // Clear selection after successful upload
      setSelectedFiles([]);
    } catch (error) {
      console.error("Bulk upload failed:", error);
    }
  };

  return (
    <div>
      <input
        type="file"
        multiple
        accept=".pdf,.txt,.docx"
        onChange={handleFileSelect}
      />

      {selectedFiles.length > 0 && (
        <div>
          <p>Selected files: {selectedFiles.length}</p>
          <ul>
            {selectedFiles.map((file, index) => (
              <li key={index}>
                {file.name} ({formatBytes(file.size)})
              </li>
            ))}
          </ul>
          <button onClick={handleBulkUpload}>
            Upload {selectedFiles.length} Files
          </button>
        </div>
      )}
    </div>
  );
}

// Helper function for formatting file sizes
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
```

**Bulk Upload Features:**

- ✅ **Efficient**: Upload up to 10 files in a single API call
- ✅ **Detailed Results**: Individual success/failure status for each file
- ✅ **Error Resilience**: Partial failures don't stop other files
- ✅ **Progress Tracking**: Total size and success metrics
- ✅ **Automatic Retry**: Token refresh handling built-in

### **3. Deleting Files**

Remove a specific file and free up storage space:

```tsx
import { useTrainly } from "@trainly/react";

function FileDeleter() {
  const { deleteFile, listFiles } = useTrainly();

  const handleDeleteFile = async (fileId: string, filename: string) => {
    // Always confirm before deletion
    const confirmed = confirm(
      `Delete "${filename}"? This will permanently remove the file and cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      const result = await deleteFile(fileId);

      console.log(`✅ ${result.message}`);
      console.log(`🗑️ Deleted: ${result.filename}`);
      console.log(`💾 Storage freed: ${formatBytes(result.size_bytes_freed)}`);
      console.log(`📊 Chunks removed: ${result.chunks_deleted}`);

      // Optionally refresh file list
      await listFiles();
    } catch (error) {
      console.error("Failed to delete file:", error);
      alert(`Failed to delete file: ${error.message}`);
    }
  };

  // Example: Delete first file
  const deleteFirstFile = async () => {
    const files = await listFiles();
    if (files.files.length > 0) {
      const firstFile = files.files[0];
      await handleDeleteFile(firstFile.file_id, firstFile.filename);
    }
  };

  return <button onClick={deleteFirstFile}>Delete First File</button>;
}
```

**Response Structure:**

```typescript
interface FileDeleteResult {
  success: boolean;
  message: string; // Human-readable success message
  file_id: string; // ID of deleted file
  filename: string; // Name of deleted file
  chunks_deleted: number; // Number of chunks removed
  size_bytes_freed: number; // Storage space freed up
}
```

### **4. Pre-built File Manager Component**

Use the ready-made component for complete file management:

```tsx
import { TrainlyFileManager } from "@trainly/react";

function MyApp() {
  return (
    <TrainlyFileManager
      // Optional: Custom CSS class
      className="my-custom-styles"
      // Callback when file is deleted
      onFileDeleted={(fileId, filename) => {
        console.log(`File deleted: ${filename} (ID: ${fileId})`);
        // Update your app state, show notification, etc.
      }}
      // Error handling callback
      onError={(error) => {
        console.error("File operation failed:", error);
        // Show user-friendly error message
        alert(`Error: ${error.message}`);
      }}
      // Show upload button in component
      showUploadButton={true}
      // Maximum file size in MB
      maxFileSize={5}
    />
  );
}
```

**Component Features:**

- 📋 **File List**: Shows all files with metadata
- 🔄 **Auto-Refresh**: Updates after uploads/deletions
- ⚠️ **Confirmation**: Asks before deleting files
- 📊 **Storage Stats**: Shows total files and storage used
- 🎨 **Styled**: Clean, professional appearance
- 📱 **Responsive**: Works on mobile and desktop

### **5. Complete Integration Example**

Here's a full example showing all file operations together:

```tsx
import React from "react";
import { useAuth } from "@clerk/nextjs"; // or your OAuth provider
import { useTrainly, TrainlyFileManager } from "@trainly/react";

export function CompleteFileExample() {
  const { getToken } = useAuth();
  const {
    ask,
    upload,
    listFiles,
    deleteFile,
    connectWithOAuthToken,
    isConnected,
  } = useTrainly();

  const [files, setFiles] = React.useState([]);
  const [storageUsed, setStorageUsed] = React.useState(0);

  // Connect to Trainly on mount
  React.useEffect(() => {
    async function connect() {
      const token = await getToken();
      if (token) {
        await connectWithOAuthToken(token);
      }
    }
    connect();
  }, []);

  // Load files when connected
  React.useEffect(() => {
    if (isConnected) {
      refreshFiles();
    }
  }, [isConnected]);

  const refreshFiles = async () => {
    try {
      const result = await listFiles();
      setFiles(result.files);
      setStorageUsed(result.total_size_bytes);
    } catch (error) {
      console.error("Failed to load files:", error);
    }
  };

  const handleBulkDelete = async () => {
    if (files.length === 0) {
      alert("No files to delete");
      return;
    }

    const confirmed = confirm(
      `Delete ALL ${files.length} files? This cannot be undone.`,
    );
    if (!confirmed) return;

    let deletedCount = 0;
    let totalFreed = 0;

    for (const file of files) {
      try {
        const result = await deleteFile(file.file_id);
        deletedCount++;
        totalFreed += result.size_bytes_freed;
        console.log(`Deleted: ${result.filename}`);
      } catch (error) {
        console.error(`Failed to delete ${file.filename}:`, error);
      }
    }

    alert(`Deleted ${deletedCount} files, freed ${formatBytes(totalFreed)}`);
    await refreshFiles();
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (!isConnected) {
    return <div>Connecting to Trainly...</div>;
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h1>📁 My File Workspace</h1>

      {/* Storage Overview */}
      <div
        style={{
          background: "#f8fafc",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h3>Storage Overview</h3>
        <p>
          <strong>{files.length} files</strong> using{" "}
          <strong>{formatBytes(storageUsed)}</strong>
        </p>
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button onClick={refreshFiles}>🔄 Refresh</button>
          <button
            onClick={handleBulkDelete}
            disabled={files.length === 0}
            style={{ background: "#dc2626", color: "white" }}
          >
            🗑️ Delete All Files
          </button>
        </div>
      </div>

      {/* File Manager Component */}
      <TrainlyFileManager
        onFileDeleted={(fileId, filename) => {
          console.log(`File deleted: ${filename}`);
          // Update local state
          setFiles((prev) => prev.filter((f) => f.file_id !== fileId));
          refreshFiles(); // Refresh to get accurate totals
        }}
        onError={(error) => {
          alert(`Error: ${error.message}`);
        }}
        showUploadButton={true}
        maxFileSize={5}
      />

      {/* AI Integration */}
      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          background: "#f0f9ff",
          borderRadius: "8px",
        }}
      >
        <h3>🤖 Ask AI About Your Files</h3>
        <button
          onClick={async () => {
            const answer = await ask(
              "What files do I have? Give me a summary of each.",
            );
            alert(`AI Response:\n\n${answer}`);
          }}
          style={{ background: "#059669", color: "white" }}
        >
          Get File Summary from AI
        </button>
      </div>
    </div>
  );
}
```

### **6. Error Handling Best Practices**

```tsx
import { useTrainly } from "@trainly/react";

function RobustFileManager() {
  const { deleteFile, listFiles } = useTrainly();

  const safeDeleteFile = async (fileId: string, filename: string) => {
    try {
      // 1. Confirm with user
      const confirmed = confirm(`Delete "${filename}"?`);
      if (!confirmed) return;

      // 2. Attempt deletion
      const result = await deleteFile(fileId);

      // 3. Success feedback
      console.log(`✅ Success: ${result.message}`);
      return result;
    } catch (error) {
      // 4. Handle specific error types
      if (error.message.includes("404")) {
        alert("File not found - it may have already been deleted");
      } else if (error.message.includes("401")) {
        alert("Authentication expired - please refresh the page");
      } else {
        alert(`Failed to delete file: ${error.message}`);
      }

      console.error("Delete error:", error);
      throw error;
    }
  };

  const safeListFiles = async () => {
    try {
      return await listFiles();
    } catch (error) {
      console.error("List files error:", error);

      if (error.message.includes("V1 mode")) {
        alert("File management requires V1 OAuth authentication");
      } else {
        alert(`Failed to load files: ${error.message}`);
      }

      return { success: false, files: [], total_files: 0, total_size_bytes: 0 };
    }
  };

  return (
    <div>
      <button onClick={() => safeListFiles()}>Safe List Files</button>
      <button onClick={() => safeDeleteFile("file_123", "example.pdf")}>
        Safe Delete Example
      </button>
    </div>
  );
}
```

### **7. TypeScript Support**

Full TypeScript definitions included:

```typescript
// Import types for better development experience
import type {
  FileInfo,
  FileListResult,
  FileDeleteResult,
  TrainlyFileManagerProps,
} from "@trainly/react";

// Type-safe file operations
const handleTypedFileOps = async () => {
  const fileList: FileListResult = await listFiles();
  const deleteResult: FileDeleteResult = await deleteFile("file_123");

  // Full IntelliSense support
  console.log(deleteResult.size_bytes_freed);
  console.log(fileList.total_size_bytes);
};
```

### **8. Security & Privacy Notes**

- 🔒 **V1 Only**: File management only works with V1 Trusted Issuer authentication
- 👤 **User Isolation**: Users can only see and delete their own files
- 🛡️ **No Raw Access**: Developers never see file content, only AI responses
- 📊 **Privacy-Safe Analytics**: Storage tracking without exposing user data
- ⚠️ **Permanent Deletion**: Deleted files cannot be recovered
- 🔐 **OAuth Required**: Must be authenticated with valid OAuth token

### **9. Storage Management**

File operations automatically update storage analytics:

```tsx
// Storage is tracked automatically
const result = await deleteFile(fileId);
console.log(`Freed ${result.size_bytes_freed} bytes`);

// Check total storage
const files = await listFiles();
console.log(`Using ${files.total_size_bytes} bytes total`);

// Parent app analytics are updated automatically
// (visible in Trainly dashboard for developers)
```

---

## 🚀 Original Quick Start (Legacy)

### 1. Install

```bash
npm install @trainly/react
```

### 2. Setup (2 lines)

```tsx
// app/layout.tsx
import { TrainlyProvider } from "@trainly/react";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <TrainlyProvider appSecret="as_your_app_secret">
          {children}
        </TrainlyProvider>
      </body>
    </html>
  );
}
```

### 3. Use anywhere (3 lines)

```tsx
// Any component
import { useTrainly } from "@trainly/react";

function MyComponent() {
  const { ask } = useTrainly();

  const handleClick = async () => {
    const answer = await ask("What is photosynthesis?");
    console.log(answer); // Ready to use!
  };

  return <button onClick={handleClick}>Ask AI</button>;
}
```

**That's it!** No auth setup, no API routes, no session management.

## 📦 What's Included

### Core Hook

```tsx
const {
  ask, // (question: string) => Promise<string>
  upload, // (file: File) => Promise<void>
  isLoading, // boolean
  isConnected, // boolean
  error, // string | null
} = useTrainly();
```

### Pre-built Components

```tsx
import { TrainlyChat, TrainlyUpload, TrainlyStatus } from '@trainly/react';

// Drop-in chat interface
<TrainlyChat height="400px" showCitations={true} />

// Drop-in file upload
<TrainlyUpload accept=".pdf,.doc,.txt" />

// Connection status indicator
<TrainlyStatus />
```

## 🎯 Complete Example

```tsx
import { TrainlyProvider, TrainlyChat, TrainlyUpload } from "@trainly/react";

function App() {
  return (
    <TrainlyProvider appSecret="as_demo_secret_123">
      <div>
        <h1>My Document Assistant</h1>

        {/* File upload area */}
        <TrainlyUpload onUpload={(files) => console.log("Uploaded:", files)} />

        {/* Chat interface */}
        <TrainlyChat
          height="500px"
          placeholder="Ask about your documents..."
          showCitations={true}
        />
      </div>
    </TrainlyProvider>
  );
}
```

## 🔧 Configuration Options

### Authentication Modes

```tsx
// Mode 1: V1 Trusted Issuer (NEW - recommended for OAuth apps)
<TrainlyProvider appId="app_v1_12345" /> // Register via console API first

// Mode 2: App Secret (legacy - for multi-user apps)
<TrainlyProvider appSecret="as_secret_123" />

// Mode 3: With user context (legacy)
<TrainlyProvider
  appSecret="as_secret_123"
  userId="user_123"
  userEmail="user@example.com"
/>

// Mode 4: Direct API key (legacy - simple apps)
<TrainlyProvider apiKey="tk_chat_id_key" />
```

### V1 OAuth Provider Examples

```tsx
// With Clerk
<TrainlyProvider
  appId="app_v1_clerk_123"
  baseUrl="https://api.trainly.com"
/>

// With Auth0
<TrainlyProvider
  appId="app_v1_auth0_456"
  baseUrl="https://api.trainly.com"
/>

// With AWS Cognito
<TrainlyProvider
  appId="app_v1_cognito_789"
  baseUrl="https://api.trainly.com"
/>
```

### Component Customization

```tsx
<TrainlyChat
  height="600px"
  theme="dark"
  placeholder="Ask me anything..."
  showCitations={true}
  enableFileUpload={true}
  onMessage={(msg) => console.log(msg)}
  onError={(err) => console.error(err)}
/>

<TrainlyUpload
  variant="drag-drop" // or "button" or "minimal"
  accept=".pdf,.doc,.txt"
  maxSize="10MB"
  multiple={false}
  onUpload={(files) => console.log(files)}
/>
```

## 🎨 Styling

Components use Tailwind classes by default but can be fully customized:

```tsx
<TrainlyChat
  className="my-custom-chat"
  height="400px"
/>

// Override with CSS
.my-custom-chat {
  border: 2px solid blue;
  border-radius: 12px;
}
```

## 📖 API Reference

### useTrainly()

The main hook for interacting with Trainly.

```tsx
const {
  // Core functions
  ask: (question: string) => Promise<string>,
  askWithCitations: (question: string) => Promise<{answer: string, citations: Citation[]}>,
  upload: (file: File) => Promise<UploadResult>,

  // NEW: V1 Authentication
  connectWithOAuthToken: (idToken: string) => Promise<void>,

  // State
  isLoading: boolean,
  isConnected: boolean,
  error: TrainlyError | null,

  // Advanced
  clearError: () => void,
  reconnect: () => Promise<void>,

  // For chat components
  messages: ChatMessage[],
  sendMessage: (content: string) => Promise<void>,
  clearMessages: () => void,
} = useTrainly();
```

### TrainlyProvider Props

```tsx
interface TrainlyProviderProps {
  children: React.ReactNode;
  appId?: string; // NEW: V1 app ID from console registration
  appSecret?: string; // Legacy: App secret from Trainly dashboard
  apiKey?: string; // Legacy: Direct API key (alternative to appSecret)
  baseUrl?: string; // Custom API URL (defaults to trainly.com)
  userId?: string; // Legacy: Your app's user ID
  userEmail?: string; // Legacy: Your app's user email
}
```

## 🔍 Examples

See complete implementation examples in the [API Documentation](https://trainly.com/docs/v1-authentication).

## 🆚 **V1 vs Legacy Comparison**

| Feature        | V1 Trusted Issuer                | Legacy App Secret         |
| -------------- | -------------------------------- | ------------------------- |
| **User Auth**  | Your OAuth provider              | Trainly OAuth flow        |
| **User Data**  | Permanent private subchat        | Temporary or shared       |
| **Privacy**    | Complete (dev can't see files)   | Limited                   |
| **Setup**      | Register once, use OAuth tokens  | Generate app secrets      |
| **Migration**  | Zero (uses existing OAuth)       | Requires auth integration |
| **Permanence** | Same user = same subchat forever | Depends on implementation |

**Recommendation**: Use V1 for new apps and consider migrating existing apps for better privacy and user experience.

## 🛠️ Development

```bash
# Clone the repo
git clone https://github.com/trainly/react-sdk.git
cd react-sdk

# Install dependencies
npm install

# Build the package
npm run build

# Watch mode for development
npm run dev
```

## 📝 License

MIT - see LICENSE file for details.

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md for guidelines.

## 🆘 Support

- 📖 [Documentation](https://trainly.com/docs/react-sdk)
- 💬 [Discord Community](https://discord.gg/trainly)
- 📧 [Email Support](mailto:support@trainly.com)
- 🐛 [Report Issues](https://github.com/trainly/react-sdk/issues)

---

**Made with ❤️ by the Trainly team**

_The simplest way to add AI to your React app_
