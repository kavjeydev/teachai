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
  AlertCircle,
  ArrowRight,
  Plus,
  Sparkles,
  Star
} from "lucide-react";
import { PRICING_TIERS, CREDIT_PACKS, formatCredits, formatTokens } from "@/lib/stripe";
import { toast } from "sonner";
import { getStripe } from "@/lib/stripe";

export function BillingDashboard() {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const subscription = useQuery(api.subscriptions.getUserSubscription);
  const credits = useQuery(api.subscriptions.getUserCredits);

  const handleUpgrade = async (priceId: string | null, tierName: string) => {
    if (!priceId) {
      toast.error("Invalid pricing configuration");
      return;
    }

    setIsLoading(priceId);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId, mode: 'subscription' }),
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
      case 'pro': return <Zap className="w-5 h-5 text-white" />;
      case 'team': return <Users className="w-5 h-5 text-white" />;
      case 'startup': return <Rocket className="w-5 h-5 text-white" />;
      default: return <Crown className="w-5 h-5 text-white" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'pro': return 'from-blue-500 to-cyan-600';
      case 'team': return 'from-purple-500 to-pink-600';
      case 'startup': return 'from-orange-500 to-red-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Billing & Usage
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage your subscription and monitor your AI credit usage
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 bg-gradient-to-br ${getTierColor(currentTier)} rounded-xl flex items-center justify-center shadow-lg`}>
                {getTierIcon(currentTier)}
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {tierConfig?.name || 'Free'} Plan
                  <Badge variant={currentTier === 'free' ? 'secondary' : 'default'}>
                    {subscription?.status || 'Active'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {currentTier === 'free'
                    ? 'Get started with basic features • Upgrade anytime'
                    : `$${tierConfig?.price}/month • Next billing: ${subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : ''}`
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
            AI Credit Usage
          </CardTitle>
          <CardDescription>
            Your AI model usage this billing period
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Usage Overview */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {credits ? formatCredits(credits.usedCredits) : '0'}
                <span className="text-lg font-normal text-slate-500"> / {credits ? formatCredits(credits.totalCredits) : '0'}</span>
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Credits used • {credits ? formatTokens(credits.totalCredits) : '0'} equivalent on GPT-4o-mini
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-trainlymainlight">
                {credits ? formatCredits(credits.remainingCredits || 0) : '0'}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Credits remaining
              </p>
            </div>
          </div>

          <Progress value={creditsUsagePercent} className="h-3" />

          {/* Usage Alert */}
          {creditsUsagePercent > 80 && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                  Running Low on Credits
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                  You've used {creditsUsagePercent}% of your monthly credits. Consider upgrading or purchasing additional credits to avoid interruptions.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100">
                    <Plus className="w-3 h-3 mr-1" />
                    Buy Credits
                  </Button>
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                    <ArrowRight className="w-3 h-3 mr-1" />
                    Upgrade Plan
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Billing Period */}
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                Billing period: {credits?.periodStart ? new Date(credits.periodStart).toLocaleDateString() : ''} - {credits?.periodEnd ? new Date(credits.periodEnd).toLocaleDateString() : ''}
              </span>
            </div>
            <span>
              Resets in {credits?.periodEnd ? Math.ceil((credits.periodEnd - Date.now()) / (1000 * 60 * 60 * 24)) : 0} days
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Subscription Upgrades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Subscription Plans
            </CardTitle>
            <CardDescription>
              Predictable monthly billing with included credits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(PRICING_TIERS).filter(([key]) => key !== 'FREE' && key !== currentTier.toUpperCase()).map(([key, tier]) => (
              <div key={key} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-trainlymainlight/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 bg-gradient-to-br ${getTierColor(tier.id)} rounded-lg flex items-center justify-center`}>
                    {getTierIcon(tier.id)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{tier.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {formatTokens(tier.features.credits)} • {tier.features.chats} chats • {tier.features.storage}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-900 dark:text-white">${tier.price}<span className="text-sm font-normal text-slate-500">/mo</span></p>
                  <Button
                    size="sm"
                    onClick={() => handleUpgrade(tier.priceId!, tier.name)}
                    disabled={!!isLoading}
                    className="mt-2"
                  >
                    {isLoading === tier.priceId ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
                        Processing...
                      </>
                    ) : (
                      `Upgrade to ${tier.name}`
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Credit Packs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Credit Top-ups
            </CardTitle>
            <CardDescription>
              One-time credit purchases for extra usage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(CREDIT_PACKS).map(([key, pack]) => (
              <div key={key} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-trainlymainlight/50 transition-colors">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{pack.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {pack.description}
                  </p>
                  {'popular' in pack && pack.popular && (
                    <Badge variant="default" className="mt-1">
                      <Star className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-900 dark:text-white">${pack.price}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBuyCredits(pack.priceId!, pack.name)}
                    disabled={!!isLoading}
                    className="mt-2"
                  >
                    {isLoading === pack.priceId ? (
                      <>
                        <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin mr-1" />
                        Processing...
                      </>
                    ) : (
                      'Buy Now'
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Model Usage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Model Usage Breakdown</CardTitle>
          <CardDescription>
            See how different AI models consume your credits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <strong>Credit Rates:</strong>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex justify-between">
                <span>GPT-4o-mini:</span>
                <span className="font-mono">1x</span>
              </div>
              <div className="flex justify-between">
                <span>GPT-4o:</span>
                <span className="font-mono">15x</span>
              </div>
              <div className="flex justify-between">
                <span>Claude Haiku:</span>
                <span className="font-mono">1x</span>
              </div>
              <div className="flex justify-between">
                <span>Claude Sonnet:</span>
                <span className="font-mono">8x</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              1 credit = 1,000 tokens on GPT-4o-mini. Other models use credits based on their relative cost.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
