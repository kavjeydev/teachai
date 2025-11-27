"use client";

import React from "react";
import { ChatCardSkeleton } from "./chat-card-skeleton";

interface LoadingStateProps {
  count?: number;
}

export function LoadingState({ count = 8 }: LoadingStateProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ChatCardSkeleton key={i} />
      ))}
    </div>
  );
}

