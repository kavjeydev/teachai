"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Crown,
  Zap,
  Users,
  Rocket,
  Check,
  CreditCard,
  TrendingUp,
  Calendar,
  AlertCircle
} from "lucide-react";
import { PRICING_TIERS, formatCredits, formatTokens } from "@/lib/stripe";
import { toast } from "sonner";
import { getStripe } from "@/lib/stripe";

export function SubscriptionManager() {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const subscription = useQuery(api.subscriptions.getUserSubscription);
  const credits = useQuery(api.subscriptions.getUserCredits);

  const handleUpgrade = async (priceId: string, tierName: string) => {
    setIsLoading(priceId);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId, mode: 'subscription' }),
      });

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
      setIsLoading(null);
    }
  };

  const handleBuyCredits = async (priceId: string, packName: string) => {
    setIsLoading(priceId);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId, mode: 'payment' }),
      });

      const { sessionId, url } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        const stripe = await getStripe();
        await stripe?.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error('Credit purchase failed:', error);
      toast.error('Failed to purchase credits');
    } finally {
      setIsLoading(null);
    }
  };

  const currentTier = subscription?.tier || 'free';
  const tierConfig = PRICING_TIERS[currentTier.toUpperCase() as keyof typeof PRICING_TIERS];

  const creditsUsagePercent = credits ?
    Math.round((credits.usedCredits / credits.totalCredits) * 100) : 0;

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'pro': return <Zap className="w-5 h-5" />;
      case 'team': return <Users className="w-5 h-5" />;
      case 'startup': return <Rocket className="w-5 h-5" />;
      default: return <Crown className="w-5 h-5" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'pro': return 'from-blue-500 to-cyan-600';
      case 'team': return 'from-amber-500 to-amber-600';
      case 'startup': return 'from-orange-500 to-red-600';
      default: return 'from-zinc-500 to-zinc-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${getTierColor(currentTier)} rounded-xl flex items-center justify-center text-white`}>
                {getTierIcon(currentTier)}
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Current Plan: {tierConfig?.name || 'Free'}
                  <Badge variant={currentTier === 'free' ? 'secondary' : 'default'}>
                    {subscription?.status || 'Active'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {currentTier === 'free'
                    ? 'Get started with basic features'
                    : `$${tierConfig?.price}/month • ${subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : ''}`
                  }
                </CardDescription>
              </div>
            </div>
            {currentTier !== 'free' && (
              <Button variant="outline" size="sm">
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Billing
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Credit Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Credit Usage
          </CardTitle>
          <CardDescription>
            Track your AI model usage this billing period
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                {credits ? formatCredits(credits.usedCredits) : '0'} / {credits ? formatCredits(credits.totalCredits) : '0'}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Credits used ({credits ? formatTokens(credits.totalCredits) : '0'} equivalent)
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                {credits ? formatCredits(credits.remainingCredits || 0) : '0'} remaining
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Credits left
              </p>
            </div>
          </div>

          <Progress value={creditsUsagePercent} className="h-2" />

          {creditsUsagePercent > 80 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                You're running low on credits. Consider upgrading or purchasing additional credits.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              Period: {credits?.periodStart ? new Date(credits.periodStart).toLocaleDateString() : ''} - {credits?.periodEnd ? new Date(credits.periodEnd).toLocaleDateString() : ''}
            </span>
            <span>
              Resets: {credits?.periodEnd ? new Date(credits.periodEnd).toLocaleDateString() : ''}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      {currentTier === 'free' && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Your Plan</CardTitle>
            <CardDescription>
              Unlock more features and credits for your AI applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {Object.entries(PRICING_TIERS).filter(([key]) => key !== 'FREE').map(([key, tier]) => (
                <div key={key} className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 hover:border-amber-400/50 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 bg-gradient-to-br ${getTierColor(tier.id)} rounded-lg flex items-center justify-center text-white`}>
                      {getTierIcon(tier.id)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-white">{tier.name}</h3>
                      <p className="text-2xl font-bold text-zinc-900 dark:text-white">${tier.price}<span className="text-sm font-normal text-zinc-500">/mo</span></p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-3 h-3 text-green-600" />
                      <span>{tier.features.chats} chats/APIs</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-3 h-3 text-green-600" />
                      <span>{formatTokens(tier.features.credits)} included</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-3 h-3 text-green-600" />
                      <span>{tier.features.storage} storage</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => handleUpgrade(tier.priceId!, tier.name)}
                    disabled={!!isLoading}
                  >
                    {isLoading === tier.priceId ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      `Upgrade to ${tier.name}`
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
