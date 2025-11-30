"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardDrive, Files, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StorageUsageIndicatorProps {
  className?: string;
  compact?: boolean;
}

export function StorageUsageIndicator({
  className = "",
  compact = false,
}: StorageUsageIndicatorProps) {
  // This query is reactive - it will automatically update when token_ingestion table changes
  // The backend calls addTokenIngestion mutation after file processing completes
  const storageStats = useQuery(api.fileStorage.getStorageStats);

  if (!storageStats) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-muted rounded w-full"></div>
      </div>
    );
  }

  const {
    currentKnowledgeUnits,
    maxKnowledgeUnits,
    fileCount,
    usagePercentage,
    tierName,
  } = storageStats;

  const isNearLimit = usagePercentage >= 80;
  const isOverLimit = usagePercentage >= 100;

  const formatKnowledgeUnits = (ku: number) => {
    if (ku >= 1000000) {
      return `${(ku / 1000000).toFixed(1)}M KU`;
    } else if (ku >= 1000) {
      return `${(ku / 1000).toFixed(1)}K KU`;
    }
    return `${ku} KU`;
  };

  const getProgressColor = () => {
    if (isOverLimit) return "bg-red-500";
    if (isNearLimit) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getTierBadgeColor = () => {
    switch (tierName) {
      case "pro":
        return "bg-blue-500";
      case "scale":
        return "bg-purple-500";
      case "enterprise":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg ${className}`}
      >
        <HardDrive className="w-3.5 h-3.5 text-blue-400" />
        <div className="flex items-center gap-0 min-w-0">
          <div className="flex-shrink-0">
            <Progress
              value={Math.min(usagePercentage, 100)}
              className="h-1.5"
              style={
                {
                  "--progress-background": isOverLimit
                    ? "#ef4444"
                    : isNearLimit
                      ? "#f59e0b"
                      : "#10b981",
                } as React.CSSProperties
              }
            />
          </div>
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
            {formatKnowledgeUnits(currentKnowledgeUnits)}
          </span>
        </div>
        {isNearLimit && (
          <AlertTriangle className="w-3 h-3 text-yellow-500 flex-shrink-0" />
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <div className="flex items-center space-x-2">
            <HardDrive className="h-4 w-4" />
            <span>Knowledge Units Usage</span>
          </div>
          <Badge
            variant="secondary"
            className={`text-xs text-white ${getTierBadgeColor()}`}
          >
            {tierName.charAt(0).toUpperCase() + tierName.slice(1)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Used</span>
            <span className="font-medium">
              {formatKnowledgeUnits(currentKnowledgeUnits)} of{" "}
              {formatKnowledgeUnits(maxKnowledgeUnits)}
            </span>
          </div>
          <Progress value={Math.min(usagePercentage, 100)} className="h-2" />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {usagePercentage.toFixed(1)}% used
            </span>
            {isNearLimit && (
              <div className="flex items-center space-x-1 text-xs text-yellow-600">
                <AlertTriangle className="h-3 w-3" />
                <span>Near limit</span>
              </div>
            )}
            {isOverLimit && (
              <div className="flex items-center space-x-1 text-xs text-red-600">
                <AlertTriangle className="h-3 w-3" />
                <span>Over limit</span>
              </div>
            )}
          </div>
        </div>

        {/* File Count */}
        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Files className="h-4 w-4" />
            <span>Files</span>
          </div>
          <span className="font-medium">{fileCount}</span>
        </div>

        {/* Warning Messages */}
        {isNearLimit && !isOverLimit && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <p className="text-xs text-yellow-800">
                You're approaching your monthly ingestion limit. Consider
                upgrading your plan to increase your Knowledge Units quota.
              </p>
            </div>
          </div>
        )}

        {isOverLimit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-xs text-red-800">
                You've exceeded your monthly ingestion limit. Please upgrade
                your plan to continue uploading files.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hook for checking upload limits before file upload
export function useUploadLimits() {
  return {
    checkLimits: async (fileSize: number, fileName: string) => {
      // This would be called from the upload component to check limits
      // The actual limit checking is done server-side in the fileQueue mutations
      return {
        canUpload: true, // Placeholder - real check happens server-side
        errors: {},
      };
    },
  };
}
