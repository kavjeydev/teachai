"use client";
import { useState, Suspense, useEffect } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, Code, Crown, Building, Play, TrendingUp } from "lucide-react";
import { PRICING_TIERS } from "@/lib/stripe";
import { getStripe } from "@/lib/stripe";
import { captureEvent } from "@/lib/posthog";
import { useAuthState } from "@/hooks/use-auth-state";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { SignInButton, SignUpButton } from "@clerk/nextjs";

// Dynamic import for heavy Navbar component (uses NextUI)
const Navbar = dynamic(() => import("@/app/components/navbar"), {
  ssr: false,
  loading: () => <div className="h-16" />, // Placeholder height
});

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const authState = useAuthState();

  // Only query subscription if user is signed in
  const currentSubscription = useQuery(
    api.subscriptions.getSubscriptionByUserId,
    authState.isSignedIn && authState.user
      ? { userId: authState.user.id }
      : "skip",
  );

  const handleUpgrade = async (priceId: string | null, tierName: string) => {
    if (!priceId) {
      // Handle Enterprise tier
      if (tierName === "Enterprise") {
        window.location.href =
          "mailto:kavin11205@gmail.com?subject=Enterprise%20Inquiry";
        return;
      }

      // Handle Free tier
      if (tierName === "Free") {
        // Check if user is authenticated
        if (!authState.isSignedIn || !authState.user) {
          // Not signed in - this will be handled by the button click (Clerk SignUpButton)
          return;
        }

        // User is signed in - check if they already have free tier
        if (
          currentSubscription &&
          "tier" in currentSubscription &&
          currentSubscription.tier === "free" &&
          "status" in currentSubscription &&
          currentSubscription.status === "active"
        ) {
          toast.info(
            "You already have an active Free subscription! Redirecting to dashboard.",
          );
          window.location.href = "/dashboard";
          return;
        }

        // User is signed in but doesn't have free tier - they're already signed up!
        // Just redirect to dashboard since they can use the free tier
        window.location.href = "/dashboard";
        return;
      }

      return;
    }

    // Check if user is authenticated
    if (!authState.isSignedIn || !authState.user) {
      // Store the intended upgrade in localStorage for after sign-in
      localStorage.setItem(
        "pendingUpgrade",
        JSON.stringify({
          priceId,
          tierName,
          timestamp: Date.now(),
        }),
      );
      // This will be handled by the Clerk SignUpButton - don't redirect
      return;
    }

    // Check if user already has this subscription
    if (
      currentSubscription &&
      "tier" in currentSubscription &&
      currentSubscription.tier === tierName.toLowerCase() &&
      "status" in currentSubscription &&
      currentSubscription.status === "active"
    ) {
      toast.info(
        `You already have an active ${tierName} subscription! Redirecting to dashboard.`,
      );
      window.location.href = "/dashboard";
      return;
    }

    setIsLoading(tierName.toLowerCase());

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId, mode: "subscription" }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle specific case where user already has an active subscription
        if (
          errorData.error &&
          errorData.error.includes("already have an active") &&
          errorData.error.includes("subscription")
        ) {
          toast.info(errorData.error);
          return;
        }

        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const { sessionId, url, error } = await response.json();

      if (error) {
        // Handle specific case where user already has an active subscription
        if (
          error.includes("already have an active") &&
          error.includes("subscription")
        ) {
          toast.info(error);
          return;
        }
        throw new Error(error);
      }

      // Track upgrade initiated in PostHog
      captureEvent("upgrade_initiated", {
        tier: tierName,
        priceId: priceId,
        source: "pricing_page",
      });

      if (url) {
        window.location.href = url;
      } else if (sessionId) {
        const stripe = await getStripe();
        if (!stripe) {
          throw new Error("Stripe failed to load");
        }
        await stripe.redirectToCheckout({ sessionId });
      } else {
        throw new Error("No checkout session or URL received");
      }
    } catch (error) {
      console.error("Checkout failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to start checkout: ${errorMessage}`);
    } finally {
      setIsLoading(null);
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "free":
        return <Play className="w-6 h-6" />;
      case "pro":
        return <Code className="w-6 h-6" />;
      case "scale":
        return <TrendingUp className="w-6 h-6" />;
      case "enterprise":
        return <Building className="w-6 h-6" />;
      default:
        return <Crown className="w-6 h-6" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "free":
        return "from-zinc-500 to-zinc-600";
      case "pro":
        return "from-blue-500 to-blue-600";
      case "scale":
        return "from-purple-500 to-purple-600";
      case "enterprise":
        return "from-emerald-500 to-emerald-600";
      default:
        return "from-zinc-500 to-zinc-600";
    }
  };

  const tiers = [
    PRICING_TIERS.FREE,
    PRICING_TIERS.PRO,
    PRICING_TIERS.SCALE,
    PRICING_TIERS.ENTERPRISE,
  ];

  // Calculate annual pricing (2 months free = 10/12 of monthly)
  const getDisplayPrice = (tier: typeof PRICING_TIERS.PRO) => {
    if (typeof tier.price === "number") {
      return billingPeriod === "annual" 
        ? Math.round(tier.price * 10) // 10 months for annual
        : tier.price;
    }
    return tier.price;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Suspense fallback={<div className="h-16" />}>
        <Navbar />
      </Suspense>
      <Toaster position="bottom-right" richColors />
      <div className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-semibold text-zinc-900 dark:text-white mb-4">
              Upgrade Plan
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Trainly pricing plans are designed to meet your needs as you grow.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={cn(
                  "px-6 py-2 rounded-md text-sm font-medium transition-all",
                  billingPeriod === "monthly"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("annual")}
                className={cn(
                  "px-6 py-2 rounded-md text-sm font-medium transition-all",
                  billingPeriod === "annual"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                )}
              >
                Annual (Save 17%)
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="max-w-6xl mx-auto mb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tiers.filter(t => t.id !== "free").map((tier) => {
                const displayPrice = getDisplayPrice(tier);
                const isCurrentPlan = currentSubscription &&
                  "tier" in currentSubscription &&
                  currentSubscription.tier === tier.id &&
                  "status" in currentSubscription &&
                  currentSubscription.status === "active";
                
                return (
                  <div
                    key={tier.id}
                    className={cn(
                      "relative bg-white dark:bg-zinc-900 rounded-xl shadow-sm border-2 p-8 flex flex-col",
                      tier.popular
                        ? "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20"
                        : "border-zinc-200 dark:border-zinc-800"
                    )}
                  >
                    {/* Popular Badge */}
                    {tier.popular && (
                      <div className="absolute -top-3 right-4">
                        <div className="bg-amber-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Popular
                        </div>
                      </div>
                    )}

                    {/* Header */}
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                        {tier.name}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                        {tier.description}
                      </p>
                      
                      {/* Price */}
                      <div className="mb-2">
                        {typeof displayPrice === "number" ? (
                          <div className="flex items-baseline">
                            <span className="text-4xl font-bold text-zinc-900 dark:text-white">
                              ${displayPrice}
                            </span>
                            {billingPeriod === "annual" && (
                              <span className="text-lg font-normal text-zinc-500 dark:text-zinc-400 ml-2">
                                /year
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-4xl font-bold text-zinc-900 dark:text-white">
                            {displayPrice}
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {billingPeriod === "annual" 
                          ? "Per user, per year & billed annually"
                          : typeof tier.price === "number"
                          ? "Per user & per month"
                          : "Custom Pricing, Custom Billing"}
                      </p>
                    </div>

                    {/* CTA Button */}
                    <div className="mb-6">
                      {!authState.isSignedIn && tier.id === "enterprise" ? (
                        <button
                          onClick={() => {
                            window.location.href =
                              "mailto:kavin11205@gmail.com?subject=Enterprise%20Inquiry";
                          }}
                          className="w-full bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-zinc-800 dark:hover:bg-zinc-700 py-3 px-4 rounded-lg font-medium transition-colors"
                          type="button"
                        >
                          Contact Sales
                        </button>
                      ) : !authState.isSignedIn ? (
                        <SignInButton mode="modal">
                          <button
                            className={cn(
                              "w-full py-3 px-4 rounded-lg font-medium transition-colors",
                              tier.popular
                                ? "bg-white border-2 border-amber-600 text-amber-600 hover:bg-amber-50"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700"
                            )}
                            type="button"
                          >
                            {isCurrentPlan ? "Current Plan" : `Switch to this Plan`}
                          </button>
                        </SignInButton>
                      ) : (
                        <button
                          onClick={() =>
                            handleUpgrade(tier.priceId || null, tier.name)
                          }
                          disabled={isLoading === tier.id || isCurrentPlan}
                          className={cn(
                            "w-full py-3 px-4 rounded-lg font-medium transition-colors",
                            isCurrentPlan
                              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                              : tier.popular
                                ? "bg-white border-2 border-amber-600 text-amber-600 hover:bg-amber-50"
                                : tier.id === "enterprise"
                                  ? "bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-zinc-800 dark:hover:bg-zinc-700"
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700"
                          )}
                        >
                          {isLoading === tier.id ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                              Processing...
                            </div>
                          ) : isCurrentPlan ? (
                            "Current Plan"
                          ) : tier.id === "enterprise" ? (
                            "Contact Sales"
                          ) : (
                            `Switch to this Plan`
                          )}
                        </button>
                      )}
                      
                      {/* Trial Text */}
                      {!isCurrentPlan && tier.id !== "enterprise" && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center underline cursor-pointer">
                          Start Free 7-Days Trial
                        </p>
                      )}
                      {tier.id === "enterprise" && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center underline cursor-pointer">
                          Start Free 15-Days Trial
                        </p>
                      )}
                    </div>

                    {/* Features List */}
                    <div className="mt-auto">
                      <div className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
                        Features
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                        {tier.id === "pro" 
                          ? "Everything in our free plan includes."
                          : tier.id === "scale"
                          ? "Everything in Free & Pro."
                          : "Everything in Free, Pro & Scale."}
                      </p>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          </div>
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            {typeof tier.features.credits === "number"
                              ? `${tier.features.credits.toLocaleString()} AI Credits`
                              : tier.features.credits}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          </div>
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            {tier.features.monthlyIngestionTokens}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          </div>
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            {typeof tier.features.graphNodes === "number"
                              ? `Up to ${tier.features.graphNodes.toLocaleString()} Graph Nodes`
                              : `${tier.features.graphNodes} Graph Nodes`}
                          </span>
                        </div>

                        {tier.features.apiAccess && (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            </div>
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                              API & SDK Access
                            </span>
                          </div>
                        )}

                        {(tier.features as any).customBranding && (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            </div>
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                              Custom Branding
                            </span>
                          </div>
                        )}

                        {(tier.features as any).priorityAPI && (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            </div>
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                              Priority API Throughput
                            </span>
                          </div>
                        )}

                        {(tier.features as any).sso && (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            </div>
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                              SSO Integration
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          </div>
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            {tier.features.support}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feature Comparison */}
          <div className="max-w-6xl mx-auto mb-16">
            <div className="text-center mb-12">
              <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
                Compare plans
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Choose the right plan for your team
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="text-left py-4 px-6 font-medium text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-900/50">
                        Features
                      </th>
                      {tiers.filter(t => t.id !== "free").map((tier) => (
                        <th
                          key={tier.id}
                          className="text-center py-4 px-4 font-medium text-zinc-900 dark:text-white min-w-[140px] bg-zinc-50 dark:bg-zinc-900/50"
                        >
                          {tier.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="py-4 px-6 font-medium text-zinc-700 dark:text-zinc-300">
                        AI Credits
                      </td>
                      {tiers.filter(t => t.id !== "free").map((tier) => (
                        <td
                          key={tier.id}
                          className="py-4 px-4 text-center text-zinc-600 dark:text-zinc-400"
                        >
                          {typeof tier.features.credits === "number"
                            ? tier.features.credits.toLocaleString()
                            : tier.features.credits}
                        </td>
                      ))}
                    </tr>

                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="py-4 px-6 font-medium text-zinc-700 dark:text-zinc-300">
                        Knowledge Units/month
                      </td>
                      {tiers.filter(t => t.id !== "free").map((tier) => (
                        <td
                          key={tier.id}
                          className="py-4 px-4 text-center text-zinc-600 dark:text-zinc-400"
                        >
                          {tier.features.monthlyIngestionTokens}
                        </td>
                      ))}
                    </tr>

                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="py-4 px-6 font-medium text-zinc-700 dark:text-zinc-300">
                        Graph nodes
                      </td>
                      {tiers.filter(t => t.id !== "free").map((tier) => (
                        <td
                          key={tier.id}
                          className="py-4 px-4 text-center text-zinc-600 dark:text-zinc-400"
                        >
                          {typeof tier.features.graphNodes === "number"
                            ? tier.features.graphNodes.toLocaleString()
                            : tier.features.graphNodes}
                        </td>
                      ))}
                    </tr>

                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="py-4 px-6 font-medium text-zinc-700 dark:text-zinc-300">
                        API access
                      </td>
                      {tiers.filter(t => t.id !== "free").map((tier) => (
                        <td key={tier.id} className="py-4 px-4 text-center">
                          {tier.features.apiAccess ? (
                            <Check className="w-5 h-5 text-amber-600 dark:text-amber-400 mx-auto" />
                          ) : (
                            <div className="w-5 h-5 mx-auto"></div>
                          )}
                        </td>
                      ))}
                    </tr>

                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="py-4 px-6 font-medium text-zinc-700 dark:text-zinc-300">
                        Custom branding
                      </td>
                      {tiers.filter(t => t.id !== "free").map((tier) => (
                        <td key={tier.id} className="py-4 px-4 text-center">
                          {(tier.features as any).customBranding ? (
                            <Check className="w-5 h-5 text-amber-600 dark:text-amber-400 mx-auto" />
                          ) : (
                            <div className="w-5 h-5 mx-auto"></div>
                          )}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="py-4 px-6 font-medium text-zinc-700 dark:text-zinc-300">
                        Support
                      </td>
                      {tiers.filter(t => t.id !== "free").map((tier) => (
                        <td
                          key={tier.id}
                          className="py-4 px-4 text-center text-zinc-600 dark:text-zinc-400"
                        >
                          {tier.features.support}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto mb-20">
            <div className="text-center mb-12">
              <h3 className="text-2xl font-semibold text-white mb-4">
                Frequently asked questions
              </h3>
            </div>

            <div className="space-y-8">
              <div className="border-b border-white/20 pb-8">
                <h4 className="font-medium text-white mb-3">
                  How do AI Credits work?
                </h4>
                <p className="text-white/60 leading-relaxed">
                  AI Credits are consumed based on token usage. 1 credit equals
                  approximately 1,000 tokens on GPT-4o-mini. More powerful
                  models consume more credits per token. Unused credits roll
                  over monthly.
                </p>
              </div>

              <div className="border-b border-white/20 pb-8">
                <h4 className="font-medium text-white mb-3">
                  Can I change my plan at any time?
                </h4>
                <p className="text-white/60 leading-relaxed">
                  Yes. You can upgrade or downgrade your plan at any time.
                  Upgrades take effect immediately, while downgrades take effect
                  at your next billing cycle.
                </p>
              </div>

              <div className="border-b border-white/20 pb-8">
                <h4 className="font-medium text-white mb-3">
                  What happens to my data if I downgrade?
                </h4>
                <p className="text-white/60 leading-relaxed">
                  Your data is always safe and never deleted. If you exceed
                  limits after downgrading, you'll have read-only access until
                  you upgrade or reduce usage.
                </p>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-white mb-4">
              Ready to get started?
            </h3>
            <p className="text-white/60 mb-8 max-w-lg mx-auto">
              Start building with Trainly today. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => (window.location.href = "/sign-up")}
                className="bg-white text-black hover:bg-zinc-100 px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                Get started for free
              </button>
              <button
                onClick={() =>
                  (window.location.href =
                    "mailto:kavin11205@gmail.com?subject=Enterprise%20Inquiry")
                }
                className="border border-white/20 hover:border-white/40 text-white hover:text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                Contact sales
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
