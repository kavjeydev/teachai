"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Rocket, Building, ArrowRight } from "lucide-react";
import { PRICING_TIERS, formatTokens } from "@/lib/stripe";
import { toast } from "sonner";
import { getStripe } from "@/lib/stripe";

interface UpgradeTierCardsProps {
  currentTier?: string;
  compact?: boolean;
}

export function UpgradeTierCards({
  currentTier = "free",
  compact = false,
}: UpgradeTierCardsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleUpgrade = async (priceId: string | null, tierName: string) => {
    console.log("handleUpgrade called:", { priceId, tierName }); // Debug log

    if (!priceId) {
      if (tierName === "Enterprise") {
        window.open(
          "mailto:hello@trainly.ai?subject=Enterprise%20Inquiry",
          "_blank",
        );
      } else {
        toast.error(
          `${tierName} plan is not configured. Please contact support.`,
        );
      }
      return;
    }

    setIsLoading(priceId);

    try {
      console.log("Making checkout request..."); // Debug log
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId, mode: "subscription" }),
      });

      console.log("Checkout response:", response.status); // Debug log

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Checkout error:", errorData);

        // Handle specific error cases
        if (response.status === 400 && errorData.currentTier) {
          toast.error(
            `You already have an active ${errorData.currentTier} subscription. Use the billing portal to change plans.`,
          );
          return;
        }

        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const { sessionId, url } = await response.json();
      console.log("Got checkout URL:", url); // Debug log

      if (url) {
        window.open(url, "_blank");
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

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "pro":
        return <Zap className="w-5 h-5" />;
      case "scale":
        return <Rocket className="w-5 h-5" />;
      case "enterprise":
        return <Building className="w-5 h-5" />;
      default:
        return <Crown className="w-5 h-5" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
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

  const availableTiers = [
    PRICING_TIERS.PRO,
    PRICING_TIERS.SCALE,
    PRICING_TIERS.ENTERPRISE,
  ].filter((tier) => tier.id !== currentTier);

  // Debug log to check priceIds
  React.useEffect(() => {
    console.log(
      "Available tiers:",
      availableTiers.map((tier) => ({
        name: tier.name,
        priceId: tier.priceId,
        id: tier.id,
      })),
    );
  }, [availableTiers]);

  if (compact) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableTiers.map((tier) => (
          <Card
            key={tier.id}
            className="relative border-2 hover:border-amber-400/50 transition-all duration-200"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 bg-gradient-to-br ${getTierColor(tier.id)} rounded-xl flex items-center justify-center text-white`}
                >
                  {getTierIcon(tier.id)}
                </div>
                <div>
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {typeof tier.price === "number"
                      ? `$${tier.price}/month`
                      : tier.price}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>
                    {typeof tier.features.credits === "number"
                      ? formatTokens(tier.features.credits)
                      : tier.features.credits}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>
                    {tier.limits?.maxChats === -1
                      ? "Unlimited"
                      : tier.limits?.maxChats}{" "}
                    chats
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>{tier.features.fileStorage}</span>
                </div>
              </div>
              <Button
                onClick={() => handleUpgrade(tier.priceId || null, tier.name)}
                disabled={isLoading === tier.priceId}
                className="w-full"
                variant={tier.popular ? "default" : "outline"}
              >
                {isLoading === tier.priceId ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    {tier.id === "enterprise"
                      ? "Contact Sales"
                      : `Upgrade to ${tier.name}`}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {availableTiers.map((tier) => (
        <Card
          key={tier.id}
          className={`relative border-2 transition-all duration-200 ${
            tier.popular
              ? "border-amber-400 shadow-lg shadow-amber-400/25"
              : "border-zinc-200 dark:border-zinc-700 hover:border-amber-400/50"
          }`}
        >
          {tier.popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-white px-3 py-1">
                Most Popular
              </Badge>
            </div>
          )}

          <CardHeader className="text-center pb-4">
            <div
              className={`w-16 h-16 bg-gradient-to-br ${getTierColor(tier.id)} rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg`}
            >
              {getTierIcon(tier.id)}
            </div>
            <CardTitle className="text-2xl">{tier.name}</CardTitle>
            <div className="text-3xl font-bold">
              {typeof tier.price === "number" ? `$${tier.price}` : tier.price}
              {typeof tier.price === "number" && (
                <span className="text-lg font-normal text-muted-foreground">
                  /month
                </span>
              )}
            </div>
            <CardDescription className="text-base">
              {tier.description}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span>
                  {typeof tier.features.credits === "number"
                    ? formatTokens(tier.features.credits)
                    : tier.features.credits}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span>
                  {tier.limits?.maxChats === -1
                    ? "Unlimited"
                    : tier.limits?.maxChats}{" "}
                  chats
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span>{tier.features.projects} projects</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span>{tier.features.fileStorage}</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span>{tier.features.support}</span>
              </div>
            </div>

            <Button
              onClick={() => handleUpgrade(tier.priceId || null, tier.name)}
              disabled={isLoading === tier.priceId}
              className={`w-full ${tier.popular ? "bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-400/90 hover:to-amber-600/90" : ""}`}
              variant={tier.popular ? "default" : "outline"}
            >
              {isLoading === tier.priceId ? (
                <>
                  <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  {tier.id === "enterprise"
                    ? "Contact Sales"
                    : `Upgrade to ${tier.name}`}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
