"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NextUIProvider } from "@nextui-org/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  X,
  Zap,
  Code,
  Users,
  Crown,
  Rocket,
  Star,
  ArrowRight,
  Building,
  Play,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import Navbar from "@/app/components/navbar";
import { PRICING_TIERS, formatTokens } from "@/lib/stripe";
import { getStripe } from "@/lib/stripe";

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleUpgrade = async (priceId: string | null, tierName: string) => {
    if (!priceId) {
      // Free tier or Enterprise - redirect to sign up or contact
      if (tierName === "Enterprise") {
        window.location.href =
          "mailto:hello@trainly.ai?subject=Enterprise%20Inquiry";
      } else {
        window.location.href = "/sign-up";
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

      const { sessionId, url } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        const stripe = await getStripe();
        await stripe?.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error("Checkout failed:", error);
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

  return (
    <NextUIProvider>
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <Navbar />
        <div className="pt-32 pb-20">
          <div className="max-w-7xl mx-auto px-6">
            {/* Header */}
            <div className="text-center mb-20">
              <h1 className="text-5xl md:text-6xl font-medium text-zinc-900 dark:text-white mb-6 tracking-tight">
                Simple, transparent pricing
              </h1>
              <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                Start free and scale as you grow. No hidden fees, no surprises.
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="max-w-6xl mx-auto mb-20 py-6">
              <div className="border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-200 dark:bg-zinc-800 rounded-2xl">
                  {tiers.map((tier, index) => (
                    <div
                      key={tier.id}
                      className={cn(
                        "relative bg-white dark:bg-zinc-900 p-8",
                        !tier.popular &&
                          index === 0 &&
                          "rounded-tl-2xl md:rounded-bl-2xl md:rounded-tr-none lg:rounded-tr-none",
                        !tier.popular &&
                          index === 1 &&
                          "md:rounded-tr-2xl lg:rounded-tr-none lg:rounded-none",
                        !tier.popular &&
                          index === 2 &&
                          "lg:rounded-none md:rounded-bl-2xl lg:rounded-bl-none",
                        !tier.popular &&
                          index === 3 &&
                          "rounded-br-2xl lg:rounded-tr-2xl md:rounded-tr-none lg:rounded-bl-none",
                        tier.popular &&
                          "pt-12 pb-12 -my-0 dark:bg-zinc-800 shadow-xl rounded-2xl shadow-zinc-200/50 dark:shadow-zinc-900/50 ring-1 ring-zinc-900 dark:ring-zinc-600 z-10 scale-105 lg:scale-105",
                      )}
                    >
                      <div className="mb-8">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                          {tier.name}
                        </h3>

                        <div className="mb-4">
                          {typeof tier.price === "number" ? (
                            <div className="flex items-baseline">
                              <span className="text-4xl font-bold text-zinc-900 dark:text-white">
                                ${tier.price}
                              </span>
                              <span className="text-zinc-500 dark:text-zinc-400 ml-1">
                                /month
                              </span>
                            </div>
                          ) : (
                            <div className="text-4xl font-bold text-zinc-900 dark:text-white">
                              {tier.price}
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          {tier.description}
                        </p>
                      </div>

                      {/* CTA Button */}
                      <div className="mb-8">
                        <button
                          onClick={() =>
                            handleUpgrade(tier.priceId || null, tier.name)
                          }
                          disabled={isLoading === tier.priceId}
                          className={cn(
                            "w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200",
                            tier.popular
                              ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700",
                          )}
                        >
                          {isLoading === tier.priceId ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                              Loading...
                            </div>
                          ) : tier.id === "free" ? (
                            "Get started"
                          ) : tier.id === "enterprise" ? (
                            "Contact sales"
                          ) : (
                            "Get started"
                          )}
                        </button>
                      </div>

                      {/* Features List */}
                      <div className="space-y-4">
                        <div className="text-xs font-medium text-zinc-900 dark:text-white uppercase tracking-wide">
                          What's included
                        </div>

                        <div className="space-y-3 text-sm">
                          <div className="flex items-start gap-3">
                            <Check className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <span className="text-zinc-700 dark:text-zinc-300">
                              {typeof tier.features.credits === "number"
                                ? `${tier.features.credits.toLocaleString()} AI credits`
                                : tier.features.credits}
                            </span>
                          </div>

                          <div className="flex items-start gap-3">
                            <Check className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <span className="text-zinc-700 dark:text-zinc-300">
                              {typeof tier.features.projects === "number"
                                ? `${tier.features.projects} project${tier.features.projects > 1 ? "s" : ""}`
                                : tier.features.projects}
                            </span>
                          </div>

                          <div className="flex items-start gap-3">
                            <Check className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <span className="text-zinc-700 dark:text-zinc-300">
                              {typeof tier.features.teamMembers === "number"
                                ? `${tier.features.teamMembers} team member${tier.features.teamMembers > 1 ? "s" : ""}`
                                : tier.features.teamMembers}
                            </span>
                          </div>

                          <div className="flex items-start gap-3">
                            <Check className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <span className="text-zinc-700 dark:text-zinc-300">
                              {tier.features.fileStorage}
                            </span>
                          </div>

                          <div className="flex items-start gap-3">
                            <Check className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <span className="text-zinc-700 dark:text-zinc-300">
                              {typeof tier.features.graphNodes === "number"
                                ? `Up to ${tier.features.graphNodes.toLocaleString()} nodes`
                                : `${tier.features.graphNodes} nodes`}
                            </span>
                          </div>

                          <div className="flex items-start gap-3">
                            <Check className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <span className="text-zinc-700 dark:text-zinc-300">
                              {tier.features.graphViz}
                            </span>
                          </div>

                          {tier.features.apiAccess && (
                            <div className="flex items-start gap-3">
                              <Check className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                              <span className="text-zinc-700 dark:text-zinc-300">
                                API & SDK access
                              </span>
                            </div>
                          )}

                          {(tier.features as any).customBranding && (
                            <div className="flex items-start gap-3">
                              <Check className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                              <span className="text-zinc-700 dark:text-zinc-300">
                                Custom branding
                              </span>
                            </div>
                          )}

                          {(tier.features as any).priorityAPI && (
                            <div className="flex items-start gap-3">
                              <Check className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                              <span className="text-zinc-700 dark:text-zinc-300">
                                Priority API throughput
                              </span>
                            </div>
                          )}

                          {(tier.features as any).sso && (
                            <div className="flex items-start gap-3">
                              <Check className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                              <span className="text-zinc-700 dark:text-zinc-300">
                                SSO integration
                              </span>
                            </div>
                          )}

                          <div className="flex items-start gap-3">
                            <Check className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <span className="text-zinc-700 dark:text-zinc-300">
                              {tier.features.support}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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

              <div className="bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        <th className="text-left py-4 px-6 font-medium text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-900/50">
                          Features
                        </th>
                        {tiers.map((tier) => (
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
                        {tiers.map((tier) => (
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
                          Projects
                        </td>
                        {tiers.map((tier) => (
                          <td
                            key={tier.id}
                            className="py-4 px-4 text-center text-zinc-600 dark:text-zinc-400"
                          >
                            {tier.features.projects}
                          </td>
                        ))}
                      </tr>

                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-4 px-6 font-medium text-zinc-700 dark:text-zinc-300">
                          Team members
                        </td>
                        {tiers.map((tier) => (
                          <td
                            key={tier.id}
                            className="py-4 px-4 text-center text-zinc-600 dark:text-zinc-400"
                          >
                            {tier.features.teamMembers}
                          </td>
                        ))}
                      </tr>

                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-4 px-6 font-medium text-zinc-700 dark:text-zinc-300">
                          File storage
                        </td>
                        {tiers.map((tier) => (
                          <td
                            key={tier.id}
                            className="py-4 px-4 text-center text-zinc-600 dark:text-zinc-400"
                          >
                            {tier.features.fileStorage}
                          </td>
                        ))}
                      </tr>

                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-4 px-6 font-medium text-zinc-700 dark:text-zinc-300">
                          Graph nodes
                        </td>
                        {tiers.map((tier) => (
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
                        {tiers.map((tier) => (
                          <td key={tier.id} className="py-4 px-4 text-center">
                            {tier.features.apiAccess ? (
                              <Check className="w-5 h-5 text-amber-500 mx-auto" />
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
                        {tiers.map((tier) => (
                          <td key={tier.id} className="py-4 px-4 text-center">
                            {(tier.features as any).customBranding ? (
                              <Check className="w-5 h-5 text-amber-500 mx-auto" />
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
                        {tiers.map((tier) => (
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
                <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
                  Frequently asked questions
                </h3>
              </div>

              <div className="space-y-8">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-8">
                  <h4 className="font-medium text-zinc-900 dark:text-white mb-3">
                    How do AI Credits work?
                  </h4>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    AI Credits are consumed based on token usage. 1 credit
                    equals approximately 1,000 tokens on GPT-4o-mini. More
                    powerful models consume more credits per token. Unused
                    credits roll over monthly.
                  </p>
                </div>

                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-8">
                  <h4 className="font-medium text-zinc-900 dark:text-white mb-3">
                    Can I change my plan at any time?
                  </h4>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Yes. You can upgrade or downgrade your plan at any time.
                    Upgrades take effect immediately, while downgrades take
                    effect at your next billing cycle.
                  </p>
                </div>

                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-8">
                  <h4 className="font-medium text-zinc-900 dark:text-white mb-3">
                    What happens to my data if I downgrade?
                  </h4>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Your data is always safe and never deleted. If you exceed
                    limits after downgrading, you'll have read-only access until
                    you upgrade or reduce usage.
                  </p>
                </div>

                <div className="pb-8">
                  <h4 className="font-medium text-zinc-900 dark:text-white mb-3">
                    Do you offer educational discounts?
                  </h4>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Yes, we offer 50% discounts for students and educators.
                    Contact us with your .edu email address for verification.
                  </p>
                </div>
              </div>
            </div>

            {/* Final CTA */}
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
                Ready to get started?
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-lg mx-auto">
                Start building with Trainly today. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => (window.location.href = "/sign-up")}
                  className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                  Get started for free
                </button>
                <button
                  onClick={() =>
                    (window.location.href =
                      "mailto:hello@trainly.ai?subject=Enterprise%20Inquiry")
                  }
                  className="border border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                  Contact sales
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NextUIProvider>
  );
}
