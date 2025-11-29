"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

interface Folder {
  _id: Id<"folders">;
  name: string;
}

interface DeleteFolderModalProps {
  isOpen: boolean;
  folderToDelete: string | null;
  folderChatCount: number;
  folders: Folder[] | undefined;
  onDelete: (folderId: string, deleteChats: boolean) => void;
  onClose: () => void;
}

export function DeleteFolderModal({
  isOpen,
  folderToDelete,
  folderChatCount,
  folders,
  onDelete,
  onClose,
}: DeleteFolderModalProps) {
  if (!isOpen || !folderToDelete) return null;

  const folder = folders?.find((f) => f._id === folderToDelete);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Trash className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Delete Folder
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {folder?.name}
              </p>
            </div>
          </div>

          {folderChatCount > 0 ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-amber-500 text-xs font-bold flex-shrink-0 mt-0.5">
                  !
                </span>
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                    This folder contains {folderChatCount} chat
                    {folderChatCount !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    What would you like to do with the chats in this folder?
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              This folder is empty and can be safely deleted.
            </p>
          )}

          <div className="flex flex-col gap-3">
            {folderChatCount > 0 && (
              <Button
                onClick={() => onDelete(folderToDelete, true)}
                className="bg-red-500 hover:bg-red-600 text-white w-full"
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete Folder & All Chats ({folderChatCount})
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onDelete(folderToDelete, false)}
              className="w-full"
            >
              {folderChatCount > 0
                ? "Delete Folder Only (Move Chats to Uncategorized)"
                : "Delete Empty Folder"}
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

