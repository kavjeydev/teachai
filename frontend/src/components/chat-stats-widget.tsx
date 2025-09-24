"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Files,
  HardDrive,
  Activity,
  Shield,
  TrendingUp,
  Eye,
  Lock,
} from "lucide-react";

interface ChatStats {
  totalUsers: number;
  activeUsers: number;
  totalFiles: number;
  storageFormatted: string;
  totalQueries: number;
  successRate: number;
  lastActivityAt: number;
  privacyMode: string;
}

interface ChatStatsWidgetProps {
  stats: ChatStats;
  chatType: "user_direct" | "app_subchat";
  className?: string;
}

export function ChatStatsWidget({ stats, chatType, className = "" }: ChatStatsWidgetProps) {
  const isPrivacyFirst = stats.privacyMode === "privacy_first";
  const hasActivity = stats.lastActivityAt > Date.now() - (24 * 60 * 60 * 1000);

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Recent';
  };

  if (chatType === "app_subchat") {
    // For sub-chats, show minimal privacy-focused stats
    return (
      <Card className={`border-green-200 dark:border-green-800 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200 text-sm">
            <Shield className="w-4 h-4" />
            Private Sub-Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-green-700 dark:text-green-300">{stats.totalFiles}</div>
              <div className="text-xs text-green-600 dark:text-green-400">Private Files</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{stats.totalQueries}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">AI Queries</div>
            </div>
          </div>
          <div className="mt-3 text-center">
            <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
              🔒 Complete Isolation
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // For main app chats, show comprehensive analytics
  return (
    <Card className={`shadow-lg border border-zinc-200 dark:border-zinc-800 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
            <Activity className="w-5 h-5" />
            App Analytics
          </CardTitle>
          <div className="flex items-center gap-2">
            {isPrivacyFirst ? (
              <Badge className="bg-green-600 text-white shadow-lg">
                <Shield className="w-3 h-3 mr-1" />
                Privacy-First
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-600 text-amber-700">
                <Lock className="w-3 h-3 mr-1" />
                Legacy
              </Badge>
            )}
            {hasActivity && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Privacy-First Highlight */}
        {isPrivacyFirst && (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-green-600" />
              <div>
                <h4 className="font-semibold text-green-800 dark:text-green-200 text-sm">
                  Complete User Data Isolation
                </h4>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Users upload {stats.totalFiles} files to private sub-chats - you cannot access raw content
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-blue-800 dark:text-blue-200">{stats.totalUsers}</div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              {stats.activeUsers} active
            </div>
          </div>

          <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
            <Files className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-green-800 dark:text-green-200">{stats.totalFiles}</div>
            <div className="text-xs text-green-600 dark:text-green-400">
              Private files
            </div>
          </div>

          <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
            <HardDrive className="w-5 h-5 text-amber-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-amber-800 dark:text-amber-200">{stats.storageFormatted}</div>
            <div className="text-xs text-amber-600 dark:text-amber-400">
              Storage used
            </div>
          </div>

          <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
            <TrendingUp className="w-5 h-5 text-orange-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-orange-800 dark:text-orange-200">{stats.successRate}%</div>
            <div className="text-xs text-orange-600 dark:text-orange-400">
              Success rate
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-zinc-500" />
              <span className="text-zinc-600 dark:text-zinc-400">
                {stats.totalQueries} total queries
              </span>
            </div>
            <div className="text-zinc-500">
              {stats.lastActivityAt > 0 ? formatTimeAgo(stats.lastActivityAt) : 'No activity'}
            </div>
          </div>

          {isPrivacyFirst && (
            <div className="mt-3 flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
              <Eye className="w-3 h-3" />
              <span>You can see usage stats but never user files or content</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for sidebar or quick view
export function ChatStatsCompact({ stats, chatType }: ChatStatsWidgetProps) {
  const isPrivacyFirst = stats.privacyMode === "privacy_first";

  return (
    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Stats</span>
        </div>
        {isPrivacyFirst && (
          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
            <Shield className="w-2 h-2 mr-1" />
            Privacy
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-sm font-bold text-blue-700 dark:text-blue-300">{stats.totalUsers}</div>
          <div className="text-xs text-zinc-500">Users</div>
        </div>
        <div>
          <div className="text-sm font-bold text-green-700 dark:text-green-300">{stats.totalFiles}</div>
          <div className="text-xs text-zinc-500">Files</div>
        </div>
        <div>
          <div className="text-sm font-bold text-amber-700 dark:text-amber-300">{stats.storageFormatted}</div>
          <div className="text-xs text-zinc-500">Storage</div>
        </div>
      </div>

      {isPrivacyFirst && stats.totalFiles > 0 && (
        <div className="mt-2 text-xs text-green-700 dark:text-green-300 text-center">
          🔒 Files in private sub-chats (no raw access)
        </div>
      )}
    </div>
  );
}
