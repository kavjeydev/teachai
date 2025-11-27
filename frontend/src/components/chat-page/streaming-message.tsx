"use client";

import React, { useRef, useEffect } from "react";
import { Sparkles } from "lucide-react";

interface StreamingMessageProps {
  streamingContent: string;
  isStreaming: boolean;
  copyToClipboard: (text: string, messageType: string) => Promise<void>;
}

export function StreamingMessage({
  streamingContent,
  isStreaming,
  copyToClipboard,
}: StreamingMessageProps) {
  const streamingRef = useRef<HTMLDivElement>(null);
  const streamingMessageRef = useRef<HTMLDivElement>(null);

  // Auto-scroll during streaming
  useEffect(() => {
    if (isStreaming && streamingContent && streamingContent.length % 15 === 0) {
      streamingRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamingContent, isStreaming]);

  if (!isStreaming && !streamingContent) return null;

  return (
    <div
      ref={streamingMessageRef}
      key={`streaming-${streamingContent.length}`}
      className="mb-8 animate-in slide-in-from-left-2 duration-500"
    >
      <div className="flex gap-4 mb-6 group">
        {/* Enhanced AI Avatar matching the response design */}
        <div className="relative flex-shrink-0 mt-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-2 ring-white/10">
            <div className="w-5 h-5 bg-white/90 rounded-md flex items-center justify-center">
              {streamingContent ? (
                <Sparkles className="w-3 h-3 text-blue-600 animate-pulse" />
              ) : (
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              )}
            </div>
          </div>
          {/* Animated glow effect for streaming */}
          <div className="absolute inset-0 w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 opacity-30 blur-md -z-10 animate-pulse"></div>
        </div>

        <div className="flex flex-col max-w-[85%] min-w-0">
          {/* Enhanced copy indicator for streaming content */}
          {streamingContent && (
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 text-xs font-medium text-blue-600/70 dark:text-blue-400/70 mb-2 flex items-center gap-1.5 pointer-events-none">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Click to copy response
            </div>
          )}

          {/* Modern streaming bubble with enhanced styling */}
          <div
            ref={streamingRef}
            className={`relative bg-gradient-to-br from-white via-zinc-50/50 to-blue-50/30 dark:from-zinc-800/90 dark:via-zinc-800/70 dark:to-zinc-900/90 rounded-2xl px-6 py-5 shadow-lg shadow-zinc-200/60 dark:shadow-zinc-900/60 border border-zinc-200/60 dark:border-zinc-700/50 selectable backdrop-blur-sm group/bubble overflow-hidden ${
              streamingContent
                ? "cursor-pointer hover:shadow-xl hover:shadow-zinc-200/80 dark:hover:shadow-zinc-900/80 transition-all duration-300 hover:scale-[1.01]"
                : ""
            }`}
            onClick={() =>
              streamingContent &&
              copyToClipboard(streamingContent, "Response")
            }
            title={streamingContent ? "Click to copy response" : undefined}
          >
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/20 to-transparent dark:via-blue-900/10 opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-500"></div>

            {/* Content */}
            <div className="relative z-10">
              {streamingContent ? (
                <div className="whitespace-pre-wrap text-zinc-900 dark:text-zinc-100 text-sm leading-relaxed font-medium">
                  {streamingContent}
                  {/* Enhanced blinking cursor */}
                  <span className="inline-block w-1 h-5 bg-gradient-to-t from-blue-500 to-purple-500 ml-1 animate-pulse rounded-sm"></span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {/* Enhanced thinking animation */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.15s" }}
                    ></div>
                    <div
                      className="w-2.5 h-2.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.3s" }}
                    ></div>
                  </div>
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium text-sm">
                    AI is thinking...
                  </span>
                </div>
              )}
            </div>

            {/* Animated bottom accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/30 via-purple-500/40 to-indigo-500/30 animate-pulse"></div>
          </div>

          {/* Streaming status indicator */}
          <div className="flex items-center gap-2 mt-2 text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            </div>
            <span>
              {streamingContent
                ? "Streaming response..."
                : "Preparing response..."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

