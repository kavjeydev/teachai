"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { ResizableSidebar } from "@/app/(main)/components/resizable-sidebar";
import { useSidebarWidth } from "@/hooks/use-sidebar-width";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  User,
  Crown,
  TrendingUp,
  Calendar,
  CreditCard,
  Zap,
  BarChart3,
  Clock,
  Activity,
  Search,
  Filter,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCredits, formatTokens } from "@/lib/stripe";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user } = useUser();
  const { sidebarWidth } = useSidebarWidth();
  const router = useRouter();

  // Search state for usage history
  const [searchQuery, setSearchQuery] = useState("");
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const subscription = useQuery(api.subscriptions.getUserSubscription);
  const credits = useQuery(api.subscriptions.getUserCredits);
  const creditHistory = useQuery(api.subscriptions.getCreditHistory, {
    limit: 50,
  }); // Increased limit for better search results

  const currentTier = subscription?.tier || "free";
  const creditsUsagePercent = credits
    ? parseFloat(
        ((credits.usedCredits / credits.totalCredits) * 100).toFixed(2),
      )
    : 0;

  // Filter and search credit history
  const filteredCreditHistory = useMemo(() => {
    if (!creditHistory) return [];

    return creditHistory.filter((transaction) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        transaction.description.toLowerCase().includes(searchLower) ||
        transaction.model?.toLowerCase().includes(searchLower) ||
        new Date(transaction.timestamp)
          .toLocaleDateString()
          .includes(searchLower) ||
        new Date(transaction.timestamp)
          .toLocaleTimeString()
          .includes(searchLower)
      );
    });
  }, [creditHistory, searchQuery]);

  const handleManageBilling = async () => {
    setIsPortalLoading(true);
    try {
      const response = await fetch("/api/stripe/customer-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log("Billing portal error:", errorData); // Debug logging
        throw new Error(errorData.error || "Failed to open billing portal");
      }

      const { url } = await response.json();
      window.open(url, "_blank");
    } catch (error) {
      console.error("Billing portal failed:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to open billing portal");
      }
    } finally {
      setIsPortalLoading(false);
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "pro":
        return "bg-blue-500";
      case "team":
        return "bg-amber-500";
      case "startup":
        return "bg-orange-500";
      default:
        return "bg-zinc-500";
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Resizable Sidebar */}
      <ResizableSidebar />

      {/* Main Content Area - Responsive to sidebar width */}
      <div
        className="h-screen flex flex-col"
        style={{
          marginLeft: `${sidebarWidth}px`,
          transition: "margin-left 300ms ease-out",
        }}
      >
        {/* Header */}
        <div className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                Profile & Usage
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Monitor your subscription and AI credit usage
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* User Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      {user?.firstName} {user?.lastName}
                      <Badge
                        className={`${getTierBadgeColor(currentTier)} text-white`}
                      >
                        {currentTier === "free"
                          ? "Free"
                          : currentTier.charAt(0).toUpperCase() +
                            currentTier.slice(1)}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <span>{user?.emailAddresses[0]?.emailAddress}</span>
                      {subscription?.currentPeriodEnd && (
                        <>
                          <span>•</span>
                          <span>
                            Next billing:{" "}
                            {new Date(
                              subscription.currentPeriodEnd,
                            ).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Credit Usage Dashboard */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Current Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Credit Usage
                  </CardTitle>
                  <CardDescription>This billing period</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                      {credits ? formatCredits(credits.usedCredits) : "0"}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      of {credits ? formatCredits(credits.totalCredits) : "0"}{" "}
                      credits used
                    </p>
                  </div>

                  <Progress value={creditsUsagePercent} className="h-3" />

                  <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                    <span>{creditsUsagePercent}% used</span>
                    <span>
                      {credits
                        ? formatCredits(credits.remainingCredits || 0)
                        : "0"}{" "}
                      remaining
                    </span>
                  </div>

                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Equivalent to ~
                      {credits ? formatTokens(credits.totalCredits) : "0"} on
                      GPT-4o-mini
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Billing Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Billing Period
                  </CardTitle>
                  <CardDescription>Current subscription cycle</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        Period Start:
                      </span>
                      <span className="text-sm font-medium">
                        {credits?.periodStart
                          ? new Date(credits.periodStart).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        Period End:
                      </span>
                      <span className="text-sm font-medium">
                        {credits?.periodEnd
                          ? new Date(credits.periodEnd).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        Days Remaining:
                      </span>
                      <span className="text-sm font-medium">
                        {credits?.periodEnd
                          ? Math.max(
                              0,
                              Math.ceil(
                                (credits.periodEnd - Date.now()) /
                                  (1000 * 60 * 60 * 24),
                              ),
                            )
                          : 0}{" "}
                        days
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleManageBilling}
                    variant="outline"
                    className="w-full"
                    disabled={isPortalLoading}
                  >
                    {isPortalLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin mr-2" />
                        Opening Portal...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Manage Billing
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Recent Usage History */}
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Recent Usage
                    </CardTitle>
                    <CardDescription>
                      Your AI model usage history (
                      {filteredCreditHistory.length}{" "}
                      {filteredCreditHistory.length === 1
                        ? "transaction"
                        : "transactions"}
                      )
                    </CardDescription>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input
                    placeholder="Search by description, model, or date..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:border-amber-400 dark:focus:border-amber-400"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                      onClick={() => setSearchQuery("")}
                    >
                      ×
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-hidden p-0">
                {filteredCreditHistory && filteredCreditHistory.length > 0 ? (
                  <div className="h-full overflow-y-auto px-6 pb-6">
                    <div className="space-y-3">
                      {filteredCreditHistory.map((transaction, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-700 hover:border-amber-400/30 dark:hover:border-amber-400/30 transition-all duration-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center shadow-lg">
                              <Zap className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                                {transaction.description}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {transaction.model}
                                </Badge>
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                  {new Date(
                                    transaction.timestamp,
                                  ).toLocaleDateString()}
                                </span>
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                  {new Date(
                                    transaction.timestamp,
                                  ).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                              -{formatCredits(Math.abs(transaction.amount))}{" "}
                              credits
                            </p>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">
                              {transaction.tokensUsed?.toLocaleString() || "0"}{" "}
                              tokens
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : creditHistory && creditHistory.length > 0 && searchQuery ? (
                  <div className="flex-1 flex items-center justify-center px-6">
                    <div className="text-center">
                      <Search className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                      <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                        No results found for "{searchQuery}"
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchQuery("")}
                        className="text-amber-400 hover:text-amber-400/80"
                      >
                        Clear search
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center px-6">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                      <p className="text-zinc-600 dark:text-zinc-400">
                        No usage history yet. Start chatting to see your credit
                        consumption!
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
