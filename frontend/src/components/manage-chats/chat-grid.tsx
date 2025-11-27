"use client";

import React from "react";
import { Id } from "../../../../convex/_generated/dataModel";
import { ChatCard } from "./chat-card";
import { CreateChatCard } from "./create-chat-card";
import { EmptyState } from "./empty-state";

interface Chat {
  _id: Id<"chats">;
  title: string;
  visibility: "public" | "private" | string;
  _creationTime: number;
  folderId?: string;
}

interface ChatGridProps {
  chats: Chat[];
  isArchived: boolean;
  searchQuery: string;
  editingChatId: Id<"chats"> | null;
  editingTitle: string;
  onEditTitle: (title: string) => void;
  onStartEditing: (chat: Chat) => void;
  onFinishEditing: (chatId: Id<"chats">) => void;
  onCancelEditing: () => void;
  onArchive: (chat: Chat) => void;
  onRestore: (chat: Chat) => void;
  onPermanentDelete: (chat: Chat) => void;
  onNavigate: (chatId: Id<"chats">) => void;
  onCreateClick: () => void;
  onClearSearch?: () => void;
}

export function ChatGrid({
  chats,
  isArchived,
  searchQuery,
  editingChatId,
  editingTitle,
  onEditTitle,
  onStartEditing,
  onFinishEditing,
  onCancelEditing,
  onArchive,
  onRestore,
  onPermanentDelete,
  onNavigate,
  onCreateClick,
  onClearSearch,
}: ChatGridProps) {
  if (chats.length === 0 && !searchQuery) {
    return <EmptyState hasSearchQuery={false} onCreateClick={onCreateClick} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {/* Create Chat Card */}
      {!isArchived && <CreateChatCard onClick={onCreateClick} />}

      {/* Chat Cards */}
      {chats.map((chat) => (
        <ChatCard
          key={chat._id}
          chat={chat}
          isArchived={isArchived}
          editingChatId={editingChatId}
          editingTitle={editingTitle}
          onEditTitle={onEditTitle}
          onStartEditing={() => onStartEditing(chat)}
          onFinishEditing={() => onFinishEditing(chat._id)}
          onCancelEditing={onCancelEditing}
          onArchive={() => onArchive(chat)}
          onRestore={() => onRestore(chat)}
          onPermanentDelete={() => onPermanentDelete(chat)}
          onNavigate={onNavigate}
        />
      ))}

      {/* No results for search */}
      {searchQuery && chats.length === 0 && (
        <EmptyState
          hasSearchQuery={true}
          onCreateClick={onCreateClick}
          onClearSearch={onClearSearch}
        />
      )}
    </div>
  );
}

