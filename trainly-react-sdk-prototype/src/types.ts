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

export interface TrainlyError {
  code: string;
  message: string;
  details?: any;
}

export interface TrainlyContextValue {
  // Core functions
  ask: (question: string) => Promise<string>;
  askWithCitations: (
    question: string,
  ) => Promise<{ answer: string; citations: Citation[] }>;
  upload: (file: File) => Promise<UploadResult>;

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
