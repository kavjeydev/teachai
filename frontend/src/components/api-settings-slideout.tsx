"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
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
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStripe } from "@/lib/stripe";
import { toast } from "sonner";
import { StorageUsageIndicator } from "@/components/storage-usage-indicator";

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
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Get chat data and subscription info
  const currentChat = useQuery(api.chats.getChatById, { id: chatId });
  const subscription = useQuery(api.subscriptions.getUserSubscription);
  const detailedSubscription = useQuery(
    api.subscriptions.getDetailedSubscription,
  );
  const credits = useQuery(api.subscriptions.getUserCredits);

  // Get real analytics data
  const chatAnalytics = useQuery(api.chat_analytics.getChatAnalytics, {
    chatId,
  });

  // Recalculate metrics mutation
  // Note: recalculateAnalyticsMetrics is an internal mutation and cannot be called directly
  // const recalculateMetrics = useMutation(
  //   api.chat_analytics.recalculateAnalyticsMetrics,
  // );

  // Migration mutation
  const migrateAllChatsMetadata = useMutation(
    api.chat_analytics.migrateAllUserChatsMetadata,
  );
  const [isMigrating, setIsMigrating] = useState(false);

  // Fix chat setup mutation
  const fixChatSetup = useMutation(api.chat_analytics.fixChatSetup);
  const [isFixing, setIsFixing] = useState(false);

  // Debug function
  const debugChatStructure = useQuery(api.chat_analytics.debugChatStructure, {
    chatId,
  });

  const handleRecalculateMetrics = async () => {
    setIsRecalculating(true);
    try {
      // Note: This functionality requires a public wrapper mutation
      // await recalculateMetrics({ chatId });
      toast.info("Metrics recalculation is currently disabled");
    } catch (error) {
      console.error("Failed to recalculate metrics:", error);
      toast.error("Failed to recalculate metrics");
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleMigrateMetadata = async () => {
    setIsMigrating(true);
    try {
      const result = await migrateAllChatsMetadata({});
      toast.success(result.message);
    } catch (error) {
      console.error("Failed to migrate metadata:", error);
      toast.error("Failed to migrate metadata schema");
    } finally {
      setIsMigrating(false);
    }
  };

  const handleFixChatSetup = async () => {
    setIsFixing(true);
    try {
      const result = await fixChatSetup({ chatId });
      toast.success(result.message);
    } catch (error) {
      console.error("Failed to fix chat setup:", error);
      toast.error("Failed to fix chat setup");
    } finally {
      setIsFixing(false);
    }
  };

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
      <div className="sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 px-6 py-5 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-900 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                API Settings
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {currentChat?.title || "Loading..."}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
          >
            <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {currentChat ? (
          <>
            {/* Quick Links */}
            <Card className="border-zinc-200 dark:border-zinc-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold text-zinc-900 dark:text-white">
                  <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400">
                  Common API management tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="ghost"
                    className="justify-start h-auto p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
                    asChild
                  >
                    <a
                      href="/docs"
                      target="_blank"
                      className="flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-medium text-zinc-900 dark:text-white">
                          View Documentation
                        </div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          Complete API reference and examples
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-zinc-400" />
                    </a>
                  </Button>

                  <Button
                    variant="ghost"
                    className="justify-start h-auto p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
                    asChild
                  >
                    <a
                      href="/api-docs"
                      target="_blank"
                      className="flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-medium text-zinc-900 dark:text-white">
                          Test API
                        </div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          Interactive API testing interface
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-zinc-400" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Plan & Credits */}
            {subscription && credits && (
              <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold text-zinc-900 dark:text-white">
                    <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                      <Crown className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    Current Plan:{" "}
                    {subscription.tier === "free"
                      ? "Free"
                      : subscription.tier.charAt(0).toUpperCase() +
                        subscription.tier.slice(1)}
                    {detailedSubscription?.hasPendingChange && (
                      <Badge
                        variant="outline"
                        className="text-xs border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400"
                      >
                        Change Pending
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-zinc-500 dark:text-zinc-400">
                    {credits.usedCredits.toLocaleString()} /{" "}
                    {credits.totalCredits.toLocaleString()} credits used this
                    month
                    {detailedSubscription?.hasPendingChange &&
                      "pendingTier" in detailedSubscription &&
                      "daysUntilChange" in detailedSubscription && (
                        <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">
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
                  <div className="space-y-4">
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                      <div
                        className="bg-amber-500 dark:bg-amber-400 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (credits.usedCredits / credits.totalCredits) * 100)}%`,
                        }}
                      />
                    </div>

                    {/* Storage Usage */}
                    <StorageUsageIndicator />

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
                          className="flex-1 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white"
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
                          className="border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        >
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Manage Plans
                        </Button>
                      </div>
                    )}

                    {credits.usedCredits / credits.totalCredits > 0.8 && (
                      <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                          ⚠️ Running low on credits! Consider upgrading or
                          purchasing more credits.
                        </p>
                        <Button
                          onClick={() => window.open("/billing", "_blank")}
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white"
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
              <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold text-zinc-900 dark:text-white">
                    <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                      <Key className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    API Access
                  </CardTitle>
                  <CardDescription className="text-zinc-500 dark:text-zinc-400">
                    Convert your chat into a REST API endpoint
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-xl flex items-center justify-center mx-auto mb-6">
                      <Key className="w-8 h-8 text-zinc-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                      API Access - Pro Feature
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 max-w-md mx-auto">
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
                        className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white"
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
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-2">
                        <div>
                          ✓ 10,000 AI credits/month • ✓ API access • ✓ Priority
                          support
                        </div>
                        <Button
                          onClick={() => window.open("/billing", "_blank")}
                          variant="ghost"
                          size="sm"
                          className="text-xs h-auto p-2 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
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
                <Card className="border-zinc-200 dark:border-zinc-800">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg font-semibold text-zinc-900 dark:text-white">
                      <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                        <BarChart3 className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
                      </div>
                      Chat Analytics & Insights
                    </CardTitle>
                    <CardDescription className="text-zinc-500 dark:text-zinc-400">
                      Privacy-first analytics - you can see usage patterns but
                      never raw user data
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
                              Complete user data isolation - you cannot access
                              raw files or content
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            onClick={handleFixChatSetup}
                            disabled={isFixing}
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                          >
                            <Settings
                              className={`w-3 h-3 mr-1 ${isFixing ? "animate-spin" : ""}`}
                            />
                            {isFixing ? "Fixing..." : "Fix Setup"}
                          </Button>
                          <Button
                            onClick={handleMigrateMetadata}
                            disabled={isMigrating}
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                          >
                            <CheckCircle
                              className={`w-3 h-3 mr-1 ${isMigrating ? "animate-spin" : ""}`}
                            />
                            {isMigrating ? "Migrating..." : "Fix Schema"}
                          </Button>
                          <Button
                            onClick={handleRecalculateMetrics}
                            disabled={isRecalculating}
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                          >
                            <RefreshCw
                              className={`w-3 h-3 mr-1 ${isRecalculating ? "animate-spin" : ""}`}
                            />
                            {isRecalculating ? "Updating..." : "Refresh"}
                          </Button>
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
                          {chatAnalytics?.apiStats?.queriesLast7Days || 0} last
                          7d
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
                          ).map(([type, count]) => {
                            const totalFiles =
                              chatAnalytics.fileStats?.totalFiles || 0;
                            const percentage =
                              totalFiles > 0
                                ? Math.round((count / totalFiles) * 100)
                                : 0;
                            const colors = {
                              pdf: "bg-zinc-400",
                              docx: "bg-zinc-500",
                              txt: "bg-zinc-600",
                              images: "bg-zinc-400",
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
                            .sort((a, b) => b.queriesMade - a.queriesMade)
                            .slice(0, 3)
                            .map((user, index) => (
                              <div
                                key={user.userIdHash}
                                className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-700 dark:text-zinc-300 font-bold text-xs">
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
                                    {user.storageUsed || "0 MB"}
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
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
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

                {/* Debug Information */}
                {debugChatStructure && (
                  <Card className="border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-lg font-semibold text-zinc-900 dark:text-white">
                        🔍 Debug Info
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                        <div>
                          <strong>Chat ID:</strong>{" "}
                          {debugChatStructure.chatInfo.chatId}
                        </div>
                        <div>
                          <strong>Chat Type:</strong>{" "}
                          {debugChatStructure.chatInfo.chatType}
                        </div>
                        <div>
                          <strong>Parent Files:</strong>{" "}
                          {debugChatStructure.chatInfo.contextFiles}
                        </div>
                        <div>
                          <strong>Direct Sub-chats:</strong>{" "}
                          {debugChatStructure.subchats.directSubchats.length}
                        </div>
                        <div>
                          <strong>User App Chats:</strong>{" "}
                          {debugChatStructure.subchats.userAppChats}
                        </div>
                        <div>
                          <strong>User App Auths:</strong>{" "}
                          {debugChatStructure.subchats.userAppAuths}
                        </div>
                        <div>
                          <strong>Metadata Files:</strong>{" "}
                          {debugChatStructure.currentMetadata?.totalFiles || 0}
                        </div>
                        <div>
                          <strong>Metadata Users:</strong>{" "}
                          {debugChatStructure.currentMetadata?.totalUsers || 0}
                        </div>
                        <div>
                          <strong>Potential Sub-chats:</strong>{" "}
                          {debugChatStructure.subchats.potentialSubchats
                            ?.length || 0}
                        </div>
                        <div>
                          <strong>All Chats w/ Parent:</strong>{" "}
                          {debugChatStructure.subchats.allChatsWithParent
                            ?.length || 0}
                        </div>
                        {(debugChatStructure.subchats.directSubchats.length >
                          0 ||
                          debugChatStructure.subchats.potentialSubchats
                            ?.length > 0) && (
                          <details className="mt-2">
                            <summary className="cursor-pointer font-medium">
                              Sub-chat Details
                            </summary>
                            <div className="mt-1 space-y-1 ml-2">
                              {debugChatStructure.subchats.directSubchats.map(
                                (sc, idx) => (
                                  <div key={idx} className="text-xs">
                                    <div>
                                      <strong>
                                        Direct Sub-chat {idx + 1}:
                                      </strong>{" "}
                                      {sc.chatId}
                                    </div>
                                    <div className="ml-2">
                                      Files: {sc.contextFiles}, User:{" "}
                                      {sc.userId?.slice(-8)}
                                    </div>
                                  </div>
                                ),
                              )}
                              {debugChatStructure.subchats.potentialSubchats?.map(
                                (sc, idx) => (
                                  <div
                                    key={`potential-${idx}`}
                                    className="text-xs"
                                  >
                                    <div>
                                      <strong>
                                        Potential Sub-chat {idx + 1}:
                                      </strong>{" "}
                                      {sc.chatId}
                                    </div>
                                    <div className="ml-2">
                                      Type: {sc.chatType}, Files:{" "}
                                      {sc.contextFiles}, Parent:{" "}
                                      {sc.parentAppId}
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </details>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        ) : (
          // Loading state
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Settings className="w-8 h-8 text-zinc-400" />
              </div>
              <p className="text-zinc-500 dark:text-zinc-400">
                Loading API settings...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
