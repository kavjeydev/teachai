// Core types for Trainly React SDK

export interface TrainlyConfig {
  appSecret?: string;
  apiKey?: string;
  appId?: string; // NEW: For V1 Trusted Issuer authentication
  baseUrl?: string;
  userId?: string;
  userEmail?: string;
}

export interface TrainlyProviderProps {
  children: React.ReactNode;
  appSecret?: string;
  apiKey?: string;
  appId?: string; // NEW: For V1 Trusted Issuer authentication
  baseUrl?: string;
  userId?: string;
  userEmail?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  citations?: Citation[];
}

export interface Citation {
  snippet: string;
  score: number;
  source: string;
  page?: number;
}

export interface UploadResult {
  success: boolean;
  filename: string;
  size: number;
  message?: string;
}

export interface TextContent {
  text: string;
  contentName: string;
}

export interface BulkUploadFileResult {
  filename: string;
  success: boolean;
  error: string | null;
  file_id: string | null;
  size_bytes: number;
  processing_status: string;
  message?: string;
}

export interface BulkUploadResult {
  success: boolean;
  total_files: number;
  successful_uploads: number;
  failed_uploads: number;
  total_size_bytes: number;
  chat_id: string;
  user_id: string;
  results: BulkUploadFileResult[];
  message: string;
}

export interface FileInfo {
  file_id: string;
  filename: string;
  upload_date: string;
  size_bytes: number;
  chunk_count: number;
}

export interface FileListResult {
  success: boolean;
  files: FileInfo[];
  total_files: number;
  total_size_bytes: number;
}

export interface FileDeleteResult {
  success: boolean;
  message: string;
  file_id: string;
  filename: string;
  chunks_deleted: number;
  size_bytes_freed: number;
}

export interface TrainlyError {
  code: string;
  message: string;
  details?: any;
}

export interface TrainlyFileManagerProps {
  className?: string;
  onFileDeleted?: (fileId: string, filename: string) => void;
  onError?: (error: Error) => void;
  showUploadButton?: boolean;
  maxFileSize?: number; // in MB
}

export interface TrainlyContextValue {
  // Core functions
  ask: (
    question: string,
    options?: {
      includeCitations?: boolean;
      scope_filters?: Record<string, string | number | boolean>;
    },
  ) => Promise<{ answer: string; citations?: Citation[] }>;
  askWithCitations: (
    question: string,
  ) => Promise<{ answer: string; citations: Citation[] }>; // Deprecated - use ask() with options
  upload: (
    file: File,
    scopeValues?: Record<string, string | number | boolean>,
  ) => Promise<UploadResult>;
  uploadText: (
    text: string,
    contentName: string,
    scopeValues?: Record<string, string | number | boolean>,
  ) => Promise<UploadResult>;

  // NEW: File management functions
  listFiles: () => Promise<FileListResult>;
  deleteFile: (fileId: string) => Promise<FileDeleteResult>;
  bulkUploadFiles: (
    files: File[],
    scopeValues?: Record<string, string | number | boolean>,
  ) => Promise<BulkUploadResult>;
  bulkUploadText: (
    textContents: TextContent[],
    scopeValues?: Record<string, string | number | boolean>,
  ) => Promise<BulkUploadResult>;

  // NEW: V1 Authentication
  connectWithOAuthToken: (idToken: string) => Promise<void>;

  // State
  isLoading: boolean;
  isConnected: boolean;
  error: TrainlyError | null;

  // Advanced
  clearError: () => void;
  reconnect: () => Promise<void>;

  // Messages (for chat components)
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}
