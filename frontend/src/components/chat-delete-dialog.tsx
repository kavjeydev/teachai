"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Archive, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ChatDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  chatTitle: string;
  isPermanentDelete?: boolean;
  isLoading?: boolean;
  subchatCount?: number;
}

export function ChatDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  chatTitle,
  isPermanentDelete = false,
  isLoading = false,
  subchatCount = 0,
}: ChatDeleteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {isPermanentDelete ? (
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/20">
                <Archive className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            )}
            <DialogTitle>
              {isPermanentDelete ? "Permanently Delete Chat" : "Archive Chat"}
            </DialogTitle>
          </div>
          <DialogDescription className="space-y-3 pt-2">
            {isPermanentDelete ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      This action cannot be undone
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      This will permanently delete{" "}
                      <strong>"{chatTitle}"</strong> and all associated data
                      including:
                    </p>
                    <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside ml-2 space-y-1">
                      <li>All uploaded files and documents</li>
                      <li>Complete chat history and messages</li>
                      <li>
                        All AI-generated embeddings and knowledge graph data
                      </li>
                      {subchatCount > 0 && (
                        <li>
                          <strong>{subchatCount}</strong> related subchat
                          {subchatCount !== 1 ? "s" : ""} and their data
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  All data will be removed from our servers and cannot be
                  recovered.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Are you sure you want to archive{" "}
                  <strong>"{chatTitle}"</strong>?
                </p>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Archived chats can be restored later from the archived
                    section. No data will be permanently lost.
                  </p>
                </div>
                {subchatCount > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {subchatCount} subchat{subchatCount !== 1 ? "s" : ""} will
                      also be archived
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={isPermanentDelete ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isLoading}
            className={
              !isPermanentDelete
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : ""
            }
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
                {isPermanentDelete ? "Deleting..." : "Archiving..."}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {isPermanentDelete ? (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Permanently
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4" />
                    Archive Chat
                  </>
                )}
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
