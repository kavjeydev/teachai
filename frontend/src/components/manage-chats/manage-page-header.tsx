"use client";

import React from "react";

interface ManagePageHeaderProps {
  organizationName?: string;
}

export function ManagePageHeader({
  organizationName,
}: ManagePageHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">
        Chats
      </h1>
      {organizationName && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {organizationName}
        </p>
      )}
    </div>
  );
}

