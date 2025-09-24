"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { SimpleApiManager } from "@/components/simple-api-manager";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  X,
  Settings,
  Key,
  Zap,
  Shield,
  BookOpen,
  ExternalLink,
  Crown,
  ArrowRight,
  Sparkles,
  BarChart3,
  Users,
  Files,
  HardDrive,
  Activity,
  TrendingUp,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStripe } from "@/lib/stripe";
import { toast } from "sonner";

interface ApiSettingsSlideoutProps {
  chatId: Id<"chats">;
  isOpen: boolean;
  onClose: () => void;
}

export function ApiSettingsSlideout({
  chatId,
  isOpen,
  onClose,
}: ApiSettingsSlideoutProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Get chat data and subscription info
  const currentChat = useQuery(api.chats.getChatById, { id: chatId });
  const subscription = useQuery(api.subscriptions.getUserSubscription);
  const detailedSubscription = useQuery(
    api.subscriptions.getDetailedSubscription,
  );
  const credits = useQuery(api.subscriptions.getUserCredits);

  const handleUpgrade = async (priceId: string, tierName: string) => {
    setIsUpgrading(true);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId, mode: "subscription" }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { sessionId, url } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        const stripe = await getStripe();
        await stripe?.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error("Checkout failed:", error);
      toast.error("Failed to start checkout process");
    } finally {
      setIsUpgrading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure smooth slide-in animation
      setTimeout(() => {
        setIsAnimating(true);
      }, 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 500); // Match slower animation duration
  }, [onClose]);

  // Handle escape key to close slideout
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 bg-white dark:bg-zinc-900 shadow-2xl z-50 transition-transform duration-500 ease-in-out overflow-y-auto",
        isAnimating ? "translate-x-0" : "translate-x-full",
      )}
    >
      {/* Header */}
      <div className="sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 px-6 py-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                API Settings
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {currentChat?.title || "Loading..."}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {currentChat ? (
          <>
            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common API management tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant="outline"
                    className="justify-start h-auto p-4"
                    asChild
                  >
                    <a
                      href="/docs"
                      target="_blank"
                      className="flex items-center gap-3"
                    >
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <div className="text-left">
                        <div className="font-medium">View Documentation</div>
                        <div className="text-xs text-zinc-500">
                          Complete API reference and examples
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 ml-auto" />
                    </a>
                  </Button>

                  <Button
                    variant="outline"
                    className="justify-start h-auto p-4"
                    asChild
                  >
                    <a
                      href="/api-docs"
                      target="_blank"
                      className="flex items-center gap-3"
                    >
                      <Shield className="w-5 h-5 text-green-600" />
                      <div className="text-left">
                        <div className="font-medium">Test API</div>
                        <div className="text-xs text-zinc-500">
                          Interactive API testing interface
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 ml-auto" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Plan & Credits */}
            {subscription && credits && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5" />
                    Current Plan:{" "}
                    {subscription.tier === "free"
                      ? "Free"
                      : subscription.tier.charAt(0).toUpperCase() +
                        subscription.tier.slice(1)}
                    {detailedSubscription?.hasPendingChange && (
                      <Badge
                        variant="outline"
                        className="text-xs border-orange-300 text-orange-600"
                      >
                        Change Pending
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {credits.usedCredits.toLocaleString()} /{" "}
                    {credits.totalCredits.toLocaleString()} credits used this
                    month
                    {detailedSubscription?.hasPendingChange &&
                      "pendingTier" in detailedSubscription &&
                      "daysUntilChange" in detailedSubscription && (
                        <div className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                          → Changing to{" "}
                          {(detailedSubscription.pendingTier || "")
                            .charAt(0)
                            .toUpperCase() +
                            (detailedSubscription.pendingTier || "").slice(
                              1,
                            )}{" "}
                          in {detailedSubscription.daysUntilChange} day
                          {detailedSubscription.daysUntilChange !== 1
                            ? "s"
                            : ""}
                        </div>
                      )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-amber-600 to-amber-700 dark:from-amber-400 dark:to-amber-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (credits.usedCredits / credits.totalCredits) * 100)}%`,
                        }}
                      />
                    </div>

                    {subscription.tier === "free" && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() =>
                            handleUpgrade(
                              process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
                              "Pro",
                            )
                          }
                          disabled={isUpgrading}
                          className="flex-1 bg-amber-700 hover:bg-amber-800 dark:bg-amber-500 dark:hover:bg-amber-400"
                        >
                          {isUpgrading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Upgrade to Pro - $39/mo
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => window.open("/billing", "_blank")}
                          variant="outline"
                        >
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Manage Plans
                        </Button>
                      </div>
                    )}

                    {credits.usedCredits / credits.totalCredits > 0.8 && (
                      <div className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-800 rounded-lg">
                        <p className="text-sm text-amber-900 dark:text-amber-200 mb-2">
                          ⚠️ Running low on credits! Consider upgrading or
                          purchasing more credits.
                        </p>
                        <Button
                          onClick={() => window.open("/billing", "_blank")}
                          size="sm"
                          className="bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white"
                        >
                          <Crown className="w-3 h-3 mr-1" />
                          Upgrade Now
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* API Manager - Only for paid users */}
            {subscription?.tier === "free" ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    API Access
                  </CardTitle>
                  <CardDescription>
                    Convert your chat into a REST API endpoint
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-700 dark:from-amber-400 dark:to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Key className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                      API Access - Pro Feature
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 max-w-md mx-auto">
                      Turn your chat into a powerful REST API endpoint. Generate
                      API keys, test endpoints, and integrate with your
                      applications. Available with Pro subscription.
                    </p>
                    <div className="space-y-3">
                      <Button
                        onClick={() =>
                          handleUpgrade(
                            process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
                            "Pro",
                          )
                        }
                        disabled={isUpgrading}
                        className="bg-gradient-to-r from-amber-600 to-amber-700 dark:from-amber-400 dark:to-amber-600 hover:from-amber-400/90 hover:to-amber-600/90 text-white shadow-lg"
                      >
                        {isUpgrading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Crown className="w-4 h-4 mr-2" />
                            Upgrade to Pro - $39/mo
                          </>
                        )}
                      </Button>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                        <div>
                          ✓ 10,000 AI credits/month • ✓ API access • ✓ Priority
                          support
                        </div>
                        <Button
                          onClick={() => window.open("/billing", "_blank")}
                          variant="ghost"
                          size="sm"
                          className="text-xs h-auto p-1 hover:text-amber-600 dark:hover:text-amber-400"
                        >
                          View all plans & pricing →
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <SimpleApiManager
                  chatId={chatId}
                  chatTitle={currentChat.title || "Untitled Chat"}
                />

                {/* Chat Analytics Section */}
                <Card className="border-blue-200 dark:border-blue-800 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                      <BarChart3 className="w-5 h-5" />
                      Chat Analytics & Insights
                    </CardTitle>
                    <CardDescription>
                      Privacy-first analytics - you can see usage patterns but
                      never raw user data
                    </CardDescription>
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
                            Complete user data isolation - you cannot access raw
                            files or content
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <div className="text-lg font-bold text-green-800 dark:text-green-200">
                            {currentChat?.metadata?.totalSubchats || 0}
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400">
                            Private Sub-Chats
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                            {currentChat?.metadata?.totalFiles || 0}
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            Files (No Access)
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-amber-900 dark:text-amber-200">
                            {currentChat?.metadata?.totalQueries || 0}
                          </div>
                          <div className="text-xs text-amber-700 dark:text-amber-400">
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
                          {currentChat?.metadata?.totalUsers || 0}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          Total Users
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                          {currentChat?.metadata?.activeUsers || 0} active (7d)
                        </div>
                      </div>

                      <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                        <Files className="w-5 h-5 text-green-600 mx-auto mb-2" />
                        <div className="text-lg font-bold text-green-800 dark:text-green-200">
                          {currentChat?.metadata?.totalFiles || 0}
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400">
                          Files Uploaded
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                          {currentChat?.metadata?.totalStorageBytes
                            ? `${Math.round((currentChat.metadata.totalStorageBytes / 1024 / 1024) * 10) / 10} MB`
                            : "0 MB"}{" "}
                          total
                        </div>
                      </div>

                      <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                        <Activity className="w-5 h-5 text-amber-600 mx-auto mb-2" />
                        <div className="text-lg font-bold text-amber-900 dark:text-amber-200">
                          {currentChat?.metadata?.successRate || 0}%
                        </div>
                        <div className="text-xs text-amber-700 dark:text-amber-400">
                          Success Rate
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                          {currentChat?.metadata?.totalQueries || 0} queries
                        </div>
                      </div>

                      <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                        <TrendingUp className="w-5 h-5 text-orange-600 mx-auto mb-2" />
                        <div className="text-lg font-bold text-orange-800 dark:text-orange-200">
                          {currentChat?.metadata?.averageResponseTime || 0}ms
                        </div>
                        <div className="text-xs text-orange-600 dark:text-orange-400">
                          Avg Response
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                          {Math.round(
                            (currentChat?.metadata?.queriesLast7Days || 0) / 7,
                          )}
                          /day avg
                        </div>
                      </div>
                    </div>

                    {/* File Type Distribution */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2">
                        <HardDrive className="w-4 h-4" />
                        File Type Breakdown
                      </h4>
                      {currentChat?.metadata?.fileTypeStats ? (
                        <div className="space-y-2">
                          {Object.entries(
                            currentChat.metadata.fileTypeStats,
                          ).map(([type, count]) => {
                            const totalFiles =
                              currentChat.metadata?.totalFiles || 0;
                            const percentage =
                              totalFiles > 0
                                ? Math.round((count / totalFiles) * 100)
                                : 0;
                            const colors = {
                              pdf: "bg-red-500",
                              docx: "bg-blue-500",
                              txt: "bg-green-500",
                              images: "bg-amber-500",
                              other: "bg-zinc-500",
                            };

                            if (count > 0) {
                              return (
                                <div
                                  key={type}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-3 h-3 rounded-full ${colors[type as keyof typeof colors] || "bg-zinc-500"}`}
                                    ></div>
                                    <span className="text-sm font-medium">
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
                        <div className="text-center py-4 text-zinc-500">
                          <Files className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No files uploaded yet</p>
                          <p className="text-xs">
                            File type distribution will appear here
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Top User Activity (Privacy-Safe) */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Top Users (Privacy-Safe)
                      </h4>
                      {currentChat?.metadata?.userActivitySummary &&
                      currentChat.metadata.userActivitySummary.length > 0 ? (
                        <div className="space-y-2">
                          {currentChat.metadata.userActivitySummary
                            .sort((a, b) => b.queriesMade - a.queriesMade)
                            .slice(0, 3)
                            .map((user, index) => (
                              <div
                                key={user.userIdHash}
                                className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                    #{index + 1}
                                  </div>
                                  <div>
                                    <div className="font-medium text-sm">
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
                                    {user.storageUsedBytes > 0
                                      ? `${Math.round((user.storageUsedBytes / 1024 / 1024) * 10) / 10} MB`
                                      : "0 MB"}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-zinc-500">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No user activity yet</p>
                          <p className="text-xs">
                            Top user activity will appear here when users start
                            using your API
                          </p>
                        </div>
                      )}
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
                  </CardContent>
                </Card>
              </>
            )}
          </>
        ) : (
          // Loading state
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">
                Loading API settings...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
