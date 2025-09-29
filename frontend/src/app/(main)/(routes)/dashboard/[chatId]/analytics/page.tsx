"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import { ResizableSidebar } from "@/app/(main)/components/resizable-sidebar";
import { useSidebarWidth } from "@/hooks/use-sidebar-width";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Users,
  Files,
  HardDrive,
  Activity,
  Shield,
  Clock,
  TrendingUp,
  Database,
  Lock,
  CheckCircle,
  BarChart3,
  PieChart,
  Zap,
  Eye,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ChatAnalyticsDashboard } from "@/components/chat-analytics-dashboard";

interface ChatAnalyticsPageProps {
  params: Promise<{
    chatId: Id<"chats">;
  }>;
}

export default function ChatAnalyticsPage({ params }: ChatAnalyticsPageProps) {
  const { user } = useUser();
  const router = useRouter();
  const { sidebarWidth } = useSidebarWidth();
  const [unwrappedParams, setUnwrappedParams] = useState<{ chatId: Id<"chats"> } | null>(null);

  useEffect(() => {
    params.then(setUnwrappedParams);
  }, [params]);

  const chatId = unwrappedParams?.chatId;
  const currentChat = useQuery(
    api.chats.getChatById,
    chatId ? { id: chatId } : "skip"
  );

  // Mock analytics data (in production, this would come from the chat_analytics query)
  const mockAnalytics = {
    chatId: currentChat?.chatId || "demo_chat",
    title: currentChat?.title || "Demo Chat",
    chatType: "user_direct",
    privacyMode: "privacy_first",

    userStats: {
      totalUsers: 47,
      activeUsers7d: 23,
      totalSubchats: 47,
    },

    fileStats: {
      totalFiles: 234,
      totalStorage: {
        bytes: 156789123,
        formatted: "149.5 MB",
      },
      averageFileSize: {
        bytes: 670000,
        formatted: "654 KB",
      },
      fileTypeBreakdown: {
        pdf: 156,
        docx: 45,
        txt: 23,
        images: 8,
        other: 2,
      },
      filesPerUser: 5,
    },

    apiStats: {
      totalQueries: 1847,
      queriesLast7Days: 312,
      averageResponseTime: 245,
      successRate: 98.2,
      queriesPerUser: 39,
      dailyAverage: 45,
    },

    privacyCompliance: {
      mode: "privacy_first",
      gdprCompliant: true,
      ccpaCompliant: true,
      auditEnabled: true,
      dataIsolationConfirmed: true,
    },

    userInsights: {
      topUsersByActivity: [
        {
          userIdHash: "user_***abc",
          queriesMade: 156,
          filesUploaded: 12,
          storageUsed: "8.4 MB",
          lastActive: Date.now() - 2 * 60 * 60 * 1000,
        },
        {
          userIdHash: "user_***def",
          queriesMade: 134,
          filesUploaded: 8,
          storageUsed: "5.2 MB",
          lastActive: Date.now() - 5 * 60 * 60 * 1000,
        },
        {
          userIdHash: "user_***ghi",
          queriesMade: 89,
          filesUploaded: 15,
          storageUsed: "12.1 MB",
          lastActive: Date.now() - 8 * 60 * 60 * 1000,
        },
      ],
      activityDistribution: {
        lightUsers: 25,
        moderateUsers: 18,
        heavyUsers: 4,
      },
    },

    lastUpdated: Date.now() - 5 * 60 * 1000,
  };

  if (!user || !chatId || !currentChat) {
    return (
      <div className="flex h-screen">
        <ResizableSidebar chatId={chatId} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-900">
      <ResizableSidebar chatId={chatId} />

      <div className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: `${sidebarWidth}px` }}>
        {/* Header */}
        <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/dashboard/${chatId}`)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Chat
              </Button>
              <div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Chat Analytics
                </h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {currentChat.title} • Privacy-First Insights
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-green-600 text-white shadow-lg">
                <Shield className="w-3 h-3 mr-1" />
                Privacy-First
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/${chatId}/settings`)}
              >
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Analytics Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Key Privacy Message */}
            <Card className="mb-8 border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/50 dark:to-blue-950/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-800 dark:text-green-200 mb-1">
                      🔒 Privacy-First Analytics
                    </h3>
                    <p className="text-green-700 dark:text-green-300 text-sm">
                      These analytics show usage patterns while protecting user privacy. You can see metrics but
                      <strong> never access raw user files or content.</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                      {mockAnalytics.userStats.totalUsers}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      Users with private sub-chats
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Dashboard */}
            <ChatAnalyticsDashboard analytics={mockAnalytics} />

            {/* Privacy Features Showcase */}
            <Card className="mt-8 border-2 border-blue-200 dark:border-blue-800 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <Eye className="w-5 h-5" />
                  What You Can See vs What You Cannot
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold mb-4 text-green-700 dark:text-green-300 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      ✅ Analytics You CAN See
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                        <Users className="w-4 h-4 text-green-600" />
                        <div>
                          <div className="font-medium text-sm text-green-800 dark:text-green-200">User Count & Activity</div>
                          <div className="text-xs text-green-700 dark:text-green-300">Total users, active users, usage patterns</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                        <Files className="w-4 h-4 text-green-600" />
                        <div>
                          <div className="font-medium text-sm text-green-800 dark:text-green-200">File Statistics</div>
                          <div className="text-xs text-green-700 dark:text-green-300">File counts, storage usage, type distribution</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                        <BarChart3 className="w-4 h-4 text-green-600" />
                        <div>
                          <div className="font-medium text-sm text-green-800 dark:text-green-200">API Performance</div>
                          <div className="text-xs text-green-700 dark:text-green-300">Response times, success rates, query counts</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                        <Activity className="w-4 h-4 text-green-600" />
                        <div>
                          <div className="font-medium text-sm text-green-800 dark:text-green-200">Anonymized User Activity</div>
                          <div className="text-xs text-green-700 dark:text-green-300">Hashed user IDs, activity levels, retention</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-4 text-red-700 dark:text-red-300 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      ❌ Data You CANNOT See
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                        <Files className="w-4 h-4 text-red-600" />
                        <div>
                          <div className="font-medium text-sm text-red-800 dark:text-red-200">Raw File Content</div>
                          <div className="text-xs text-red-700 dark:text-red-300">Cannot view, download, or list user files</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                        <Eye className="w-4 h-4 text-red-600" />
                        <div>
                          <div className="font-medium text-sm text-red-800 dark:text-red-200">User Questions & Content</div>
                          <div className="text-xs text-red-700 dark:text-red-300">Actual questions and file content are private</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                        <Database className="w-4 h-4 text-red-600" />
                        <div>
                          <div className="font-medium text-sm text-red-800 dark:text-red-200">Cross-User Data</div>
                          <div className="text-xs text-red-700 dark:text-red-300">Cannot access other users' data or files</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                        <Lock className="w-4 h-4 text-red-600" />
                        <div>
                          <div className="font-medium text-sm text-red-800 dark:text-red-200">Personal Information</div>
                          <div className="text-xs text-red-700 dark:text-red-300">Real user identities and personal data</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Privacy Advantage */}
                <div className="mt-8 bg-gradient-to-r from-blue-50 to-amber-50 dark:from-blue-950/30 dark:to-amber-950/30 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                  <div className="text-center">
                    <Sparkles className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                    <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-2">
                      🎯 The Privacy Advantage
                    </h4>
                    <p className="text-blue-700 dark:text-blue-300 max-w-2xl mx-auto">
                      Users trust uploading sensitive documents because they know you can't access their files.
                      This leads to <strong>higher engagement</strong>, <strong>more uploads</strong>, and <strong>better AI responses</strong> -
                      while keeping you compliant and liability-free.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
