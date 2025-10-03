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
import {
  AlertCircle,
  Crown,
  Zap,
  Rocket,
  ArrowRight,
  X,
  MessageCircle,
  Archive,
} from "lucide-react";
import { PRICING_TIERS } from "@/lib/stripe";
import { toast } from "sonner";
import { getStripe } from "@/lib/stripe";

interface ChatLimitWarningProps {
  currentTier: string;
  currentChatCount: number;
  chatLimit: number;
  onDismiss?: () => void;
  compact?: boolean;
}

export function ChatLimitWarning({
  currentTier,
  currentChatCount,
  chatLimit,
  onDismiss,
  compact = false,
}: ChatLimitWarningProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleUpgrade = async (priceId: string | null, tierName: string) => {
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

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) return null;

  const getNextTier = () => {
    if (currentTier === "free") return PRICING_TIERS.PRO;
    if (currentTier === "pro") return PRICING_TIERS.SCALE;
    return PRICING_TIERS.ENTERPRISE;
  };

  const nextTier = getNextTier();

  if (compact) {
    return (
      <Card className="border-2 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Chat Limit Reached
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                You've used {currentChatCount} of {chatLimit} chat
                {chatLimit > 1 ? "s" : ""} on the {currentTier} plan.
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={() =>
                    handleUpgrade(nextTier.priceId || null, nextTier.name)
                  }
                  disabled={isUpgrading}
                  size="sm"
                  className="bg-amber-400 hover:bg-amber-400/90 text-amber-900"
                >
                  {isUpgrading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Crown className="w-3 h-3 mr-2" />
                      Upgrade to {nextTier.name}
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => window.open("/dashboard/manage", "_blank")}
                  variant="outline"
                  size="sm"
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  <Archive className="w-3 h-3 mr-2" />
                  Archive Chats
                </Button>
              </div>
            </div>
            {onDismiss && (
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-amber-600 hover:text-amber-700"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center text-white">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-amber-800 dark:text-amber-200">
                Chat Limit Reached
              </CardTitle>
              <CardDescription className="text-amber-700 dark:text-amber-300">
                You've used {currentChatCount} of {chatLimit} chat
                {chatLimit > 1 ? "s" : ""} on the {currentTier} plan
              </CardDescription>
            </div>
          </div>
          {onDismiss && (
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border border-amber-200 dark:border-amber-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                {nextTier.id === "pro" ? (
                  <Zap className="w-5 h-5 text-blue-500" />
                ) : nextTier.id === "scale" ? (
                  <Rocket className="w-5 h-5 text-purple-500" />
                ) : (
                  <Crown className="w-5 h-5 text-emerald-500" />
                )}
                <div>
                  <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                    {nextTier.name}
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {typeof nextTier.price === "number"
                      ? `$${nextTier.price}/month`
                      : nextTier.price}
                  </p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
                  <MessageCircle className="w-4 h-4" />
                  <span>
                    {nextTier.limits?.maxChats === -1
                      ? "Unlimited"
                      : nextTier.limits?.maxChats}{" "}
                    chats
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
                  <Crown className="w-4 h-4" />
                  <span>{nextTier.features.fileStorage}</span>
                </div>
              </div>
              <Button
                onClick={() =>
                  handleUpgrade(nextTier.priceId || null, nextTier.name)
                }
                disabled={isUpgrading}
                className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-400/90 hover:to-amber-600/90 text-white"
              >
                {isUpgrading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    Upgrade to {nextTier.name}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-amber-200 dark:border-amber-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Archive className="w-5 h-5 text-amber-600" />
                <div>
                  <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                    Archive Old Chats
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Free up space without upgrading
                  </p>
                </div>
              </div>
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
                Archive chats you no longer need to create new ones within your
                current plan.
              </p>
              <Button
                onClick={() => window.open("/dashboard/manage", "_blank")}
                variant="outline"
                className="w-full border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-900/30"
              >
                <Archive className="w-4 h-4 mr-2" />
                Manage Chats
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => window.open("/pricing", "_blank")}
            variant="ghost"
            size="sm"
            className="text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200"
          >
            View All Plans
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
