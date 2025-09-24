"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Crown, CreditCard, X } from "lucide-react";
import { getStripe } from "@/lib/stripe";
import { toast } from "sonner";

interface CreditWarningProps {
  onDismiss?: () => void;
}

export function CreditWarning({ onDismiss }: CreditWarningProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const credits = useQuery(api.subscriptions.getUserCredits);
  const subscription = useQuery(api.subscriptions.getUserSubscription);

  const handleUpgrade = async () => {
    setIsUpgrading(true);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
          mode: 'subscription'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId, url } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        const stripe = await getStripe();
        await stripe?.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      toast.error('Failed to start checkout process');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Don't show if dismissed or if we don't have credit data
  if (isDismissed || !credits) return null;

  const usagePercent = (credits.usedCredits / credits.totalCredits) * 100;
  const isLowCredits = usagePercent > 80;
  const isVeryLowCredits = usagePercent > 95;

  // Only show warning if credits are low
  if (!isLowCredits) return null;

  return (
    <Card className={`border-2 ${isVeryLowCredits ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'} mb-4`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-5 h-5 mt-0.5 ${isVeryLowCredits ? 'text-red-600' : 'text-amber-600'}`} />
          <div className="flex-1">
            <h4 className={`font-semibold mb-1 ${isVeryLowCredits ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'}`}>
              {isVeryLowCredits ? 'Credits Almost Depleted!' : 'Running Low on Credits'}
            </h4>
            <p className={`text-sm mb-3 ${isVeryLowCredits ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>
              You've used {Math.round(usagePercent)}% of your monthly credits ({credits.usedCredits.toLocaleString()} / {credits.totalCredits.toLocaleString()}).
              {isVeryLowCredits
                ? ' Your next AI request may fail without more credits.'
                : ' Consider upgrading to avoid interruptions.'
              }
            </p>
            <div className="flex gap-2">
              {subscription?.tier === 'free' ? (
                <Button
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  size="sm"
                  className="bg-amber-400 hover:bg-amber-400/90"
                >
                  {isUpgrading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Crown className="w-3 h-3 mr-2" />
                      Upgrade to Pro - $39/mo
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => window.open('/billing', '_blank')}
                  size="sm"
                  className="bg-amber-400 hover:bg-amber-400/90"
                >
                  <CreditCard className="w-3 h-3 mr-2" />
                  Buy More Credits
                </Button>
              )}
              <Button
                onClick={() => window.open('/billing', '_blank')}
                variant="outline"
                size="sm"
              >
                View All Plans
              </Button>
            </div>
          </div>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
