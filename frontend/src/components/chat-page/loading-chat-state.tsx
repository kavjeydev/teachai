"use client";

import React from "react";

export function LoadingChatState() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400 animate-pulse">
          Loading your chat...
        </p>
      </div>
    </div>
  );
}

