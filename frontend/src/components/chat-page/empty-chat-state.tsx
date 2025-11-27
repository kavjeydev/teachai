"use client";

import React from "react";

export function EmptyChatState() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-400/20">
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <h3 className="text-2xl font-sans font-normal text-zinc-900 dark:text-white mb-3">
        Start Your GraphRAG Chat
      </h3>
      <p className="text-base text-zinc-600 dark:text-zinc-400 mb-6 max-w-md mx-auto leading-relaxed font-sans">
        Upload documents and ask questions to build your knowledge graph. Watch
        as relationships form and your AI becomes more intelligent.
      </p>
    </div>
  );
}

