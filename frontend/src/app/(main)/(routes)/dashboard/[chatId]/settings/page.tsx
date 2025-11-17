"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import { SimpleApiManager } from "@/components/simple-api-manager";
import { ApiKeysComparison } from "@/components/api-keys-comparison";
import { ResizableSidebar } from "@/app/(main)/components/resizable-sidebar";
import { useSidebarWidth } from "@/hooks/use-sidebar-width";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Settings,
  Key,
  Zap,
  Shield,
  BookOpen,
  ExternalLink,
  Crown,
  BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getStripe } from "@/lib/stripe";
import { toast } from "sonner";

interface ChatSettingsPageProps {
  params: Promise<{
    chatId: Id<"chats">;
  }>;
}

export default function ChatSettingsPage({ params }: ChatSettingsPageProps) {
  const router = useRouter();
  const { sidebarWidth } = useSidebarWidth();
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Handle subscription upgrade
  const handleUpgrade = async (priceId: string, planName: string) => {
    setIsUpgrading(true);
    try {
      const stripe = await getStripe();
      if (!stripe) throw new Error("Stripe failed to load");

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const session = await response.json();
      if (session.error) throw new Error(session.error);

      await stripe.redirectToCheckout({ sessionId: session.sessionId });
    } catch (error) {
      console.error("Upgrade error:", error);
      toast.error(`Failed to upgrade to ${planName}. Please try again.`);
    } finally {
      setIsUpgrading(false);
    }
  };

  // Get chatId from params
  const unwrappedParams = React.use(params);
  const chatId = unwrappedParams.chatId;

  // Get chat data
  const currentChat = useQuery(api.chats.getChatById, { id: chatId });
  const subscription = useQuery(api.subscriptions.getUserSubscription);

  if (!currentChat) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-zinc-50 via-blue-50/30 to-amber-50/20 dark:from-zinc-900 dark:via-blue-900/10 dark:to-amber-900/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-amber-600 dark:from-blue-500 dark:to-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse shadow-xl shadow-blue-600/20">
            <Settings className="w-10 h-10 text-white" />
          </div>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 font-medium">
            Loading API settings...
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-2">
            Please wait while we prepare your configuration
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-zinc-50 via-blue-50/30 to-amber-50/20 dark:from-zinc-900 dark:via-blue-900/10 dark:to-amber-900/10">
      {/* Resizable Sidebar */}
      <ResizableSidebar chatId={chatId} />

      {/* Main Content Area */}
      <div
        className="h-screen flex flex-col"
        style={{
          marginLeft: `${sidebarWidth}px`,
          transition: "margin-left 300ms ease-out",
        }}
      >
        {/* Header */}
        <div className="border-b border-zinc-200/60 dark:border-zinc-700/60 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center gap-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/${chatId}`)}
                className="flex items-center gap-2 bg-white/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-800 border-zinc-200/60 dark:border-zinc-700/60 backdrop-blur-sm transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-medium">Back to Chat</span>
              </Button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-amber-600 dark:from-blue-500 dark:to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <Key className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-amber-600 bg-clip-text text-transparent">
                    API Settings
                  </h1>
                  <p className="text-zinc-600 dark:text-zinc-400 text-lg">
                    {currentChat.title}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
            {/* Quick Actions */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card className="border-0 shadow-lg bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Analytics</h3>
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm">
                    Analytics are now available in the API Settings panel
                  </p>
                </CardContent>
              </Card>

              <Card
                className="border-0 shadow-lg bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group cursor-pointer"
                onClick={() => window.open("/docs", "_blank")}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Documentation</h3>
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm">
                    View comprehensive API documentation and examples
                  </p>
                </CardContent>
              </Card>

              <Card
                className="border-0 shadow-lg bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group cursor-pointer"
                onClick={() =>
                  window.open("https://docs.trainlyai.com", "_blank")
                }
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">API Reference</h3>
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm">
                    Complete API reference with interactive testing
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Secure Access</h3>
                  <p className="text-zinc-600 dark:text-zinc-300 text-sm">
                    Enterprise-grade security and authentication
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main API Manager - Only for paid users */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
              <CardHeader className="border-b border-zinc-200/60 dark:border-zinc-700/60 pb-6">
                <div className="flex items-center gap-3">
                  <Key className="w-6 h-6 text-blue-600" />
                  <div>
                    <CardTitle className="text-2xl">
                      API Configuration
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      Manage your API keys, test endpoints, and configure access
                      settings for this chat
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-8">
                  <SimpleApiManager
                    chatId={chatId}
                    chatTitle={currentChat.title}
                  />

                  {/* API Keys Comparison Section */}
                  <div className="border-t pt-8">
                    <ApiKeysComparison
                      chatId={chatId}
                      chatTitle={currentChat.title}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Resources */}
            <Card className="border-0 shadow-lg bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-amber-600" />
                  Additional Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="justify-start h-12"
                    asChild
                  >
                    <a
                      href="mailto:kavin11205@gmail.com"
                      className="flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                        <ExternalLink className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Contact Support</div>
                        <div className="text-sm text-zinc-500">
                          Get help with API integration
                        </div>
                      </div>
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start h-12"
                    asChild
                  >
                    <a href="/community" className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Community</div>
                        <div className="text-sm text-zinc-500">
                          Join our developer community
                        </div>
                      </div>
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
