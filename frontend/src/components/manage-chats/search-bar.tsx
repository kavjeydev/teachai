"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({
  searchQuery,
  onSearchChange,
  placeholder = "Search chats...",
}: SearchBarProps) {
  return (
    <div className="relative mb-6 max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
      <Input
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:border-zinc-400 dark:focus:border-zinc-500"
      />
    </div>
  );
}

