"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { ResizableSidebar } from "@/app/(main)/components/resizable-sidebar";
import { useSidebarWidth } from "@/hooks/use-sidebar-width";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { UpgradeTierCards } from "@/components/upgrade-tier-cards";

export default function UpgradePage() {
  const { user } = useUser();
  const { sidebarWidth } = useSidebarWidth();
  const router = useRouter();

  const subscription = useQuery(api.subscriptions.getUserSubscription);
  const credits = useQuery(api.subscriptions.getUserCredits);

  const currentTier = subscription?.tier || "free";

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Resizable Sidebar */}
      <ResizableSidebar />

      {/* Main Content Area - Responsive to sidebar width */}
      <div
        className="h-screen flex flex-col"
        style={{
          marginLeft: `${sidebarWidth}px`,
          transition: "margin-left 300ms ease-out",
        }}
      >
        {/* Header */}
        <div className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                Upgrade Your Plan
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Choose the plan that fits your needs • Currently on{" "}
                {currentTier === "free" ? "Free" : currentTier} plan
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">

            {/* Upgrade Plans */}
            <div className="mb-8">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="w-6 h-6 text-amber-500" />
                  <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">
                    Upgrade Your Plan
                  </h2>
                </div>
                <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                  Get more credits, chats, and advanced features. All plans
                  include our full feature set.
                </p>
              </div>

              <UpgradeTierCards currentTier={currentTier} compact={false} />
            </div>

            {/* FAQ or Additional Info */}
            <div className="text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                All subscriptions are managed through Stripe's secure billing
                portal
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() =>
                    window.open(
                      "mailto:hello@trainly.ai?subject=Billing%20Question",
                      "_blank",
                    )
                  }
                >
                  Contact Support
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/pricing")}
                >
                  View Full Pricing
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
