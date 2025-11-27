"use client";

import React, { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Shield,
  Users,
  Files,
  HardDrive,
  Activity,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

interface UsageViewProps {
  chatAnalytics: any;
  subscription: any;
  credits: any;
}

export function UsageView({ chatAnalytics, subscription, credits }: UsageViewProps) {
  return (
    <div className="flex-1 overflow-y-auto relative p-12">
      <div className="w-full h-full px-4 py-3 max-w-4xl mx-auto space-y-6">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
            Usage & Analytics
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Privacy-first analytics - you can see usage patterns but never raw
            user data
          </p>
        </div>

        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-64 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
              <Skeleton className="h-48 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
              <Skeleton className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
            </div>
          }
        >
          {/* Chat Analytics Section */}
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-zinc-900 dark:text-white">
                <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                  <BarChart3 className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
                </div>
                Chat Analytics & Insights
              </CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400">
                Privacy-first analytics - you can see usage patterns but never
                raw user data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Privacy-First Highlight */}
              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-900 dark:text-white text-sm">
                        🔒 Privacy-First Analytics
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Complete user data isolation - you cannot access raw
                        files or content
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-lg font-bold text-zinc-900 dark:text-white">
                      {chatAnalytics?.userStats?.totalUsers || 0}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      Total Users
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-zinc-900 dark:text-white">
                      {chatAnalytics?.fileStats?.totalFiles || 0}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      Files Uploaded
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {chatAnalytics?.apiStats?.totalQueries || 0}
                    </div>
                    <div className="text-xs text-amber-600 dark:text-amber-400">
                      API Queries
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-2">
                    <Users className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {chatAnalytics?.userStats?.totalUsers || 0}
                  </div>
                  <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Total Users
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                    Sub-chats under parent
                  </div>
                </div>

                <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-2">
                    <Files className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {chatAnalytics?.fileStats?.totalFiles || 0}
                  </div>
                  <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Files Uploaded
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                    Parent + all sub-chats
                  </div>
                </div>

                <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-2">
                    <Activity className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {chatAnalytics?.apiStats?.totalQueries || 0}
                  </div>
                  <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    API Queries
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                    {chatAnalytics?.apiStats?.queriesLast7Days || 0} last 7d
                  </div>
                </div>

                <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-2">
                    <HardDrive className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {chatAnalytics?.fileStats?.storageFormatted || "0 B"}
                  </div>
                  <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Storage Used
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                    Private & isolated
                  </div>
                </div>
              </div>

              {/* File Type Distribution */}
              <div className="mb-6">
                <h4 className="font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-3">
                  <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                    <HardDrive className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  File Type Breakdown
                </h4>
                {chatAnalytics?.fileStats?.fileTypeDistribution ? (
                  <div className="space-y-2">
                    {Object.entries(
                      chatAnalytics.fileStats.fileTypeDistribution,
                    ).map(([type, count]: [string, any]) => {
                      const totalFiles =
                        chatAnalytics.fileStats?.totalFiles || 0;
                      const percentage =
                        totalFiles > 0
                          ? Math.round((count / totalFiles) * 100)
                          : 0;
                      const colors = {
                        pdf: "bg-red-400",
                        docx: "bg-blue-400",
                        txt: "bg-green-400",
                        images: "bg-purple-400",
                        other: "bg-zinc-400",
                      };

                      if (count > 0) {
                        return (
                          <div
                            key={type}
                            className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-3 h-3 rounded-full ${colors[type as keyof typeof colors] || "bg-zinc-500"}`}
                              ></div>
                              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                                {type.toUpperCase()}
                              </span>
                              <span className="text-xs text-zinc-500">
                                {count} files
                              </span>
                            </div>
                            <div className="text-xs text-zinc-500">
                              {percentage}%
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    <Files className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No files uploaded yet</p>
                    <p className="text-xs">
                      File type distribution will appear here
                    </p>
                  </div>
                )}
              </div>

              {/* Top User Activity (Privacy-Safe) */}
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-3">
                  <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                    <Activity className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  Top Users (Privacy-Safe)
                </h4>
                {chatAnalytics?.userActivity &&
                chatAnalytics.userActivity.length > 0 ? (
                  <div className="space-y-2">
                    {chatAnalytics.userActivity
                      .sort((a: any, b: any) => b.queriesMade - a.queriesMade)
                      .slice(0, 3)
                      .map((user: any, index: number) => (
                        <div
                          key={user.userIdHash}
                          className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-700 dark:text-zinc-300 font-bold text-xs">
                              #{index + 1}
                            </div>
                            <div>
                              <div className="font-medium text-sm text-zinc-900 dark:text-white">
                                {user.userIdHash}
                              </div>
                              <div className="text-xs text-zinc-500">
                                {user.queriesMade} queries
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-zinc-600 dark:text-zinc-400">
                              {user.filesUploaded} files
                            </div>
                            <div className="text-xs text-zinc-500">
                              {user.storageUsed || "0 MB"}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No user activity yet</p>
                    <p className="text-xs">
                      Top user activity will appear here when users start using
                      your API
                    </p>
                  </div>
                )}
              </div>

              {/* Privacy Protection Summary */}
              <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800 mt-6">
                <h4 className="font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-3">
                  <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                    <Shield className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  Privacy Protection Active
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
                      </div>
                      <span className="text-xs font-medium text-zinc-900 dark:text-white">
                        ✅ You CAN See:
                      </span>
                    </div>
                    <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                      <li>• User counts & activity levels</li>
                      <li>• File counts & storage usage</li>
                      <li>• API performance metrics</li>
                      <li>• Anonymous usage patterns</li>
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                        <AlertCircle className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
                      </div>
                      <span className="text-xs font-medium text-zinc-900 dark:text-white">
                        ❌ You CANNOT See:
                      </span>
                    </div>
                    <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                      <li>• Raw file content</li>
                      <li>• User questions/messages</li>
                      <li>• Personal user information</li>
                      <li>• Cross-user data access</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <Badge className="bg-zinc-600 dark:bg-zinc-800 text-white text-xs">
                    🛡️ Complete Privacy Protection
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credits Usage */}
          {subscription && credits && (
            <Card className="border-zinc-200 dark:border-zinc-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold text-zinc-900 dark:text-white">
                  <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  Credit Usage
                </CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400">
                  {credits.usedCredits.toLocaleString()} /{" "}
                  {credits.totalCredits.toLocaleString()} credits used this
                  month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                  <div
                    className="bg-amber-500 dark:bg-amber-400 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (credits.usedCredits / credits.totalCredits) * 100)}%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </Suspense>
      </div>
    </div>
  );
}

