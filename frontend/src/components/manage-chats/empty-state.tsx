"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Search, PlusCircle } from "lucide-react";

interface EmptyStateProps {
  hasSearchQuery: boolean;
  onCreateClick: () => void;
  onClearSearch?: () => void;
}

export function EmptyState({
  hasSearchQuery,
  onCreateClick,
  onClearSearch,
}: EmptyStateProps) {
  if (hasSearchQuery) {
    return (
      <div className="col-span-full text-center py-16">
        <div className="mx-auto mb-6">
          <Search className="w-12 h-12 text-zinc-400 mx-auto" />
        </div>
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
          No chats found
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          Try adjusting your search terms
        </p>
        {onClearSearch && (
          <Button
            onClick={onClearSearch}
            variant="outline"
            className="border-zinc-300 dark:border-zinc-700"
          >
            Clear Search
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      <div className="mx-auto mb-6">
        <MessageSquare className="w-12 h-12 text-zinc-400 mx-auto" />
      </div>
      <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
        No chats yet
      </h3>
      <p className="text-zinc-600 dark:text-zinc-400 mb-6">
        Create your first chat to start building your knowledge graph
      </p>
      <Button
        onClick={onCreateClick}
        className="bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 shadow-lg hover:shadow-zinc-400/25 dark:hover:shadow-zinc-500/25 transition-all duration-200"
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        New Chat
      </Button>
    </div>
  );
}

