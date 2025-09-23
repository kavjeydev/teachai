"use client";

import React, { useState } from "react";
import { File, ChevronDown, ChevronUp } from "lucide-react";
import { ContextList } from "./context-list";
import { Id } from "../../../../convex/_generated/dataModel";

interface ContextFilesSectionProps {
  context: any[];
  displayContext: any;
  chatId: Id<"chats">;
  onContextDeleted: () => void;
}

export function ContextFilesSection({
  context,
  displayContext,
  chatId,
  onContextDeleted,
}: ContextFilesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxVisibleFiles = 3; // Show 3 files initially
  const hasMoreFiles = context.length > maxVisibleFiles;
  const visibleFiles = isExpanded ? context : context.slice(0, maxVisibleFiles);

  return (
    <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border-b border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-trainlymainlight/10 rounded-md flex items-center justify-center">
            <File className="h-2.5 w-2.5 text-trainlymainlight" />
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            Context Files ({context.length})
          </span>
        </div>
        <ContextList
          context={displayContext}
          chatId={chatId}
          onContextDeleted={onContextDeleted}
        />
      </div>

      {/* Files Grid - Elegant Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
        {visibleFiles.map((contextItem: any) => (
          <div
            key={contextItem.fileId}
            className="group flex items-center gap-3 rounded-lg p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-trainlymainlight/30 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <div className="h-8 w-8 bg-gradient-to-br from-trainlymainlight/20 to-purple-100 dark:from-trainlymainlight/20 dark:to-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
              <File className="h-4 w-4 text-trainlymainlight" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {contextItem.filename}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Context
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {hasMoreFiles && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-trainlymainlight hover:text-trainlymainlight/80 bg-trainlymainlight/5 hover:bg-trainlymainlight/10 rounded-lg transition-all duration-200 border border-trainlymainlight/20 hover:border-trainlymainlight/30"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Show {context.length - maxVisibleFiles} More
            </>
          )}
        </button>
      )}
    </div>
  );
}
