"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NextUIProvider } from "@nextui-org/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Zap, Code, Users, Crown, Rocket, Star, ArrowRight } from "lucide-react";
import Navbar from "@/app/components/navbar";
import { PRICING_TIERS, formatTokens } from "@/lib/stripe";
import { getStripe } from "@/lib/stripe";

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleUpgrade = async (priceId: string | null, tierName: string) => {
    if (!priceId) {
      // Free tier - redirect to sign up
      window.location.href = '/sign-up';
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

      const { sessionId, url } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        const stripe = await getStripe();
        await stripe?.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error('Checkout failed:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'pro': return <Zap className="w-6 h-6" />;
      case 'team': return <Users className="w-6 h-6" />;
      case 'startup': return <Rocket className="w-6 h-6" />;
      default: return <Crown className="w-6 h-6" />;
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
    <NextUIProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Navbar />
        <div className="pt-32 pb-20">
          <div className="max-w-7xl mx-auto px-6">
            {/* Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-trainlymainlight/20 bg-trainlymainlight/5 text-trainlymainlight text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                <span>Developer-First Pricing</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-viaoda font-normal text-slate-900 dark:text-white mb-6">
                <span className="bg-gradient-to-r from-trainlymainlight to-purple-600 bg-clip-text text-transparent">
                  Start free,
                </span>
                <br />
                <span className="text-slate-700 dark:text-slate-300">
                  scale as you grow
                </span>
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
                From side projects to production apps. Transparent pricing that
                grows with your needs, not against them.
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex justify-center mb-12">
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  className={cn(
                    "px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200",
                    !annual
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
                  )}
                  onClick={() => setAnnual(false)}
                >
                  Monthly
                </button>
                <button
                  className={cn(
                    "px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-2",
                    annual
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
                  )}
                  onClick={() => setAnnual(true)}
                >
                  <Badge className="bg-trainlymainlight/10 text-trainlymainlight text-xs px-2 py-1 rounded-md">
                    Save 33%
                  </Badge>
                  Annual
                </button>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
              {/* Free Tier */}
              <div className="relative p-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-viaoda font-normal text-slate-900 dark:text-white mb-2">
                    Hobby
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Perfect for side projects and learning
                  </p>
                  <div className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                    $0
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    Forever free
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-trainlymainlight flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">
                      3 GraphRAG chats
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-trainlymainlight flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">
                      10MB file uploads
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-trainlymainlight flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Graph visualization
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-trainlymainlight flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Source citations
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <X className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-400">API endpoints</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <X className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-400">Graph editing</span>
                  </li>
                </ul>

                <button className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                  Start Free
                </button>
              </div>

              {/* Pro Tier - Most Popular */}
              <div className="relative p-8 bg-white dark:bg-slate-800 rounded-3xl border-2 border-trainlymainlight shadow-2xl hover:shadow-trainlymainlight/20 transition-all duration-300">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-trainlymainlight text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-viaoda font-normal text-slate-900 dark:text-white mb-2">
                    Pro
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    For serious developers building apps
                  </p>
                  <div className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                    ${annual ? "19" : "29"}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    per month{" "}
                    {annual && (
                      <span className="text-trainlymainlight font-medium">
                        (save $120/year)
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-trainlymainlight flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Unlimited GraphRAG chats
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-trainlymainlight flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">
                      500MB file uploads
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-trainlymainlight flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Full graph editing
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-trainlymainlight flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">
                      API endpoints per chat
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-trainlymainlight flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Priority processing
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-trainlymainlight flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Email support
                    </span>
                  </li>
                </ul>

                <button className="w-full py-3 px-4 bg-trainlymainlight text-white font-semibold rounded-xl hover:bg-trainlymainlight/90 transition-colors shadow-lg">
                  Start Pro Trial
                </button>
              </div>

              {/* Scale Tier */}
              <div className="relative p-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-viaoda font-normal text-slate-900 dark:text-white mb-2">
                    Scale
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    For teams and production workloads
                  </p>
                  <div className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                    ${annual ? "49" : "69"}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    per month{" "}
                    {annual && (
                      <span className="text-trainlymainlight font-medium">
                        (save $240/year)
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-trainlymainlight flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Everything in Pro
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-trainlymainlight flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">
                      5GB file uploads
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-trainlymainlight flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">
                      100k API calls/month
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-trainlymainlight flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Premium AI models
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-trainlymainlight flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Graph export (Neo4j, JSON)
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-trainlymainlight flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Priority support
                    </span>
                  </li>
                </ul>

                <button className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                  Contact Sales
                </button>
              </div>
            </div>

            {/* Developer Benefits */}
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">
                Built for developers who ship fast
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                Stop wasting time debugging black-box AI. Get the transparency
                and control you need.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="w-16 h-16 bg-trainlymainlight/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-trainlymainlight" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  Ship in Minutes, Not Months
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Upload docs, chat to test, deploy as API. Perfect for
                  hackathons and rapid prototyping.
                </p>
              </div>

              <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="w-16 h-16 bg-trainlymainlight/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Code className="w-8 h-8 text-trainlymainlight" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  AI you can see, shape, and ship
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Visual graph editing lets you see exactly how your AI thinks
                  and fix issues instantly.
                </p>
              </div>

              <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="w-16 h-16 bg-trainlymainlight/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-trainlymainlight" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  Developer Experience First
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Clean APIs, comprehensive docs, and SDKs. Built by developers,
                  for developers.
                </p>
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-12 mb-20">
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                  Frequently Asked Questions
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Everything you need to know about Trainly
                </p>
              </div>

              <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                    How is this different from ChatGPT or Claude?
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    Unlike ChatGPT, Trainly uses GraphRAG to eliminate
                    hallucinations and provides complete transparency. You can
                    see exactly which documents influenced each answer and edit
                    the knowledge graph visually.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                    Can I really turn chats into APIs?
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    Yes! Every chat gets its own API endpoint that you can use
                    in your applications. Perfect for rapid prototyping or
                    building AI features into existing apps.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                    Is there a free tier?
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    Absolutely! The Hobby tier is free forever and includes 3
                    chats, graph visualization, and source citations. Perfect
                    for learning and side projects.
                  </p>
                </div>
              </div>
            </div>

            {/* Final CTA */}
            <div className="text-center">
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Ready to build AI you can trust?
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
                Join hundreds of developers building the future with explainable
                GraphRAG.
              </p>
              <button className="bg-trainlymainlight hover:bg-trainlymainlight/90 text-white px-8 py-3 rounded-xl font-semibold transition-colors">
                Start Building Today
              </button>
            </div>
          </div>
        </div>
      </div>
    </NextUIProvider>
  );
}
