"use client";

import React from "react";
import { PlusCircle } from "lucide-react";

interface CreateChatCardProps {
  onClick: () => void;
}

export function CreateChatCard({ onClick }: CreateChatCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-white dark:bg-zinc-900 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all duration-200 p-6 flex flex-col items-center justify-center min-h-[200px] hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
    >
      <PlusCircle className="w-6 h-6 text-zinc-600 dark:text-zinc-400 mb-4" />
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Create chat
      </span>
    </button>
  );
}

