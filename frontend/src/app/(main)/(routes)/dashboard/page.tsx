"use client";

import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";
import { PlusCircle, Sparkles } from "lucide-react";
import { ResizableSidebar } from "../../components/resizable-sidebar";
import { useSidebarWidth } from "@/hooks/use-sidebar-width";
import { Toaster } from "sonner";
import { useState } from "react";
import React from "react";
import { useConvexAuth } from "@/hooks/use-auth-state";
import { getStripe } from "@/lib/stripe";
import { useSearchParams } from "next/navigation";

export default function NoChat() {
  const { user } = useUser();
  const { sidebarWidth } = useSidebarWidth();
  const [isCreating, setIsCreating] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { canQuery } = useConvexAuth();
  const searchParams = useSearchParams();

  // Check if user just completed payment
  const paymentSuccess = searchParams.get("success");
  const userId = searchParams.get("user_id");
  const priceId = searchParams.get("price_id");

  const addChat = useMutation(api.chats.createChat);
  const manuallyActivateSubscription = useMutation(
    api.subscriptions.manuallyActivateSubscription,
  );

  // Map price IDs to tiers
  const getTierFromPriceId = (priceId: string): string => {
    const priceMap: Record<string, string> = {
      [process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!]: "pro",
      [process.env.NEXT_PUBLIC_STRIPE_STARTUP_PRICE_ID!]: "startup",
    };
    return priceMap[priceId] || "pro";
  };

  // Handle payment success and auto-activate subscription
  React.useEffect(() => {
    if (paymentSuccess && userId && user?.id === userId && priceId) {
      const activateSubscription = async () => {
        try {
          const tier = getTierFromPriceId(priceId);

          await manuallyActivateSubscription({ tier });

          toast.success(
            `🎉 Payment successful! Your ${tier.charAt(0).toUpperCase() + tier.slice(1)} subscription is now active!`,
          );

          // Clean up URL parameters
          window.history.replaceState({}, "", "/dashboard");

          // Refresh to show updated plan
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (error) {
          console.error("Auto-activation failed:", error);
          toast.error(
            "Payment successful but activation failed. Please contact support.",
          );
        }
      };

      activateSubscription();
    } else if (paymentSuccess && userId && user?.id === userId) {
      // Fallback for payments without price_id
      toast.success(
        "🎉 Payment successful! Please use manual activation below if your plan didn't update.",
      );
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [paymentSuccess, userId, user?.id, priceId, manuallyActivateSubscription]);

  const handleUpgrade = async (priceId: string, tierName: string) => {
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
      toast.error("Checkout failed. Please try again or contact support.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const onCreate = async () => {
    if (!canQuery) {
      toast.error("Please wait - authentication is still loading");
      return;
    }

    setIsCreating(true);
    try {
      const promise = addChat({ title: "untitled" });

      toast.success("Created chat!");

      await promise;
    } catch (error) {
      console.error("Failed to create chat:", error);
      toast.error(
        `Failed to create chat: ${error instanceof Error ? error.message : "Please try again"}`,
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (!user || user === undefined) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <Toaster position="top-center" richColors />

      {/* Resizable Sidebar */}
      <ResizableSidebar />

      {/* Main Content Area - Responsive to sidebar width */}
      <div
        className="h-screen flex items-center justify-center"
        style={{
          marginLeft: `${sidebarWidth}px`,
          transition: "margin-left 300ms ease-out",
        }}
      >
        <div className="flex flex-col gap-8 items-center max-w-lg mx-auto text-center p-8">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl flex items-center justify-center shadow-lg shadow-amber-400/20">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-4xl font-sans font-normal text-zinc-900 dark:text-white mb-4">
              Ready to build something amazing?
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
              Upload documents, ask questions, and watch your knowledge graph
              come to life.
            </p>
            <div className="flex flex-col gap-4 items-center">
              <Button
                onClick={onCreate}
                disabled={isCreating}
                className="bg-amber-400 hover:bg-amber-400/90 disabled:bg-amber-400/50 disabled:cursor-not-allowed text-white px-8 py-4 text-lg rounded-xl font-semibold shadow-xl hover:shadow-2xl hover:shadow-amber-400/25 transition-all duration-300 flex items-center gap-3"
              >
                {isCreating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Chat...
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-5 w-5" />
                    Create Your First Chat
                  </>
                )}
              </Button>

              {/* Upgrade CTA */}
              <div className="text-center">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                  Or start with more powerful features
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() =>
                      handleUpgrade(
                        process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
                        "Pro",
                      )
                    }
                    disabled={isUpgrading}
                    variant="outline"
                    className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-white transition-all duration-300"
                  >
                    {isUpgrading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Start Pro - $39/mo
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => window.open("/billing", "_blank")}
                    variant="ghost"
                    className="text-zinc-600 hover:text-amber-400"
                  >
                    View All Plans
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
