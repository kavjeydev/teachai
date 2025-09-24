"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
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
} from "lucide-react";

interface ChatAnalytics {
  chatId: string;
  title: string;
  chatType: string;
  privacyMode: string;

  userStats: {
    totalUsers: number;
    activeUsers7d: number;
    totalSubchats: number;
  };

  fileStats: {
    totalFiles: number;
    totalStorage: {
      bytes: number;
      formatted: string;
    };
    averageFileSize: {
      bytes: number;
      formatted: string;
    };
    fileTypeBreakdown: {
      pdf: number;
      docx: number;
      txt: number;
      images: number;
      other: number;
    };
    filesPerUser: number;
  };

  apiStats: {
    totalQueries: number;
    queriesLast7Days: number;
    averageResponseTime: number;
    successRate: number;
    queriesPerUser: number;
    dailyAverage: number;
  };

  privacyCompliance: {
    mode: string;
    gdprCompliant: boolean;
    ccpaCompliant: boolean;
    auditEnabled: boolean;
    dataIsolationConfirmed: boolean;
  };

  userInsights: {
    topUsersByActivity: Array<{
      userIdHash: string;
      queriesMade: number;
      filesUploaded: number;
      storageUsed: string;
      lastActive: number;
    }>;
    activityDistribution: {
      lightUsers: number;
      moderateUsers: number;
      heavyUsers: number;
    };
  };

  lastUpdated: number;
}

interface ChatAnalyticsDashboardProps {
  analytics: ChatAnalytics;
}

export function ChatAnalyticsDashboard({ analytics }: ChatAnalyticsDashboardProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileTypeColor = (type: string) => {
    const colors = {
      pdf: 'bg-red-100 text-red-800 border-red-200',
      docx: 'bg-blue-100 text-blue-800 border-blue-200',
      txt: 'bg-green-100 text-green-800 border-green-200',
      images: 'bg-amber-100 text-amber-800 border-amber-200',
      other: 'bg-zinc-100 text-zinc-800 border-zinc-200',
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  const retentionRate = analytics.userStats.totalUsers > 0
    ? Math.round((analytics.userStats.activeUsers7d / analytics.userStats.totalUsers) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header with Privacy Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Chat Analytics
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            {analytics.title} • {analytics.chatType === "user_direct" ? "App Chat" : "Sub-Chat"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {analytics.privacyCompliance.dataIsolationConfirmed ? (
            <Badge className="bg-green-600 text-white shadow-lg">
              <Shield className="w-3 h-3 mr-1" />
              Privacy-First
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-600 text-amber-700">
              <Lock className="w-3 h-3 mr-1" />
              Legacy Mode
            </Badge>
          )}
        </div>
      </div>

      {/* Privacy-First Feature Highlight */}
      {analytics.privacyCompliance.dataIsolationConfirmed && (
        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50/50 to-blue-50/50 dark:from-green-950/30 dark:to-blue-950/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-green-800 dark:text-green-200">Privacy-First Architecture Active</h3>
                <p className="text-sm text-green-700 dark:text-green-300">Complete user data isolation - you cannot access raw user files</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-green-800 dark:text-green-200">{analytics.userStats.totalSubchats}</div>
                <div className="text-sm text-green-600 dark:text-green-400">Isolated Sub-Chats</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-800 dark:text-blue-200">{analytics.fileStats.totalFiles}</div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Private Files (No Access)</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-amber-800 dark:text-amber-200">{analytics.apiStats.totalQueries}</div>
                <div className="text-sm text-amber-600 dark:text-amber-400">AI Queries (Responses Only)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users */}
        <Card className="border border-blue-200 dark:border-blue-800 shadow-lg shadow-blue-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Users
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {analytics.userStats.totalUsers}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {analytics.userStats.activeUsers7d} active (7d)
            </p>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-blue-600 dark:text-blue-400">Retention</span>
                <span className="text-blue-800 dark:text-blue-200">{retentionRate}%</span>
              </div>
              <Progress
                value={retentionRate}
                className="h-2 bg-blue-100 dark:bg-blue-900"
              />
            </div>
          </CardContent>
        </Card>

        {/* Files */}
        <Card className="border border-green-200 dark:border-green-800 shadow-lg shadow-green-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Files
            </CardTitle>
            <Files className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {analytics.fileStats.totalFiles}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">
              {analytics.fileStats.filesPerUser} per user avg
            </p>
            <div className="mt-2">
              <div className="text-xs text-green-700 dark:text-green-300">
                Avg: {analytics.fileStats.averageFileSize.formatted}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card className="border border-amber-200 dark:border-amber-800 shadow-lg shadow-amber-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Storage
            </CardTitle>
            <HardDrive className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
              {analytics.fileStats.totalStorage.formatted}
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Private user namespaces
            </p>
            <div className="mt-2">
              <div className="text-xs text-amber-700 dark:text-amber-300">
                🔒 Developer cannot access
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Performance */}
        <Card className="border border-orange-200 dark:border-orange-800 shadow-lg shadow-orange-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
              API Performance
            </CardTitle>
            <Zap className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {analytics.apiStats.successRate}%
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              {analytics.apiStats.averageResponseTime}ms avg
            </p>
            <div className="mt-2">
              <div className="text-xs text-orange-700 dark:text-orange-300">
                {analytics.apiStats.totalQueries} total queries
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Type Distribution */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-zinc-600" />
              File Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.fileStats.fileTypeBreakdown).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={getFileTypeColor(type)}>
                      {type.toUpperCase()}
                    </Badge>
                    <span className="text-sm font-medium">{count} files</span>
                  </div>
                  <div className="text-xs text-zinc-500">
                    {analytics.fileStats.totalFiles > 0
                      ? Math.round((count / analytics.fileStats.totalFiles) * 100)
                      : 0}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Activity Distribution */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-zinc-600" />
              User Activity Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Light Users (< 10 queries)</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{analytics.userInsights.activityDistribution.lightUsers}</span>
                  <div className="w-16 h-2 bg-green-200 rounded-full">
                    <div
                      className="h-2 bg-green-500 rounded-full"
                      style={{
                        width: `${(analytics.userInsights.activityDistribution.lightUsers / analytics.userStats.totalUsers) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Moderate Users (10-50 queries)</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{analytics.userInsights.activityDistribution.moderateUsers}</span>
                  <div className="w-16 h-2 bg-blue-200 rounded-full">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{
                        width: `${(analytics.userInsights.activityDistribution.moderateUsers / analytics.userStats.totalUsers) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Heavy Users (50+ queries)</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{analytics.userInsights.activityDistribution.heavyUsers}</span>
                  <div className="w-16 h-2 bg-amber-200 rounded-full">
                    <div
                      className="h-2 bg-amber-500 rounded-full"
                      style={{
                        width: `${(analytics.userInsights.activityDistribution.heavyUsers / analytics.userStats.totalUsers) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Users Activity (Privacy-Safe) */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-zinc-600" />
            Top User Activity (Privacy-Safe)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.userInsights.topUsersByActivity.map((user, index) => (
              <div key={user.userIdHash} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{user.userIdHash}</div>
                    <div className="text-xs text-zinc-500">Last active: {formatDate(user.lastActive)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{user.queriesMade} queries</div>
                  <div className="text-xs text-zinc-500">{user.filesUploaded} files • {user.storageUsed}</div>
                </div>
              </div>
            ))}

            {analytics.userInsights.topUsersByActivity.length === 0 && (
              <div className="text-center py-8 text-zinc-500">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No user activity yet</p>
                <p className="text-xs">Activity will appear here as users interact with your app</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compliance & Privacy Status */}
      <Card className="shadow-lg border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <Shield className="w-5 h-5" />
            Privacy & Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-green-800 dark:text-green-200">GDPR</div>
              <div className="text-xs text-green-600 dark:text-green-400">
                {analytics.privacyCompliance.gdprCompliant ? 'Compliant' : 'Non-Compliant'}
              </div>
            </div>

            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <CheckCircle className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-blue-800 dark:text-blue-200">CCPA</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                {analytics.privacyCompliance.ccpaCompliant ? 'Compliant' : 'Non-Compliant'}
              </div>
            </div>

            <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <Database className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-amber-800 dark:text-amber-200">Data Isolation</div>
              <div className="text-xs text-amber-600 dark:text-amber-400">
                {analytics.privacyCompliance.dataIsolationConfirmed ? 'Active' : 'Not Active'}
              </div>
            </div>

            <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
              <Activity className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-orange-800 dark:text-orange-200">Audit Logs</div>
              <div className="text-xs text-orange-600 dark:text-orange-400">
                {analytics.privacyCompliance.auditEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Performance */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-zinc-600" />
              API Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Queries</span>
                <span className="text-lg font-bold">{analytics.apiStats.totalQueries}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Success Rate</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-green-600">{analytics.apiStats.successRate}%</span>
                  <Progress value={analytics.apiStats.successRate} className="w-16 h-2" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg Response Time</span>
                <span className="text-lg font-bold">
                  {analytics.apiStats.averageResponseTime}ms
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Daily Average</span>
                <span className="text-lg font-bold text-blue-600">
                  {analytics.apiStats.dailyAverage} queries/day
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Breakdown */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-zinc-600" />
              Storage Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-zinc-900 dark:text-white">
                  {analytics.fileStats.totalStorage.formatted}
                </div>
                <div className="text-sm text-zinc-500">Total Storage Used</div>
              </div>

              <div className="space-y-2">
                {Object.entries(analytics.fileStats.fileTypeBreakdown).map(([type, count]) => {
                  const percentage = analytics.fileStats.totalFiles > 0
                    ? (count / analytics.fileStats.totalFiles) * 100
                    : 0;

                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          type === 'pdf' ? 'bg-red-500' :
                          type === 'docx' ? 'bg-blue-500' :
                          type === 'txt' ? 'bg-green-500' :
                          type === 'images' ? 'bg-amber-500' :
                          'bg-zinc-500'
                        }`}></div>
                        <span className="text-sm font-medium capitalize">{type}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{count}</div>
                        <div className="text-xs text-zinc-500">{Math.round(percentage)}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-zinc-500">
        <Clock className="w-4 h-4 inline mr-1" />
        Last updated: {formatDate(analytics.lastUpdated)}
      </div>
    </div>
  );
}
