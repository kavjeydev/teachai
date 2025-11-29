"use client";

import React from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Globe,
  Archive,
  RotateCcw,
  Trash,
  Edit3,
} from "lucide-react";
import { startTransition } from "react";

interface ChatCardProps {
  chat: {
    _id: Id<"chats">;
    title: string;
    visibility: "public" | "private" | string;
    _creationTime: number;
    folderId?: string;
  };
  isArchived: boolean;
  editingChatId: Id<"chats"> | null;
  editingTitle: string;
  onEditTitle: (title: string) => void;
  onStartEditing: () => void;
  onFinishEditing: () => void;
  onCancelEditing: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onPermanentDelete: () => void;
  onNavigate: (chatId: Id<"chats">) => void;
}

export function ChatCard({
  chat,
  isArchived,
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
}: ChatCardProps) {
  const isEditing = editingChatId === chat._id;

  return (
    <div className="group relative bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 overflow-hidden">
      {/* Top indicator bar */}
      <div
        className={cn(
          "h-1 w-full",
          chat.visibility === "public"
            ? "bg-purple-500"
            : "bg-zinc-300 dark:bg-zinc-700",
        )}
      />

      <div className="p-5">
        {/* Header with icon and identifier */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {chat.visibility === "public" ? (
              <Globe className="w-5 h-5 text-purple-500 flex-shrink-0" />
            ) : (
              <MessageSquare className="w-5 h-5 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate font-mono">
                {chat._id.slice(-8)}
              </div>
            </div>
          </div>

          {/* Actions menu */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isArchived && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartEditing();
                  }}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Rename"
                >
                  <Edit3 className="w-3 h-3 text-zinc-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive();
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                  title="Archive"
                >
                  <Archive className="w-3 h-3 text-red-500" />
                </button>
              </>
            )}
            {isArchived && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore();
                  }}
                  className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors"
                  title="Restore"
                >
                  <RotateCcw className="w-3 h-3 text-green-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPermanentDelete();
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                  title="Delete"
                >
                  <Trash className="w-3 h-3 text-red-500" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Plan/Status badge */}
        <div className="mb-3">
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            {chat.visibility === "public" ? "Public" : "Private"}
          </span>
        </div>

        {/* Chat title */}
        <div
          className={cn(
            "mb-4",
            isArchived ? "cursor-default opacity-60" : "cursor-pointer",
          )}
          onClick={() => {
            if (!isArchived) {
              startTransition(() => {
                onNavigate(chat._id);
              });
            }
          }}
        >
          {isEditing ? (
            <Input
              value={editingTitle}
              onChange={(e) => onEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onFinishEditing();
                if (e.key === "Escape") onCancelEditing();
              }}
              onBlur={onFinishEditing}
              className="text-base font-semibold h-8"
              autoFocus
            />
          ) : (
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors line-clamp-2">
              {chat.title}
            </h3>
          )}
        </div>

        {/* Status badge */}
        <div>
          {isArchived ? (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
              Archived
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              Active
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

