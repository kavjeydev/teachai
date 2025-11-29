"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Id } from "../../../convex/_generated/dataModel";
import { Folder } from "lucide-react";

interface Folder {
  _id: Id<"folders">;
  name: string;
}

interface MoveToFolderModalProps {
  isOpen: boolean;
  chatToMove: string | null;
  folders: Folder[] | undefined;
  onMove: (chatId: Id<"chats">, folderId: string | undefined) => void;
  onClose: () => void;
}

export function MoveToFolderModal({
  isOpen,
  chatToMove,
  folders,
  onMove,
  onClose,
}: MoveToFolderModalProps) {
  if (!isOpen || !chatToMove) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
            Move Chat to Folder
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            <button
              onClick={() => {
                onMove(chatToMove as Id<"chats">, undefined);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-left"
            >
              <Folder className="h-4 w-4 text-zinc-500" />
              <span className="text-sm">Uncategorized</span>
            </button>
            {folders?.map((folder) => (
              <button
                key={folder._id}
                onClick={() => {
                  onMove(chatToMove as Id<"chats">, folder._id);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-left"
              >
                <Folder className="h-4 w-4 text-amber-500" />
                <span className="text-sm">{folder.name}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

