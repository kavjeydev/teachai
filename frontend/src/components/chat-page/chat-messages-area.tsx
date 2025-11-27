"use client";

import React, { useMemo } from "react";
import { MessageComponent } from "./message-component";
import { EmptyChatState } from "./empty-chat-state";
import { LoadingChatState } from "./loading-chat-state";
import { StreamingMessage } from "./streaming-message";
import dynamic from "next/dynamic";

const CreditWarning = dynamic(
  () =>
    import("@/components/credit-warning").then((mod) => ({
      default: mod.CreditWarning,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse h-8 bg-yellow-100 rounded" />
    ),
  },
);

interface ChatMessagesAreaProps {
  displayContent: any[];
  isLoadingInitialData: boolean;
  isStreaming: boolean;
  streamingContent: string;
  user: any;
  onCitationClick: (
    chunkIndex: number,
    context: any[],
    messageText?: string,
  ) => void;
  copyToClipboard: (text: string, messageType: string) => Promise<void>;
}

export function ChatMessagesArea({
  displayContent,
  isLoadingInitialData,
  isStreaming,
  streamingContent,
  user,
  onCitationClick,
  copyToClipboard,
}: ChatMessagesAreaProps) {
  // Virtualized chat content for better performance with many messages
  const memoizedChatContent = useMemo(() => {
    if (!displayContent || displayContent.length === 0) return null;

    return displayContent.map((msg: any, index: number) => (
      <MessageComponent
        key={`${index}-${msg.sender}-${msg._id || msg.text?.substring(0, 20)}`}
        msg={msg}
        index={index}
        user={user}
        onCitationClick={onCitationClick}
        copyToClipboard={copyToClipboard}
      />
    ));
  }, [displayContent, user?.imageUrl, onCitationClick, copyToClipboard]);

  return (
    <div className="flex-1 overflow-y-auto relative p-12 drop-shadow-lg">
      <div className="w-full h-full px-4 py-3 max-w-4xl mx-auto">
        {/* Credit Warning */}
        <CreditWarning />

        {/* Loading overlay for initial data */}
        {isLoadingInitialData && <LoadingChatState />}

        {/* Empty state */}
        {!isLoadingInitialData &&
          displayContent?.length === 0 &&
          !isStreaming && <EmptyChatState />}

        {/* Chat content - only show when not in initial loading */}
        {!isLoadingInitialData && memoizedChatContent}

        {/* Streaming message display */}
        {(isStreaming || streamingContent) && (
          <StreamingMessage
            streamingContent={streamingContent}
            isStreaming={isStreaming}
            copyToClipboard={copyToClipboard}
          />
        )}
      </div>
    </div>
  );
}

