"use client";

import React, { useMemo } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { ChatGrid } from "./chat-grid";
import { SearchBar } from "./search-bar";
import { LoadingState } from "./loading-state";

interface Chat {
  _id: Id<"chats">;
  title: string;
  visibility: "public" | "private" | string;
  _creationTime: number;
  folderId?: string;
}

interface ChatsContentProps {
  chats: Chat[] | undefined;
  archivedChats: Chat[] | undefined;
  selectedFolder: string;
  searchQuery: string;
  sortBy: "date" | "name" | "activity" | "size";
  sortOrder: "asc" | "desc";
  editingChatId: Id<"chats"> | null;
  editingTitle: string;
  onSearchChange: (query: string) => void;
  onEditTitle: (title: string) => void;
  onStartEditing: (chat: Chat) => void;
  onFinishEditing: (chatId: Id<"chats">) => void;
  onCancelEditing: () => void;
  onArchive: (chat: Chat) => void;
  onRestore: (chat: Chat) => void;
  onPermanentDelete: (chat: Chat) => void;
  onNavigate: (chatId: Id<"chats">) => void;
  onCreateClick: () => void;
}

export function ChatsContent({
  chats,
  archivedChats,
  selectedFolder,
  searchQuery,
  sortBy,
  sortOrder,
  editingChatId,
  editingTitle,
  onSearchChange,
  onEditTitle,
  onStartEditing,
  onFinishEditing,
  onCancelEditing,
  onArchive,
  onRestore,
  onPermanentDelete,
  onNavigate,
  onCreateClick,
}: ChatsContentProps) {
  const isArchived = selectedFolder === "archived";

  // Filter and sort chats
  const filteredAndSortedChats = useMemo(() => {
    // Use archived chats if archived folder is selected, otherwise use regular chats
    const sourceChats = isArchived ? archivedChats || [] : chats || [];

    if (!sourceChats.length) return [];

    let filtered = sourceChats.filter((chat) => {
      const matchesSearch = chat.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      let matchesFolder = true;
      if (selectedFolder !== "all" && selectedFolder !== "archived") {
        switch (selectedFolder) {
          case "recent":
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            matchesFolder = new Date(chat._creationTime) > weekAgo;
            break;
          case "uncategorized":
            matchesFolder = !chat.folderId;
            break;
          default:
            // Handle custom user-created folders by checking folderId
            matchesFolder = chat.folderId === selectedFolder;
            break;
        }
      }

      return matchesSearch && matchesFolder;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.title.localeCompare(b.title);
          break;
        case "date":
          comparison =
            new Date(a._creationTime).getTime() -
            new Date(b._creationTime).getTime();
          break;
        case "activity":
          comparison =
            new Date(a._creationTime).getTime() -
            new Date(b._creationTime).getTime();
          break;
        case "size":
          // Size comparison would need context data if available
          comparison = 0;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [chats, archivedChats, searchQuery, sortBy, sortOrder, selectedFolder, isArchived]);

  // Show loading state if data is not yet available
  if (chats === undefined || (isArchived && archivedChats === undefined)) {
    return (
      <>
        <SearchBar searchQuery={searchQuery} onSearchChange={onSearchChange} />
        <LoadingState />
      </>
    );
  }

  return (
    <>
      {filteredAndSortedChats.length > 0 && (
        <SearchBar searchQuery={searchQuery} onSearchChange={onSearchChange} />
      )}
      <ChatGrid
        chats={filteredAndSortedChats}
        isArchived={isArchived}
        searchQuery={searchQuery}
        editingChatId={editingChatId}
        editingTitle={editingTitle}
        onEditTitle={onEditTitle}
        onStartEditing={onStartEditing}
        onFinishEditing={onFinishEditing}
        onCancelEditing={onCancelEditing}
        onArchive={onArchive}
        onRestore={onRestore}
        onPermanentDelete={onPermanentDelete}
        onNavigate={onNavigate}
        onCreateClick={onCreateClick}
        onClearSearch={() => onSearchChange("")}
      />
    </>
  );
}

