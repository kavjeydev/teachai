"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { ResizableSidebar } from "@/app/(main)/components/resizable-sidebar";
import { ChatNavbar } from "@/app/(main)/components/chat-navbar";
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
  Plus,
  Sparkles,
  Star,
  Info,
  AlertCircle,
  ArrowRight,
  Rocket,
  Building,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  formatCredits,
  formatTokens,
  CREDIT_PACKS,
  PRICING_TIERS,
} from "@/lib/stripe";
import { toast } from "sonner";
import { getStripe } from "@/lib/stripe";

export default function ProfilePage() {
  const { user } = useUser();
  const { sidebarWidth } = useSidebarWidth();
  const router = useRouter();

  // Search state for usage history
  const [searchQuery, setSearchQuery] = useState("");
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);

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

  const handleBuyCredits = async (
    priceId: string | undefined,
    packName: string,
  ) => {
    if (!priceId) {
      toast.error(
        "Credit pack not available. Please contact support at kavin11205@gmail.com.",
      );
      return;
    }

    setIsLoading(priceId);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId, mode: "payment" }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Checkout API error:", errorData);
        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const { sessionId, url } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        const stripe = await getStripe();
        await stripe?.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error("Credit purchase failed:", error);
      toast.error("Failed to purchase credits");
    } finally {
      setIsLoading(null);
    }
  };

  const handleUpgrade = async (priceId: string | null, tierName: string) => {
    if (!priceId) {
      if (tierName === "Enterprise") {
        window.open(
          "mailto:kavin11205@gmail.com?subject=Enterprise%20Inquiry",
          "_blank",
        );
      } else {
        toast.error(
          `${tierName} plan is not configured. Please contact support at kavin11205@gmail.com.`,
        );
      }
      return;
    }

    setIsLoading(priceId);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId, mode: "subscription" }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Checkout error:", errorData);

        if (response.status === 400 && errorData.currentTier) {
          toast.error(
            `You already have an active ${errorData.currentTier} subscription. Use the billing portal to change plans.`,
          );
          return;
        }

        throw new Error(errorData.error || "Failed to create checkout session");
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
      setIsLoading(null);
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "pro":
        return "bg-blue-500";
      case "scale":
        return "bg-orange-500";
      case "enterprise":
        return "bg-emerald-500";
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
        className="h-[100vh] flex flex-col relative bg-gradient-to-b px-4 pb-4 from-white via-white to-white dark:from-[#090909] dark:via-[#090909] dark:to-[#090909] rounded-3xl"
        style={{
          marginLeft: `${sidebarWidth}px`,
          transition: "margin-left 300ms ease-out",
        }}
      >
        {/* Chat Navbar */}
        <ChatNavbar />

        {/* Content */}
        <div className="flex-1 overflow-y-auto relative border rounded-3xl border-zinc-200 dark:border-zinc-800 p-6">
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

            {/* Upgrade Cards - Only show for free tier users */}
            {currentTier === "free" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Upgrade Your Plan
                  </CardTitle>
                  <CardDescription>
                    Get more credits, unlimited chats, and advanced features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Pro Plan */}
                    <Card className="relative border-2 border-blue-200 hover:border-blue-400 transition-all duration-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
                      <CardContent className="p-4">
                        <div className="text-center space-y-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto">
                            <Zap className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                              Pro
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              Perfect for individuals
                            </p>
                          </div>
                          <div className="space-y-2">
                            <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                              $39
                              <span className="text-sm font-normal">/mo</span>
                            </div>
                            <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                              <div className="flex items-center gap-1 justify-center">
                                <Check className="w-3 h-3 text-green-500" />
                                <span>{formatTokens(10000)} credits</span>
                              </div>
                              <div className="flex items-center gap-1 justify-center">
                                <Check className="w-3 h-3 text-green-500" />
                                <span>3 chats</span>
                              </div>
                              <div className="flex items-center gap-1 justify-center">
                                <Check className="w-3 h-3 text-green-500" />
                                <span>API access</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() =>
                              handleUpgrade(
                                PRICING_TIERS.PRO.priceId || null,
                                "Pro",
                              )
                            }
                            disabled={isLoading === PRICING_TIERS.PRO.priceId}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {isLoading === PRICING_TIERS.PRO.priceId ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <ArrowRight className="w-4 h-4 mr-2" />
                                Upgrade to Pro
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Scale Plan */}
                    <Card className="relative border-2 border-purple-200 hover:border-purple-400 transition-all duration-200 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1">
                          Most Popular
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <div className="text-center space-y-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto">
                            <Rocket className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                              Scale
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              For growing teams
                            </p>
                          </div>
                          <div className="space-y-2">
                            <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                              $199
                              <span className="text-sm font-normal">/mo</span>
                            </div>
                            <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                              <div className="flex items-center gap-1 justify-center">
                                <Check className="w-3 h-3 text-green-500" />
                                <span>{formatTokens(100000)} credits</span>
                              </div>
                              <div className="flex items-center gap-1 justify-center">
                                <Check className="w-3 h-3 text-green-500" />
                                <span>25 chats</span>
                              </div>
                              <div className="flex items-center gap-1 justify-center">
                                <Check className="w-3 h-3 text-green-500" />
                                <span>Priority support</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() =>
                              handleUpgrade(
                                PRICING_TIERS.SCALE.priceId || null,
                                "Scale",
                              )
                            }
                            disabled={isLoading === PRICING_TIERS.SCALE.priceId}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            {isLoading === PRICING_TIERS.SCALE.priceId ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <ArrowRight className="w-4 h-4 mr-2" />
                                Upgrade to Scale
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Enterprise Plan */}
                    <Card className="relative border-2 border-emerald-200 hover:border-emerald-400 transition-all duration-200 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20">
                      <CardContent className="p-4">
                        <div className="text-center space-y-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto">
                            <Building className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                              Enterprise
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              For large organizations
                            </p>
                          </div>
                          <div className="space-y-2">
                            <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                              Custom
                            </div>
                            <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                              <div className="flex items-center gap-1 justify-center">
                                <Check className="w-3 h-3 text-green-500" />
                                <span>Unlimited credits</span>
                              </div>
                              <div className="flex items-center gap-1 justify-center">
                                <Check className="w-3 h-3 text-green-500" />
                                <span>Unlimited chats</span>
                              </div>
                              <div className="flex items-center gap-1 justify-center">
                                <Check className="w-3 h-3 text-green-500" />
                                <span>Dedicated support</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleUpgrade(null, "Enterprise")}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Contact Sales
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            )}

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

                  <div className="space-y-2">
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
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Credit Packs Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Buy Additional Credits
                </CardTitle>
                <CardDescription>
                  Top up your account with extra AI credits for heavy usage
                  periods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(CREDIT_PACKS).map(([packKey, pack]) => (
                    <Card
                      key={packKey}
                      className="relative border-2 hover:border-amber-400/50 transition-all duration-200"
                    >
                      <CardContent className="p-4">
                        <div className="text-center space-y-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center mx-auto">
                            <Sparkles className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                              {formatCredits(pack.credits)} Credits
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              ~{formatTokens(pack.credits)} on GPT-4o-mini
                            </p>
                          </div>
                          <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                            ${pack.price}
                          </div>
                          <Button
                            onClick={() =>
                              handleBuyCredits(
                                pack.priceId,
                                `${pack.credits} Credits`,
                              )
                            }
                            disabled={isLoading === pack.priceId}
                            className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white"
                          >
                            {isLoading === pack.priceId ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-2" />
                                Buy Credits
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Model Usage Multipliers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  AI Model Credit Costs
                </CardTitle>
                <CardDescription>
                  Different AI models consume credits at different rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-zinc-900 dark:text-white">
                      OpenAI Models
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                        <div>
                          <span className="font-medium text-zinc-900 dark:text-white">
                            GPT-4o-mini
                          </span>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Fast & efficient
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        >
                          1x credits
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                        <div>
                          <span className="font-medium text-zinc-900 dark:text-white">
                            GPT-4o
                          </span>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Most capable
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                        >
                          15x credits
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                        <div>
                          <span className="font-medium text-zinc-900 dark:text-white">
                            GPT-4-Turbo
                          </span>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Previous generation
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                        >
                          30x credits
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold text-zinc-900 dark:text-white">
                      Anthropic Models
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                        <div>
                          <span className="font-medium text-zinc-900 dark:text-white">
                            Claude-3 Haiku
                          </span>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Fast & affordable
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        >
                          1x credits
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                        <div>
                          <span className="font-medium text-zinc-900 dark:text-white">
                            Claude-3.5 Sonnet
                          </span>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Balanced performance
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          10x credits
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                        <div>
                          <span className="font-medium text-zinc-900 dark:text-white">
                            Claude-3 Opus
                          </span>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Most powerful
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        >
                          50x credits
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Credit Calculation
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        Credits are calculated based on token usage and model
                        pricing. Higher-tier models provide better reasoning but
                        consume more credits per token.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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
