"use client";

import React from "react";
import { sanitizeHTML } from "@/lib/sanitization";
import { Sparkles } from "lucide-react";
import dynamic from "next/dynamic";

const CitationMarkdown = dynamic(
  () =>
    import("@/components/citation-markdown").then((mod) => ({
      default: mod.CitationMarkdown,
    })),
  {
    ssr: false,
  },
);

interface MessageComponentProps {
  msg: any;
  index: number;
  user: any;
  onCitationClick: (
    chunkIndex: number,
    context: any[],
    messageText?: string,
  ) => void;
  copyToClipboard: (text: string, messageType: string) => Promise<void>;
}

// Optimized message component with React.memo for performance
export const MessageComponent = React.memo<MessageComponentProps>(
  ({ msg, index, user, onCitationClick, copyToClipboard }) => {
    // Strip HTML tags to get plain text for copying
    const getPlainText = (htmlContent: string) => {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;
      return tempDiv.textContent || tempDiv.innerText || "";
    };

    return (
      <div className="mb-8">
        {msg.sender === "user" ? (
          // User message - enhanced with modern design to match AI responses
          <div className="flex justify-end gap-4 mb-8 group animate-in slide-in-from-right-2 duration-500">
            {/* Enhanced copy indicator */}
            <div className="flex flex-col items-end max-w-[75%] min-w-0">
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 text-xs font-medium text-amber-600/70 dark:text-amber-400/70 mb-2 flex items-center gap-1.5 pointer-events-none">
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
                Click to copy message
              </div>

              {/* Modern user message bubble */}
              <div
                className="relative bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-white rounded-2xl px-5 py-3.5 w-full shadow-xl shadow-amber-400/30 font-medium text-sm leading-relaxed selectable cursor-pointer hover:shadow-2xl hover:shadow-amber-400/40 transition-all duration-300 hover:scale-[1.02] group/bubble overflow-hidden"
                onClick={() =>
                  copyToClipboard(getPlainText(msg.text), "Message")
                }
                title="Click to copy message"
              >
                {/* Subtle shimmer overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-500"></div>

                {/* Content */}
                <div className="relative z-10">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHTML(msg.text),
                    }}
                  />
                </div>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-300/40 via-white/30 to-orange-300/40 opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* Message metadata */}
              <div className="flex items-center justify-end mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="flex items-center gap-2 text-xs text-amber-600/70 dark:text-amber-400/70">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                  <span>You</span>
                </div>
              </div>
            </div>

            {/* Enhanced user avatar */}
            {user?.imageUrl && (
              <div className="relative flex-shrink-0 mt-8">
                <img
                  src={user.imageUrl}
                  className="w-9 h-9 rounded-xl shadow-lg ring-2 ring-white/20 dark:ring-zinc-700/50 object-cover"
                  alt="User avatar"
                  loading="lazy"
                />
                {/* Subtle glow effect */}
                <div className="absolute inset-0 w-9 h-9 rounded-xl bg-amber-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm -z-10"></div>
              </div>
            )}
          </div>
        ) : (
          // AI response - modern, sleek design with enhanced visual appeal
          <div className="flex gap-4 mb-8 group animate-in slide-in-from-left-2 duration-500">
            {/* Enhanced AI Avatar with gradient background */}
            <div className="relative flex-shrink-0 mt-8">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-2 ring-white/10">
                <div className="w-5 h-5 bg-white/90 rounded-md flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                </div>
              </div>
              {/* Subtle glow effect */}
              <div className="absolute inset-0 w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 opacity-20 blur-md -z-10"></div>
            </div>

            <div className="flex flex-col max-w-[85%] min-w-0">
              {/* Enhanced copy indicator with better positioning */}
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

              {/* Modern response bubble with enhanced styling */}
              <div
                className="relative bg-gradient-to-br from-white via-zinc-50/50 to-blue-50/30 dark:from-zinc-800/90 dark:via-zinc-800/70 dark:to-zinc-900/90 rounded-2xl px-6 py-5 shadow-lg shadow-zinc-200/60 dark:shadow-zinc-900/60 border border-zinc-200/60 dark:border-zinc-700/50 selectable cursor-pointer hover:shadow-xl hover:shadow-zinc-200/80 dark:hover:shadow-zinc-900/80 transition-all duration-300 hover:scale-[1.01] backdrop-blur-sm group/bubble overflow-hidden"
                onClick={() =>
                  copyToClipboard(getPlainText(msg.text), "Response")
                }
                title="Click to copy response"
              >
                {/* Subtle animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/20 to-transparent dark:via-blue-900/10 opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-500"></div>

                {/* Content with enhanced typography */}
                <div className="relative z-10">
                  <CitationMarkdown
                    content={msg.text}
                    reasoningContext={msg.reasoningContext || []}
                    onCitationClick={(chunkIndex) => {
                      onCitationClick(
                        chunkIndex,
                        msg.reasoningContext || [],
                        msg.text,
                      );
                    }}
                  />
                </div>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/30 to-indigo-500/20 opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* Response metadata */}
              <div className="flex items-center justify-between mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <span>AI Response</span>
                </div>
                {msg.reasoningContext && msg.reasoningContext.length > 0 && (
                  <div className="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">
                    {msg.reasoningContext.length} source
                    {msg.reasoningContext.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

MessageComponent.displayName = "MessageComponent";

