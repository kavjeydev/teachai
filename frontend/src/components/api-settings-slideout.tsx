"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { SimpleApiManager } from "@/components/simple-api-manager";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Settings, Key, Zap, Shield, BookOpen, ExternalLink, Crown, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStripe } from "@/lib/stripe";
import { toast } from "sonner";

interface ApiSettingsSlideoutProps {
  chatId: Id<"chats">;
  isOpen: boolean;
  onClose: () => void;
}

export function ApiSettingsSlideout({ chatId, isOpen, onClose }: ApiSettingsSlideoutProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Get chat data and subscription info
  const currentChat = useQuery(api.chats.getChatById, { id: chatId });
  const subscription = useQuery(api.subscriptions.getUserSubscription);
  const detailedSubscription = useQuery(api.subscriptions.getDetailedSubscription);
  const credits = useQuery(api.subscriptions.getUserCredits);

  const handleUpgrade = async (priceId: string, tierName: string) => {
    setIsUpgrading(true);

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
      setIsUpgrading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure smooth slide-in animation
      setTimeout(() => {
        setIsAnimating(true);
      }, 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 500); // Match slower animation duration
  }, [onClose]);

  // Handle escape key to close slideout
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 bg-white dark:bg-slate-900 shadow-2xl z-50 transition-transform duration-500 ease-in-out overflow-y-auto",
        isAnimating ? "translate-x-0" : "translate-x-full"
      )}
    >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  API Settings
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {currentChat?.title || "Loading..."}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {currentChat ? (
            <>
              {/* Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Common API management tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      variant="outline"
                      className="justify-start h-auto p-4"
                      asChild
                    >
                      <a href="/docs" target="_blank" className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <div className="text-left">
                          <div className="font-medium">View Documentation</div>
                          <div className="text-xs text-slate-500">Complete API reference and examples</div>
                        </div>
                        <ExternalLink className="w-4 h-4 ml-auto" />
                      </a>
                    </Button>

                    <Button
                      variant="outline"
                      className="justify-start h-auto p-4"
                      asChild
                    >
                      <a href="/api-docs" target="_blank" className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-green-600" />
                        <div className="text-left">
                          <div className="font-medium">Test API</div>
                          <div className="text-xs text-slate-500">Interactive API testing interface</div>
                        </div>
                        <ExternalLink className="w-4 h-4 ml-auto" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Current Plan & Credits */}
              {subscription && credits && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="w-5 h-5" />
                      Current Plan: {subscription.tier === 'free' ? 'Free' : subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}
                      {detailedSubscription?.hasPendingChange && (
                        <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                          Change Pending
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {credits.usedCredits.toLocaleString()} / {credits.totalCredits.toLocaleString()} credits used this month
                      {detailedSubscription?.hasPendingChange && 'pendingTier' in detailedSubscription && 'daysUntilChange' in detailedSubscription && (
                        <div className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                          → Changing to {(detailedSubscription.pendingTier || '').charAt(0).toUpperCase() + (detailedSubscription.pendingTier || '').slice(1)} in {detailedSubscription.daysUntilChange} day{detailedSubscription.daysUntilChange !== 1 ? 's' : ''}
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-trainlymainlight to-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (credits.usedCredits / credits.totalCredits) * 100)}%` }}
                        />
                      </div>

                      {subscription.tier === 'free' && (
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!, "Pro")}
                            disabled={isUpgrading}
                            className="flex-1 bg-trainlymainlight hover:bg-trainlymainlight/90"
                          >
                            {isUpgrading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Upgrade to Pro - $39/mo
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => window.open('/billing', '_blank')}
                            variant="outline"
                          >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Manage Plans
                          </Button>
                        </div>
                      )}

                      {credits.usedCredits / credits.totalCredits > 0.8 && (
                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                          <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                            ⚠️ Running low on credits! Consider upgrading or purchasing more credits.
                          </p>
                          <Button
                            onClick={() => window.open('/billing', '_blank')}
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            <Crown className="w-3 h-3 mr-1" />
                            Upgrade Now
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* API Manager - Only for paid users */}
              {subscription?.tier === 'free' ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5" />
                      API Access
                    </CardTitle>
                    <CardDescription>
                      Convert your chat into a REST API endpoint
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Key className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        API Access - Pro Feature
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                        Turn your chat into a powerful REST API endpoint. Generate API keys, test endpoints,
                        and integrate with your applications. Available with Pro subscription.
                      </p>
                      <div className="space-y-3">
                        <Button
                          onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!, "Pro")}
                          disabled={isUpgrading}
                          className="bg-gradient-to-r from-trainlymainlight to-purple-600 hover:from-trainlymainlight/90 hover:to-purple-600/90 text-white shadow-lg"
                        >
                          {isUpgrading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Crown className="w-4 h-4 mr-2" />
                              Upgrade to Pro - $39/mo
                            </>
                          )}
                        </Button>
                        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                          <div>✓ 10,000 AI credits/month • ✓ API access • ✓ Priority support</div>
                          <Button
                            onClick={() => window.open('/billing', '_blank')}
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto p-1 hover:text-trainlymainlight"
                          >
                            View all plans & pricing →
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <SimpleApiManager
                  chatId={chatId}
                  chatTitle={currentChat.title || "Untitled Chat"}
                />
              )}
            </>
          ) : (
            // Loading state
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Loading API settings...
                </p>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
