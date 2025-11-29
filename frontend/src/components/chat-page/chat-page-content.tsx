"use client";

import React, { Suspense } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { ChatMessagesArea } from "./chat-messages-area";
import { ChatInputArea } from "./chat-input-area";
import { ChatSkeleton } from "./chat-skeleton";
import { ApiKeysView } from "./api-keys-view";
import { CustomSettingsView } from "./custom-settings-view";
import { UsageView } from "./usage-view";

interface ChatPageContentProps {
  sidebarActiveView: string;
  showSkeleton: boolean;
  isOnChatRoute: boolean;
  effectiveChatId: Id<"chats"> | null;
  currentChat: any;
  displayChat: any;
  displayContent: any[];
  isLoadingInitialData: boolean;
  isStreaming: boolean;
  streamingContent: string;
  user: any;
  displayContext: any;
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
  isProcessingMessage: boolean;
  showProgress: boolean;
  progress: number;
  progressText: string;
  fileQueue: any;
  setIsFileQueueSlideoutOpen: (open: boolean) => void;
  triggerGraphRefresh: () => void;
  onCitationClick: (
    chunkIndex: number,
    context: any[],
    messageText?: string,
  ) => void;
  copyToClipboard: (text: string, messageType: string) => Promise<void>;
  chatAnalytics: any;
  subscription: any;
  credits: any;
  scrollToBottom: React.RefObject<HTMLDivElement>;
}

export function ChatPageContent({
  sidebarActiveView,
  showSkeleton,
  isOnChatRoute,
  effectiveChatId,
  currentChat,
  displayChat,
  displayContent,
  isLoadingInitialData,
  isStreaming,
  streamingContent,
  user,
  displayContext,
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
  isProcessingMessage,
  showProgress,
  progress,
  progressText,
  fileQueue,
  setIsFileQueueSlideoutOpen,
  triggerGraphRefresh,
  onCitationClick,
  copyToClipboard,
  chatAnalytics,
  subscription,
  credits,
  scrollToBottom,
}: ChatPageContentProps) {
  if (showSkeleton && isOnChatRoute) {
    return <ChatSkeleton />;
  }

  if (sidebarActiveView === "api-keys") {
    return (
      <ApiKeysView
        effectiveChatId={effectiveChatId}
        currentChat={currentChat}
        showSkeleton={showSkeleton}
      />
    );
  }

  if (sidebarActiveView === "custom-settings") {
    return (
      <CustomSettingsView
        effectiveChatId={effectiveChatId}
        showSkeleton={showSkeleton}
      />
    );
  }

  if (sidebarActiveView === "usage") {
    return (
      <UsageView
        chatAnalytics={chatAnalytics}
        subscription={subscription}
        credits={credits}
      />
    );
  }

  // Default: Testing/Chat view
  return (
    <>
      <Suspense fallback={<ChatSkeleton />}>
        <ChatMessagesArea
          displayContent={displayContent}
          isLoadingInitialData={isLoadingInitialData}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          user={user}
          onCitationClick={onCitationClick}
          copyToClipboard={copyToClipboard}
        />
      </Suspense>

      <Suspense fallback={null}>
        <ChatInputArea
          sidebarActiveView={sidebarActiveView}
          currentChat={currentChat}
          displayChat={displayChat}
          displayContext={displayContext}
          effectiveChatId={effectiveChatId}
          editorRef={editorRef}
          input={input}
          setInput={setInput}
          handleSendMessage={handleSendMessage}
          fileInputRef={fileInputRef}
          folderInputRef={folderInputRef}
          fileKey={fileKey}
          handleFileChange={handleFileChange}
          triggerFileInput={triggerFileInput}
          triggerFolderInput={triggerFolderInput}
          isStreaming={isStreaming}
          isProcessingMessage={isProcessingMessage}
          showProgress={showProgress}
          progress={progress}
          progressText={progressText}
          fileQueue={fileQueue}
          setIsFileQueueSlideoutOpen={setIsFileQueueSlideoutOpen}
          triggerGraphRefresh={triggerGraphRefresh}
        />
      </Suspense>

      <div ref={scrollToBottom} />
    </>
  );
}

