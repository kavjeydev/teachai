"use client";

import React, { useRef } from "react";
import {
  Paperclip,
  FolderOpen,
  Send,
  Sparkles,
  Archive,
  FileText,
} from "lucide-react";
import dynamic from "next/dynamic";

const ContextFilesSection = dynamic(
  () =>
    import("@/app/(main)/components/context-files-section").then((mod) => ({
      default: mod.ContextFilesSection,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse h-16 bg-zinc-100 rounded-lg" />
    ),
  },
);

const ConditionalTipTapEditor = React.lazy(() =>
  import("@/components/tiptap-editor-wrapper").then((mod) => ({
    default: mod.TipTapEditorWrapper,
  })),
);

const ModelSelector = dynamic(
  () =>
    import("@/components/model-selector").then((mod) => ({
      default: mod.ModelSelector,
    })),
  {
    ssr: false,
  },
);

const ChatSettings = dynamic(
  () =>
    import("@/components/chat-settings").then((mod) => ({
      default: mod.ChatSettings,
    })),
  {
    ssr: false,
  },
);

const UnhingedModeToggle = dynamic(
  () =>
    import("@/components/unhinged-mode-toggle").then((mod) => ({
      default: mod.UnhingedModeToggle,
    })),
  {
    ssr: false,
  },
);

interface ChatInputAreaProps {
  sidebarActiveView: string;
  currentChat: any;
  displayChat: any;
  displayContext: any;
  effectiveChatId: string | null;
  editorRef: React.RefObject<{
    editor: any;
    getHTML: () => string;
    getText: () => string;
    focus: () => void;
    isEmpty: () => boolean;
  }>;
  input: string;
  setInput: (value: string) => void;
  handleSendMessage: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  folderInputRef: React.RefObject<HTMLInputElement>;
  fileKey: Date;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  triggerFileInput: () => void;
  triggerFolderInput: () => void;
  isStreaming: boolean;
  isProcessingMessage: boolean;
  showProgress: boolean;
  progress: number;
  progressText: string;
  fileQueue: any;
  setIsFileQueueSlideoutOpen: (open: boolean) => void;
  triggerGraphRefresh: () => void;
}

export function ChatInputArea({
  sidebarActiveView,
  currentChat,
  displayChat,
  displayContext,
  effectiveChatId,
  editorRef,
  input,
  setInput,
  handleSendMessage,
  fileInputRef,
  folderInputRef,
  fileKey,
  handleFileChange,
  triggerFileInput,
  triggerFolderInput,
  isStreaming,
  isProcessingMessage,
  showProgress,
  progress,
  progressText,
  fileQueue,
  setIsFileQueueSlideoutOpen,
  triggerGraphRefresh,
}: ChatInputAreaProps) {
  return (
    <div className="px-12 pb-8 pt-4 max-w-5xl mx-auto w-full">
      <div className="bg-gradient-to-br from-white via-white to-zinc-50 dark:from-zinc-800 dark:via-zinc-800 dark:to-zinc-900 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-700/50 shadow-2xl rounded-3xl overflow-hidden relative">
        {/* Archived Chat Overlay */}
        {currentChat?.isArchived && (
          <div className="absolute inset-0 bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-sm z-50 rounded-3xl flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center">
                <Archive className="w-8 h-8 text-zinc-500 dark:text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Chat Archived
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 max-w-md">
                This chat has been archived and is no longer accessible for new
                messages or file uploads.
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Restore this chat from the sidebar to continue using it.
              </p>
            </div>
          </div>
        )}

        {/* Context Files - Elegant Collapsible Design */}
        {displayChat?.context?.length ? (
          <ContextFilesSection
            context={displayChat.context}
            displayContext={displayContext}
            chatId={effectiveChatId}
            onContextDeleted={triggerGraphRefresh}
          />
        ) : null}

        {/* Enhanced Message Input */}
        <div className="p-4 relative">
          <div className="relative group">
            {/* Input Container */}
            <div
              className="relative bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-700 group-focus-within:border-amber-400/50 group-focus-within:shadow-lg group-focus-within:shadow-amber-400/10 transition-all duration-300 cursor-text"
              onClick={() => editorRef.current?.focus()}
            >
              {sidebarActiveView === "testing" ? (
                <React.Suspense
                  fallback={
                    <div className="min-h-[80px] bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-700 animate-pulse" />
                  }
                >
                  <ConditionalTipTapEditor
                    ref={editorRef}
                    value={input}
                    onChange={setInput}
                    onSend={handleSendMessage}
                    placeholder="Ask anything about your documents..."
                    className="text-zinc-900 dark:text-white text-sm p-3 min-h-[80px] max-h-[200px] overflow-y-auto focus:outline-none bg-transparent resize-none"
                  />
                </React.Suspense>
              ) : (
                <div className="min-h-[80px] bg-transparent p-3 text-zinc-900 dark:text-white text-sm">
                  {/* Fallback for non-testing views */}
                </div>
              )}

              {/* Enhanced Placeholder */}
              {editorRef.current?.isEmpty() && (
                <div className="absolute top-3 left-3 pointer-events-none">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Sparkles className="w-3.5 h-3.5 opacity-50" />
                    <span className="text-sm">
                      Ask anything about your documents...
                    </span>
                  </div>
                </div>
              )}

              {/* Hidden File Inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                multiple
                className="hidden"
                onChange={handleFileChange}
                key={fileKey.getTime()}
              />
              <input
                ref={folderInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                {...({ webkitdirectory: "" } as any)}
                className="hidden"
                onChange={handleFileChange}
                key={`folder-${fileKey.getTime()}`}
              />

              {/* Input Actions */}
              <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                {/* Model Selector */}
                <ModelSelector
                  chatId={effectiveChatId}
                  currentModel={displayChat?.selectedModel}
                  onModelChange={() => {}}
                  compact={true}
                  unhingedMode={displayChat?.unhingedMode}
                />

                {/* Chat Settings Button */}
                <ChatSettings
                  chatId={effectiveChatId}
                  currentPrompt={displayChat?.customPrompt}
                  currentTemperature={displayChat?.temperature}
                  currentMaxTokens={displayChat?.maxTokens}
                  currentConversationHistoryLimit={
                    displayChat?.conversationHistoryLimit
                  }
                  onSettingsChange={() => {}}
                  unhingedMode={displayChat?.unhingedMode}
                />

                {/* Unhinged Mode Toggle */}
                <UnhingedModeToggle
                  chatId={effectiveChatId}
                  currentUnhingedMode={displayChat?.unhingedMode}
                  compact={true}
                />

                {/* File Queue Status Button */}
                {(fileQueue.activeQueues.length > 0 ||
                  fileQueue.allQueues.length > 0) && (
                  <button
                    onClick={() => setIsFileQueueSlideoutOpen(true)}
                    className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors group/queue relative"
                    title={
                      fileQueue.isProcessing
                        ? `Processing ${fileQueue.activeQueues.length} file queue${fileQueue.activeQueues.length > 1 ? "s" : ""}`
                        : `View file upload history (${fileQueue.allQueues.length} queue${fileQueue.allQueues.length > 1 ? "s" : ""})`
                    }
                  >
                    {fileQueue.isProcessing ? (
                      <div className="w-3.5 h-3.5 border border-blue-400/50 border-t-blue-400 rounded-full animate-spin" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-zinc-400 group-hover/queue:text-blue-400 transition-colors" />
                    )}
                    {fileQueue.activeQueues.length > 0 ? (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                        {fileQueue.activeQueues.length > 9
                          ? "9+"
                          : fileQueue.activeQueues.length}
                      </div>
                    ) : fileQueue.allQueues.length > 0 ? (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                    ) : null}
                  </button>
                )}

                {/* File Upload Button */}
                <button
                  onClick={triggerFileInput}
                  disabled={isStreaming}
                  className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors group/upload"
                  title="Upload documents"
                >
                  <Paperclip className="w-3.5 h-3.5 text-zinc-400 group-hover/upload:text-amber-400 transition-colors" />
                </button>

                {/* Folder Upload Button */}
                <button
                  onClick={triggerFolderInput}
                  disabled={isStreaming}
                  className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors group/folder"
                  title="Upload folder"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-zinc-400 group-hover/folder:text-amber-400 transition-colors" />
                </button>

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={
                    !editorRef.current?.getText()?.trim() ||
                    isStreaming ||
                    isProcessingMessage
                  }
                  className="bg-amber-400 hover:bg-amber-400/90 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white p-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-amber-400/25 disabled:shadow-none"
                >
                  {isStreaming || isProcessingMessage ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Progress Indicator */}
            {showProgress && (
              <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-5 h-5 bg-amber-400/10 rounded-md flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-amber-400 animate-pulse" />
                  </div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {progressText}
                  </span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-amber-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span>Press</span>
                <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-800 rounded text-xs font-mono">
                  Enter
                </kbd>
                <span>to send,</span>
                <kbd className="px-2 py-1 bg-zinc-200 dark:bg-zinc-800 rounded text-xs font-mono">
                  Shift+Enter
                </kbd>
                <span>for new line</span>
              </div>
              <div className="text-xs text-zinc-400">
                <span>Supports PDF, DOC, TXT files</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

