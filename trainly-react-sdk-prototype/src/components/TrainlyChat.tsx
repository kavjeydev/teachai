"use client";

import * as React from "react";
import { useTrainly } from "../useTrainly";

export interface TrainlyChatProps {
  height?: string;
  className?: string;
  placeholder?: string;
  showCitations?: boolean;
  enableFileUpload?: boolean;
  theme?: "light" | "dark" | "auto";
  scopeFilters?: Record<string, string | number | boolean>; // NEW: Filter queries by scope
  onMessage?: (message: {
    role: "user" | "assistant";
    content: string;
  }) => void;
  onError?: (error: string) => void;
}

export function TrainlyChat({
  height = "400px",
  className = "",
  placeholder = "Ask me anything...",
  showCitations = true,
  enableFileUpload = true,
  theme = "auto",
  scopeFilters,
  onMessage,
  onError,
}: TrainlyChatProps) {
  const { ask } = useTrainly();
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<
    Array<{
      id: string;
      role: "user" | "assistant";
      content: string;
      citations?: Array<{ source: string; snippet: string; score?: number }>;
    }>
  >([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<{ message: string } | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle errors
  React.useEffect(() => {
    if (error && onError) {
      onError(error.message);
    }
  }, [error, onError]);

  const clearError = () => setError(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const messageContent = input.trim();
    setInput("");
    setError(null);

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: messageContent,
    };
    setMessages((prev) => [...prev, userMessage]);
    onMessage?.(userMessage);

    setIsLoading(true);
    try {
      // Query with scope filters if provided
      const response = await ask(messageContent, {
        includeCitations: showCitations,
        scope_filters: scopeFilters,
      });

      // Add assistant response
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: response.answer,
        citations: response.citations,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      onMessage?.(assistantMessage);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to send message";
      setError({ message: errorMsg });
      console.error("Failed to send message:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // This would trigger upload and add a system message
      // File selected for upload
    }
  };

  const baseClasses = `
    flex flex-col border border-gray-200 rounded-lg overflow-hidden
    ${theme === "dark" ? "bg-gray-900 text-white border-gray-700" : "bg-white text-gray-900"}
    ${className}
  `;

  return (
    <div className={baseClasses} style={{ height }}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p>Start a conversation by asking a question!</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`
                max-w-[80%] p-3 rounded-lg
                ${
                  message.role === "user"
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-900 rounded-bl-none"
                }
              `}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>

              {/* Citations */}
              {showCitations &&
                message.citations &&
                message.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <p className="text-xs font-semibold mb-2">Sources:</p>
                    {message.citations.map((citation, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-white bg-opacity-20 p-2 rounded mb-1"
                      >
                        <p className="font-medium">{citation.source}</p>
                        <p className="opacity-75">"{citation.snippet}"</p>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 p-3 rounded-lg rounded-bl-none">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-red-700 text-sm">
          <div className="flex justify-between items-center">
            <span>{error.message}</span>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          {enableFileUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg"
                title="Upload file"
              >
                📎
              </button>
            </>
          )}

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
