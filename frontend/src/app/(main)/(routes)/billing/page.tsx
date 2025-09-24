"use client";

import React from "react";
import { ResizableSidebar } from "@/app/(main)/components/resizable-sidebar";
import { useSidebarWidth } from "@/hooks/use-sidebar-width";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard, History, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { PlanManager } from "@/components/plan-manager";
import { BillingDashboard } from "@/components/billing-dashboard";

export default function BillingPage() {
  const router = useRouter();
  const { sidebarWidth } = useSidebarWidth();

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
                Billing & Plans
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Manage your subscription, billing, and plan changes
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-8">

            {/* Navigation Tabs */}
            <div className="flex gap-4 border-b border-zinc-200 dark:border-zinc-700">
              <button className="px-4 py-2 border-b-2 border-amber-400 text-amber-400 font-medium">
                <Settings className="w-4 h-4 inline mr-2" />
                Plan Management
              </button>
              <button className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                <CreditCard className="w-4 h-4 inline mr-2" />
                Billing Details
              </button>
              <button className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                <History className="w-4 h-4 inline mr-2" />
                Usage History
              </button>
            </div>

            {/* Plan Management Section */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                  Choose Your Plan
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Upgrade or downgrade your plan anytime. Changes take effect at your next billing cycle for downgrades,
                  or immediately for upgrades.
                </p>
              </div>

              <PlanManager />
            </div>

            {/* Billing Dashboard */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                  Current Usage & Billing
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Monitor your current usage and billing information.
                </p>
              </div>

              <BillingDashboard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}