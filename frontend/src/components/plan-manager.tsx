"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Crown,
  Zap,
  Users,
  Building,
  Check,
  Clock,
  AlertCircle,
  ArrowRight,
  X,
  Calendar,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { getStripe } from "@/lib/stripe";
import { cn } from "@/lib/utils";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PlanTier {
  id: string;
  name: string;
  price: string;
  priceId: string;
  credits: string;
  icon: React.ReactNode;
  features: PlanFeature[];
  popular?: boolean;
  description: string;
}

const plans: PlanTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    priceId: '',
    credits: '500',
    icon: <Zap className="w-5 h-5" />,
    description: 'Perfect for getting started',
    features: [
      { text: '500 AI credits/month (~500k tokens)', included: true },
      { text: 'Basic chat functionality', included: true },
      { text: 'File uploads (PDF, DOC, TXT)', included: true },
      { text: 'API access', included: false },
      { text: 'Priority support', included: false },
      { text: 'Advanced features', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$39',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '',
    credits: '10,000',
    icon: <Crown className="w-5 h-5" />,
    description: 'Best for professionals and power users',
    popular: true,
    features: [
      { text: '10,000 AI credits/month (~10M tokens)', included: true },
      { text: 'Full chat functionality', included: true },
      { text: 'File uploads (PDF, DOC, TXT)', included: true },
      { text: 'API access & key management', included: true },
      { text: 'Priority support', included: true },
      { text: 'Advanced features', included: true },
    ],
  },
  {
    id: 'team',
    name: 'Team',
    price: '$99',
    priceId: process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID || '',
    credits: '30,000',
    icon: <Users className="w-5 h-5" />,
    description: 'Ideal for teams and collaboration',
    features: [
      { text: '30,000 AI credits/month (~30M tokens)', included: true },
      { text: 'Full chat functionality', included: true },
      { text: 'File uploads (PDF, DOC, TXT)', included: true },
      { text: 'API access & key management', included: true },
      { text: 'Priority support', included: true },
      { text: 'Team collaboration features', included: true },
    ],
  },
  {
    id: 'startup',
    name: 'Startup',
    price: '$199',
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTUP_PRICE_ID || '',
    credits: '100,000',
    icon: <Building className="w-5 h-5" />,
    description: 'For growing businesses and startups',
    features: [
      { text: '100,000 AI credits/month (~100M tokens)', included: true },
      { text: 'Full chat functionality', included: true },
      { text: 'File uploads (PDF, DOC, TXT)', included: true },
      { text: 'API access & key management', included: true },
      { text: 'Priority support', included: true },
      { text: 'Custom integrations', included: true },
    ],
  },
];

export function PlanManager() {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Queries
  const detailedSubscription = useQuery(api.subscriptions.getDetailedSubscription);

  // Mutations
  const schedulePlanChange = useMutation(api.subscriptions.schedulePlanChange);
  const cancelPendingPlanChange = useMutation(api.subscriptions.cancelPendingPlanChange);

  const currentTier = detailedSubscription?.tier || 'free';
  const pendingTier = detailedSubscription && 'pendingTier' in detailedSubscription ? detailedSubscription.pendingTier : undefined;
  const hasPendingChange = detailedSubscription?.hasPendingChange || false;
  const daysUntilChange = detailedSubscription && 'daysUntilChange' in detailedSubscription ? detailedSubscription.daysUntilChange || 0 : 0;

  // Handle plan changes
  const handlePlanChange = async (newTier: string, newPriceId: string, planName: string) => {
    if (newTier === currentTier) return;

    setIsLoading(newTier);

    try {
      if (newTier === 'free') {
        // Downgrade to free - schedule for next billing cycle
        await schedulePlanChange({
          newTier: 'free',
          newPriceId: '',
        });

        toast.success(`Downgrade to Free scheduled for next billing cycle. You can change your mind anytime before then.`);
      } else {
        // Check if this is an upgrade or downgrade
        const tierOrder = { free: 0, pro: 1, team: 2, startup: 3 };
        const currentOrder = tierOrder[currentTier as keyof typeof tierOrder] || 0;
        const newOrder = tierOrder[newTier as keyof typeof tierOrder] || 0;

        if (newOrder > currentOrder) {
          // Upgrade - immediate via Stripe
          const stripe = await getStripe();
          if (!stripe) throw new Error("Stripe failed to load");

          const response = await fetch("/api/stripe/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ priceId: newPriceId }),
          });

          const session = await response.json();
          if (session.error) throw new Error(session.error);

          await stripe.redirectToCheckout({ sessionId: session.sessionId });
        } else {
          // Downgrade - schedule for next billing cycle
          await schedulePlanChange({
            newTier,
            newPriceId,
          });

          toast.success(`Downgrade to ${planName} scheduled for next billing cycle. You can change your mind anytime before then.`);
        }
      }
    } catch (error) {
      console.error("Plan change error:", error);
      toast.error(`Failed to change to ${planName}. Please try again.`);
    } finally {
      setIsLoading(null);
    }
  };

  // Handle canceling pending plan change
  const handleCancelPendingChange = async () => {
    setIsLoading('cancel');
    try {
      await cancelPendingPlanChange();
      toast.success("Plan change canceled. You'll remain on your current plan.");
    } catch (error) {
      console.error("Cancel plan change error:", error);
      toast.error("Failed to cancel plan change. Please try again.");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending Change Notice */}
      {hasPendingChange && (
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                  Plan Change Scheduled
                </h3>
                <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
                  Your plan will change from <strong>{currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</strong> to{' '}
                  <strong>{(pendingTier || '').charAt(0).toUpperCase() + (pendingTier || '').slice(1)}</strong> in{' '}
                  <strong>{daysUntilChange} day{daysUntilChange !== 1 ? 's' : ''}</strong> at your next billing cycle.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCancelPendingChange}
                    disabled={isLoading === 'cancel'}
                    size="sm"
                    variant="outline"
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    {isLoading === 'cancel' ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Canceling...
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3 mr-1" />
                        Cancel Change
                      </>
                    )}
                  </Button>
                  <div className="text-xs text-orange-600 dark:text-orange-300 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    Effective: {new Date((detailedSubscription && 'planChangeEffectiveDate' in detailedSubscription ? detailedSubscription.planChangeEffectiveDate : 0) || 0).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentTier;
          const isPending = plan.id === pendingTier;
          const isProcessing = isLoading === plan.id;

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative overflow-hidden transition-all duration-200",
                isCurrent && "ring-2 ring-trainlymainlight bg-blue-50/50 dark:bg-blue-900/10",
                isPending && "ring-2 ring-orange-400 bg-orange-50/50 dark:bg-orange-900/10",
                plan.popular && !isCurrent && "ring-2 ring-purple-400"
              )}
            >
              {plan.popular && !isCurrent && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-trainlymainlight text-white text-xs font-medium text-center py-1">
                  Most Popular
                </div>
              )}

              {isCurrent && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-trainlymainlight to-blue-600 text-white text-xs font-medium text-center py-1">
                  Current Plan
                </div>
              )}

              {isPending && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-medium text-center py-1">
                  Scheduled Change
                </div>
              )}

              <CardHeader className={cn("pb-4", (plan.popular || isCurrent || isPending) && "pt-8")}>
                <div className="flex items-center gap-2">
                  {plan.icon}
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {plan.price}
                    {plan.id !== 'free' && <span className="text-sm font-normal text-slate-500">/month</span>}
                  </div>
                  <CardDescription className="text-xs">{plan.description}</CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="font-semibold text-trainlymainlight">{plan.credits} credits</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">per month</div>
                </div>

                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                      <span className={cn(
                        feature.included ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"
                      )}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handlePlanChange(plan.id, plan.priceId, plan.name)}
                  disabled={isCurrent || isProcessing || (hasPendingChange && !isPending)}
                  className={cn(
                    "w-full",
                    isCurrent && "opacity-50 cursor-not-allowed",
                    isPending && "bg-orange-500 hover:bg-orange-600"
                  )}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrent ? (
                    "Current Plan"
                  ) : isPending ? (
                    "Scheduled"
                  ) : (
                    <>
                      {plan.id === 'free' ? 'Downgrade' : 'Select Plan'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Plan Change Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Plan Change Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-start gap-2">
            <ArrowRight className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span><strong>Upgrades</strong> take effect immediately and you'll be charged the prorated amount.</span>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <span><strong>Downgrades</strong> are scheduled for your next billing cycle so you keep your current features until then.</span>
          </div>
          <div className="flex items-start gap-2">
            <RefreshCw className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <span><strong>Change your mind?</strong> You can cancel any scheduled plan change anytime before it takes effect.</span>
          </div>
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
            <span><strong>Credits</strong> are adjusted based on your new plan at the next billing cycle.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
