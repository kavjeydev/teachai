"use client";

import * as React from "react";
import {
  TrainlyConfig,
  TrainlyContextValue,
  ChatMessage,
  Citation,
  UploadResult,
  TrainlyError,
} from "./types";
import { TrainlyClient } from "./api/TrainlyClient";

const TrainlyContext = React.createContext<TrainlyContextValue | undefined>(
  undefined,
);

export interface TrainlyProviderProps {
  children: React.ReactNode;
  appSecret?: string;
  apiKey?: string;
  appId?: string; // NEW: For V1 Trusted Issuer authentication
  baseUrl?: string;
  userId?: string;
  userEmail?: string;
  // NEW: Optional token refresh function for OAuth providers
  getToken?: () => Promise<string | null>;
}

export function TrainlyProvider({
  children,
  appSecret,
  apiKey,
  appId, // NEW: For V1 authentication
  baseUrl = "http://localhost:8000",
  userId,
  userEmail,
  getToken, // NEW: Token refresh function
}: TrainlyProviderProps) {
  const [client] = React.useState(
    () =>
      new TrainlyClient({
        appSecret,
        apiKey,
        appId, // NEW: Pass appId to client
        baseUrl,
        userId,
        userEmail,
      }),
  );

  const [isLoading, setIsLoading] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);
  const [error, setError] = React.useState<TrainlyError | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [currentToken, setCurrentToken] = React.useState<string | null>(null);
  const refreshIntervalRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Auto-connect on mount (only for non-OAuth modes)
  React.useEffect(() => {
    if (!appId && !getToken) {
      connect();
    }
  }, []);

  // NEW: Automatic OAuth state management
  React.useEffect(() => {
    if (!getToken || !appId) return;

    const manageOAuthConnection = async () => {
      try {
        const token = await getToken();

        if (token && token !== currentToken) {
          // User is signed in and we have a new/different token
          if (!isConnected || token !== currentToken) {
            console.log(
              "🔐 New OAuth session detected, connecting to Trainly...",
            );
            await connectWithOAuthToken(token);
          }
        } else if (!token && isConnected) {
          // User signed out, disconnect from Trainly
          console.log("🚪 User signed out, disconnecting from Trainly...");
          clearRefreshInterval();
          setIsConnected(false);
          setCurrentToken(null);
          setError(null);
        }
      } catch (error) {
        console.error("OAuth state management error:", error);
      }
    };

    // Check OAuth state immediately
    manageOAuthConnection();

    // Set up periodic OAuth state checking (every 10 seconds)
    const stateCheckInterval = setInterval(manageOAuthConnection, 10000);

    return () => {
      clearInterval(stateCheckInterval);
    };
  }, [getToken, appId, currentToken, isConnected]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      clearRefreshInterval();
    };
  }, []);

  const connect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await client.connect();
      setIsConnected(true);
    } catch (err) {
      setError({
        code: "CONNECTION_FAILED",
        message: "Failed to connect to Trainly",
        details: err,
      });
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear any existing refresh interval
  const clearRefreshInterval = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  };

  // Set up automatic token refresh
  const setupTokenRefresh = (token: string) => {
    if (!getToken || !appId) return;

    // Clear any existing interval
    clearRefreshInterval();

    // Decode token to get expiration (without verification)
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = exp - now;

      // Refresh 30 seconds before expiry (or immediately if already expired)
      const refreshIn = Math.max(timeUntilExpiry - 30000, 1000);

      console.log(
        `🔄 Token refresh scheduled in ${Math.round(refreshIn / 1000)} seconds`,
      );

      refreshIntervalRef.current = setTimeout(async () => {
        try {
          console.log("🔄 Auto-refreshing token...");
          const newToken = await getToken();
          if (newToken && newToken !== currentToken) {
            await client.connectWithOAuthToken(newToken);
            setCurrentToken(newToken);
            setupTokenRefresh(newToken); // Schedule next refresh
            console.log("✅ Token auto-refreshed successfully");
          }
        } catch (error) {
          console.error("❌ Auto token refresh failed:", error);
          setIsConnected(false);
        }
      }, refreshIn);
    } catch (error) {
      console.warn("Could not decode token for refresh scheduling:", error);
    }
  };

  // NEW: V1 OAuth Token connection method with auto-refresh
  const connectWithOAuthToken = async (idToken: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await client.connectWithOAuthToken(idToken);
      setCurrentToken(idToken);
      setIsConnected(true);

      // Set up automatic token refresh
      setupTokenRefresh(idToken);
    } catch (err) {
      setError({
        code: "V1_CONNECTION_FAILED",
        message: "Failed to connect with OAuth token",
        details: err,
      });
      setIsConnected(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const ask = async (question: string): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await client.ask(question);
      return response.answer;
    } catch (err) {
      // Check if it's an authentication error and we have a token refresh function
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (
        getToken &&
        appId &&
        (errorMessage.includes("401") ||
          errorMessage.includes("authentication") ||
          errorMessage.includes("Unauthorized"))
      ) {
        try {
          console.log("🔄 Token expired, refreshing...");
          const newToken = await getToken();
          if (newToken) {
            await client.connectWithOAuthToken(newToken);
            // Retry the query with fresh token
            const response = await client.ask(question);
            console.log("✅ Query succeeded after token refresh");
            return response.answer;
          }
        } catch (refreshError) {
          console.error("❌ Token refresh failed:", refreshError);
        }
      }

      const error: TrainlyError = {
        code: "QUERY_FAILED",
        message: "Failed to get answer",
        details: err,
      };
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const askWithCitations = async (
    question: string,
  ): Promise<{ answer: string; citations: Citation[] }> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await client.ask(question, { includeCitations: true });
      return {
        answer: response.answer,
        citations: response.citations || [],
      };
    } catch (err) {
      const error: TrainlyError = {
        code: "QUERY_FAILED",
        message: "Failed to get answer with citations",
        details: err,
      };
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const upload = async (file: File): Promise<UploadResult> => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await client.upload(file);
      return result;
    } catch (err) {
      // Check if it's an authentication error and we have a token refresh function
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (
        getToken &&
        appId &&
        (errorMessage.includes("401") ||
          errorMessage.includes("authentication") ||
          errorMessage.includes("Unauthorized"))
      ) {
        try {
          console.log("🔄 Token expired during upload, refreshing...");
          const newToken = await getToken();
          if (newToken) {
            await client.connectWithOAuthToken(newToken);
            // Retry the upload with fresh token
            const result = await client.upload(file);
            console.log("✅ Upload succeeded after token refresh");
            return result;
          }
        } catch (refreshError) {
          console.error("❌ Token refresh failed:", refreshError);
        }
      }

      const error: TrainlyError = {
        code: "UPLOAD_FAILED",
        message: "Failed to upload file",
        details: err,
      };
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string): Promise<void> => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await askWithCitations(content);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.answer,
        timestamp: new Date(),
        citations: response.citations,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      // Error is already set by askWithCitations
      console.error("Failed to send message:", err);
    }
  };

  const clearError = () => setError(null);
  const reconnect = () => connect();
  const clearMessages = () => setMessages([]);

  const value: TrainlyContextValue = {
    ask,
    askWithCitations,
    upload,
    connectWithOAuthToken, // NEW: V1 OAuth connection method
    isLoading,
    isConnected,
    error,
    clearError,
    reconnect,
    messages,
    sendMessage,
    clearMessages,
  };

  return (
    <TrainlyContext.Provider value={value}>{children}</TrainlyContext.Provider>
  );
}

export function useTrainlyContext(): TrainlyContextValue {
  const context = React.useContext(TrainlyContext);
  if (context === undefined) {
    throw new Error("useTrainlyContext must be used within a TrainlyProvider");
  }
  return context;
}
