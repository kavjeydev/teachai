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
  baseUrl?: string;
  userId?: string;
  userEmail?: string;
}

export function TrainlyProvider({
  children,
  appSecret,
  apiKey,
  baseUrl = "http://localhost:8000",
  userId,
  userEmail,
}: TrainlyProviderProps) {
  const [client] = React.useState(
    () =>
      new TrainlyClient({
        appSecret,
        apiKey,
        baseUrl,
        userId,
        userEmail,
      }),
  );

  const [isLoading, setIsLoading] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);
  const [error, setError] = React.useState<TrainlyError | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);

  // Auto-connect on mount
  React.useEffect(() => {
    connect();
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

  const ask = async (question: string): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await client.ask(question);
      return response.answer;
    } catch (err) {
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
