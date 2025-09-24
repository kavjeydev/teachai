"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Users,
  Files,
  HardDrive,
  Activity,
  TrendingUp,
  Shield,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react";

/**
 * Demo component showing what the API analytics will look like
 * in the API settings slideout for each chat
 */
export function ApiAnalyticsDemo() {
  return (
    <Card className="border-blue-200 dark:border-blue-800 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
          <BarChart3 className="w-5 h-5" />
          Chat Analytics & Insights
        </CardTitle>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Privacy-first analytics - you can see usage patterns but never raw
          user data
        </p>
      </CardHeader>
      <CardContent>
        {/* Privacy-First Highlight */}
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-5 h-5 text-green-600" />
            <div>
              <h4 className="font-semibold text-green-800 dark:text-green-200 text-sm">
                🔒 Privacy-First Analytics
              </h4>
              <p className="text-xs text-green-700 dark:text-green-300">
                Complete user data isolation - you cannot access raw files or
                content
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-green-800 dark:text-green-200">
                47
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                Private Sub-Chats
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                234
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                Files (No Access)
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-800 dark:text-amber-200">
                1.8K
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-400">
                AI Queries Only
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <Users className="w-5 h-5 text-blue-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
              47
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Total Users
            </div>
            <div className="text-xs text-zinc-500 mt-1">23 active (7d)</div>
          </div>

          <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
            <Files className="w-5 h-5 text-green-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-green-800 dark:text-green-200">
              234
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              Files Uploaded
            </div>
            <div className="text-xs text-zinc-500 mt-1">149.5 MB total</div>
          </div>

          <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
            <Activity className="w-5 h-5 text-amber-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-amber-800 dark:text-amber-200">
              98.2%
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-400">
              Success Rate
            </div>
            <div className="text-xs text-zinc-500 mt-1">1,847 queries</div>
          </div>

          <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
            <TrendingUp className="w-5 h-5 text-orange-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-orange-800 dark:text-orange-200">
              245ms
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400">
              Avg Response
            </div>
            <div className="text-xs text-zinc-500 mt-1">45/day avg</div>
          </div>
        </div>

        {/* File Type Distribution */}
        <div className="mb-6">
          <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2">
            <HardDrive className="w-4 h-4" />
            File Type Breakdown
          </h4>
          <div className="space-y-2">
            {[
              { type: "PDF", count: 156, color: "bg-red-500", percentage: 67 },
              { type: "DOCX", count: 45, color: "bg-blue-500", percentage: 19 },
              { type: "TXT", count: 23, color: "bg-green-500", percentage: 10 },
              { type: "Other", count: 10, color: "bg-zinc-500", percentage: 4 },
            ].map((item) => (
              <div
                key={item.type}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm font-medium">{item.type}</span>
                  <span className="text-xs text-zinc-500">
                    {item.count} files
                  </span>
                </div>
                <div className="text-xs text-zinc-500">{item.percentage}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top User Activity (Privacy-Safe) */}
        <div className="mb-6">
          <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Top Users (Privacy-Safe)
          </h4>
          <div className="space-y-2">
            {[
              {
                userHash: "user_***abc",
                queries: 156,
                files: 12,
                storage: "8.4 MB",
              },
              {
                userHash: "user_***def",
                queries: 134,
                files: 8,
                storage: "5.2 MB",
              },
              {
                userHash: "user_***ghi",
                queries: 89,
                files: 15,
                storage: "12.1 MB",
              },
            ].map((user, index) => (
              <div
                key={user.userHash}
                className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{user.userHash}</div>
                    <div className="text-xs text-zinc-500">
                      {user.queries} queries
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                    {user.files} files
                  </div>
                  <div className="text-xs text-zinc-500">{user.storage}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Protection Summary */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Privacy Protection Active
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span className="text-xs font-medium text-green-800 dark:text-green-200">
                  ✅ You CAN See:
                </span>
              </div>
              <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                <li>• User counts & activity levels</li>
                <li>• File counts & storage usage</li>
                <li>• API performance metrics</li>
                <li>• Anonymous usage patterns</li>
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-3 h-3 text-red-600" />
                <span className="text-xs font-medium text-red-800 dark:text-red-200">
                  ❌ You CANNOT See:
                </span>
              </div>
              <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                <li>• Raw file content</li>
                <li>• User questions/messages</li>
                <li>• Personal user information</li>
                <li>• Cross-user data access</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 text-center">
            <Badge className="bg-green-600 text-white text-xs">
              🛡️ Complete Privacy Protection
            </Badge>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-6 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-amber-50 dark:from-blue-950/30 dark:to-amber-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <Sparkles className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              🚀 Privacy Advantage
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Users trust uploading sensitive documents because they know you
              can't access their files. This leads to higher engagement and
              better AI responses!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
