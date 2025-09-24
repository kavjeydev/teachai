"use client";

import React from "react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import dynamic from "next/dynamic";

// EXTREME: Load the entire heavy dashboard lazily to reduce initial bundle
const HeavyDashboard = dynamic(() => import("./heavy-dashboard"), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex">
      {/* Sidebar Loading */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>

      {/* Main Chat Loading */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-800 p-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
        </div>

        <div className="flex-1 p-6 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="flex justify-end">
                <div className="h-16 w-64 bg-blue-100 rounded-2xl animate-pulse"></div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
        </div>
      </div>
    </div>
  )
});

interface ChatIdPageProps {
  params: Promise<{
    chatId: Id<"chats">;
  }>;
}

// MINIMAL shell - loads instantly with ~50 modules instead of 5000+
export default function Dashboard({ params }: ChatIdPageProps) {
  return <HeavyDashboard params={params} />;
}
