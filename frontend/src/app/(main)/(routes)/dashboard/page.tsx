"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";
import { PlusCircle, Sparkles } from "lucide-react";
import { ResizableSidebar } from "../../components/resizable-sidebar";
import { useSidebarWidth } from "@/hooks/use-sidebar-width";
import { Toaster } from "sonner";
import { useState, Suspense } from "react";
import React from "react";
import { useConvexAuth } from "@/hooks/use-auth-state";
import { getStripe, PRICING_TIERS } from "@/lib/stripe";
import { useSearchParams } from "next/navigation";
import { usePendingUpgrade } from "@/hooks/use-pending-upgrade";

function NoChatContent() {
  const { user } = useUser();
  const { sidebarWidth } = useSidebarWidth();
  const [isCreating, setIsCreating] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { canQuery } = useConvexAuth();
  const searchParams = useSearchParams();

  // Check if user just completed payment
  const paymentSuccess = searchParams.get("success");
  const paymentCanceled = searchParams.get("canceled");

  const addChat = useMutation(api.chats.createChat);
  const chatLimits = useQuery(api.chats.getUserChatLimits);

  // Check for pending upgrades after sign-in
  usePendingUpgrade();

  // Function to get next tier for upgrade
  const getNextTier = (currentTier: string) => {
    switch (currentTier) {
      case "free":
        return PRICING_TIERS.PRO;
      case "pro":
        return PRICING_TIERS.SCALE;
      case "scale":
        return PRICING_TIERS.ENTERPRISE;
      default:
        return PRICING_TIERS.PRO; // fallback
    }
  };

  // Handle payment success/cancel notifications
  React.useEffect(() => {
    if (paymentSuccess) {
      toast.success(
        "🎉 Payment successful! Your subscription is being activated by our system. This may take a few moments.",
      );

      // Clean up URL parameters
      window.history.replaceState({}, "", "/dashboard");

      // Refresh after a delay to show updated subscription
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } else if (paymentCanceled) {
      toast.info("Payment was canceled. You can try again anytime.");

      // Clean up URL parameters
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [paymentSuccess, paymentCanceled]);

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
      toast.error(
        "Checkout failed. Please try again or contact support at kavin11205@gmail.com.",
      );
    } finally {
      setIsUpgrading(false);
    }
  };

  const onCreate = async () => {
    if (!canQuery) {
      toast.error("Please wait - authentication is still loading");
      return;
    }

    // Wait for chat limits to load if not available yet
    if (!chatLimits) {
      toast.error("Loading your account info, please wait...");
      return;
    }

    // Check if user can create more chats
    if (!chatLimits.canCreateMore) {
      const nextTier = getNextTier(chatLimits.tierName);
      const nextTierDisplay =
        nextTier.id === "enterprise"
          ? "Enterprise"
          : `${nextTier.name} ($${nextTier.price}/mo)`;
      toast.error(
        `You've reached your chat limit of ${chatLimits.chatLimit} chat${chatLimits.chatLimit > 1 ? "s" : ""} for the ${chatLimits.tierName} plan.`,
        {
          description: `Upgrade to ${nextTierDisplay} for more chats or archive existing ones.`,
          action: {
            label: "View Plans",
            onClick: () => window.open("/pricing", "_blank"),
          },
          duration: 8000,
        },
      );
      return;
    }

    setIsCreating(true);
    try {
      await addChat({ title: "untitled" });
      toast.success("Created chat!");
    } catch (error) {
      console.error("Failed to create chat:", error);
      if (error instanceof Error) {
        // Show the exact error message from the backend
        const nextTier = getNextTier(chatLimits.tierName);
        const nextTierDisplay =
          nextTier.id === "enterprise"
            ? "Enterprise"
            : `${nextTier.name} ($${nextTier.price}/mo)`;
        toast.error(error.message, {
          description: `Upgrade to ${nextTierDisplay} for more chats or archive existing ones.`,
          action: {
            label: "View Plans",
            onClick: () => window.open("/pricing", "_blank"),
          },
          duration: 8000,
        });
      } else {
        toast.error("Failed to create chat");
      }
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
              {chatLimits && !chatLimits.canCreateMore ? (
                <div className="text-center space-y-4">
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <p className="text-amber-800 dark:text-amber-200 font-medium">
                      Chat Limit Reached
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      You've used {chatLimits.currentChatCount} of{" "}
                      {chatLimits.chatLimit} chat
                      {chatLimits.chatLimit > 1 ? "s" : ""} on the{" "}
                      {chatLimits.tierName} plan
                    </p>
                  </div>
                  <div className="flex gap-3">
                    {(() => {
                      const nextTier = getNextTier(chatLimits.tierName);
                      return (
                        <Button
                          onClick={() => {
                            if (nextTier.id === "enterprise") {
                              window.open(
                                "mailto:kavin11205@gmail.com?subject=Enterprise%20Inquiry",
                                "_blank",
                              );
                            } else {
                              handleUpgrade(nextTier.priceId!, nextTier.name);
                            }
                          }}
                          disabled={isUpgrading}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          {isUpgrading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                              Processing...
                            </>
                          ) : nextTier.id === "enterprise" ? (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Contact Sales
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Upgrade to {nextTier.name}
                            </>
                          )}
                        </Button>
                      );
                    })()}
                    <Button
                      onClick={() => window.open("/dashboard/manage", "_blank")}
                      variant="outline"
                      className="px-6 py-3 rounded-xl font-semibold border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-900/30"
                    >
                      Archive Chats
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={onCreate}
                  disabled={isCreating || !chatLimits}
                  className="bg-amber-400 hover:bg-amber-400/90 disabled:bg-amber-400/50 disabled:cursor-not-allowed text-white px-8 py-4 text-lg rounded-xl font-semibold shadow-xl hover:shadow-2xl hover:shadow-amber-400/25 transition-all duration-300 flex items-center gap-3"
                >
                  {isCreating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Chat...
                    </>
                  ) : !chatLimits ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-5 w-5" />
                      Create Your First Chat
                    </>
                  )}
                </Button>
              )}

              {/* Upgrade CTA - only show if not at limit */}
              {(!chatLimits || chatLimits.canCreateMore) && (
                <div className="text-center">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                    Or start with more powerful features
                  </p>
                  <div className="flex gap-3">
                    {(() => {
                      const nextTier = getNextTier(
                        chatLimits?.tierName || "free",
                      );
                      return (
                        <Button
                          onClick={() => {
                            if (nextTier.id === "enterprise") {
                              window.open(
                                "mailto:kavin11205@gmail.com?subject=Enterprise%20Inquiry",
                                "_blank",
                              );
                            } else {
                              handleUpgrade(nextTier.priceId!, nextTier.name);
                            }
                          }}
                          disabled={isUpgrading}
                          variant="outline"
                          className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-white transition-all duration-300"
                        >
                          {isUpgrading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin mr-2" />
                              Processing...
                            </>
                          ) : nextTier.id === "enterprise" ? (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Contact Sales
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Start {nextTier.name} - $
                              {typeof nextTier.price === "number"
                                ? nextTier.price
                                : "Custom"}
                              /mo
                            </>
                          )}
                        </Button>
                      );
                    })()}
                    <Button
                      onClick={() => window.open("/billing", "_blank")}
                      variant="ghost"
                      className="text-zinc-600 hover:text-amber-400"
                    >
                      View All Plans
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NoChat() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <NoChatContent />
    </Suspense>
  );
}
