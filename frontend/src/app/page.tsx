"use client";

import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import { Button } from "@nextui-org/button";
import { useRouter } from "next/navigation";
import React, { Suspense } from "react";
import Navbar from "./components/navbar";
import { Spinner } from "@nextui-org/spinner";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";
import {
  ArrowRight,
  CheckCircle,
  Zap,
  Eye,
  Code,
  Shield,
  Users,
  TrendingUp,
  Sparkles,
  GitBranch,
  Terminal,
} from "lucide-react";

const ParticlesBackground = dynamic(() => import("./components/particles"), {
  ssr: false,
});

// Spline components temporarily disabled due to module resolution issues
// const SplineScene = dynamic(() => import("../components/spline-scene"), {
//   ssr: false,
//   loading: () => (
//     <img
//       className="absolute top-0 h-full w-full -z-20"
//       src="/placeholder.jpg"
//     />
//   ),
// });
// const SplineSceneDark = dynamic(
//   () => import("../components/spline-scene-dark"),
//   {
//     ssr: false,
//     loading: () => (
//       <img
//         className="absolute top-0 h-full w-full -z-20"
//         src="/placeholder.jpg"
//       />
//     ),
//   },
// );

interface CyclingTextProps {
  responses: string[];
  displayDuration: number;
}

function CyclingText({ responses, displayDuration = 3000 }: CyclingTextProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [animate, setAnimate] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      // Start slide-out animation
      setAnimate(false);
      // After animation, update text and slide it in
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % responses.length);
        setAnimate(true);
      }, 500); // duration of slide-out transition in ms
    }, displayDuration);
    return () => clearTimeout(timer);
  }, [currentIndex, responses, displayDuration]);

  return (
    <span className=" overflow-hidden inline-block h-24 pt-8 pb-4 -mt-6">
      <span
        className={`inline-block transform transition-all duration-700 bg-gradient-to-t from-trainlymainlight to-[#a490ff]
          bg-clip-text text-transparent ${
            animate
              ? "translate-y-0 opacity-100"
              : "translate-y-[120%] opacity-100"
          }`}
      >
        {responses[currentIndex]}
      </span>
    </span>
  );
}

export default function Home() {
  const router = useRouter();
  const { user } = useUser();
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-trainlymainlight/10 via-transparent to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-20">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-trainlymainlight/5 border border-trainlymainlight/20 text-trainlymainlight text-sm font-medium mb-8 backdrop-blur-sm">
              <Sparkles className="w-4 h-4" />
              <span>GraphRAG for Developers</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-8 leading-[0.9]">
              <span className="bg-gradient-to-r from-trainlymainlight via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Build AI that
              </span>
              <br />
              <span className="text-slate-700 dark:text-slate-300">
                never hallucinates
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              The first GraphRAG platform with visual knowledge editing. See
              exactly how your AI makes decisions, edit knowledge graphs, and
              turn conversations into APIs.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              {user === undefined && (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span className="text-sm text-slate-500">Loading...</span>
                </div>
              )}
              <SignedOut>
                <SignInButton mode="modal">
                  <Button className="bg-trainlymainlight hover:bg-trainlymainlight/90 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-trainlymainlight/25 transition-all duration-200 flex items-center gap-2">
                    Start Building Free
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Button
                  className="bg-trainlymainlight hover:bg-trainlymainlight/90 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-trainlymainlight/25 transition-all duration-200 flex items-center gap-2"
                  onClick={() => router.push("/dashboard")}
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </SignedIn>
              <Button
                variant="faded"
                className="border-2 border-slate-200 dark:border-slate-700 hover:border-trainlymainlight/50 px-8 py-3 text-lg font-semibold rounded-xl transition-all duration-200 flex items-center gap-2"
                onClick={() =>
                  window.open("https://docs.trainlyai.com", "_blank")
                }
              >
                <Eye className="w-5 h-5" />
                View Demo
              </Button>
            </div>

            {/* Developer Stats */}
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Join developers building the future of AI
              </p>
              <div className="flex items-center gap-8 opacity-70">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    500+ developers
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Open Source
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    API First
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Key Features Preview */}
      <section className="py-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="group p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-trainlymainlight/30 transition-all duration-300 hover:shadow-xl hover:shadow-trainlymainlight/5">
              <div className="text-4xl font-bold bg-gradient-to-r from-trainlymainlight to-purple-600 bg-clip-text text-transparent mb-3">
                0%
              </div>
              <div className="text-slate-600 dark:text-slate-400 font-medium text-sm">
                Hallucinations with GraphRAG
              </div>
            </div>
            <div className="group p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-trainlymainlight/30 transition-all duration-300 hover:shadow-xl hover:shadow-trainlymainlight/5">
              <div className="text-4xl font-bold bg-gradient-to-r from-trainlymainlight to-purple-600 bg-clip-text text-transparent mb-3">
                API
              </div>
              <div className="text-slate-600 dark:text-slate-400 font-medium text-sm">
                Every chat becomes an endpoint
              </div>
            </div>
            <div className="group p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-trainlymainlight/30 transition-all duration-300 hover:shadow-xl hover:shadow-trainlymainlight/5">
              <div className="text-4xl font-bold bg-gradient-to-r from-trainlymainlight to-purple-600 bg-clip-text text-transparent mb-3">
                EDIT
              </div>
              <div className="text-slate-600 dark:text-slate-400 font-medium text-sm">
                Visual graph relationships
              </div>
            </div>
            <div className="group p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-trainlymainlight/30 transition-all duration-300 hover:shadow-xl hover:shadow-trainlymainlight/5">
              <div className="text-4xl font-bold bg-gradient-to-r from-trainlymainlight to-purple-600 bg-clip-text text-transparent mb-3">
                100%
              </div>
              <div className="text-slate-600 dark:text-slate-400 font-medium text-sm">
                Source traceability
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Everything you need to build trustworthy AI
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-4xl mx-auto leading-relaxed">
              Stop fighting black-box AI. With Trainly, you get complete
              visibility into how your AI makes decisions, plus the tools to
              build, edit, and deploy knowledge graphs as production APIs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {/* Graph RAG Feature */}
            <div className="group p-8 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-trainlymainlight/30 transition-all duration-300 hover:shadow-xl hover:shadow-trainlymainlight/5">
              <div className="w-16 h-16 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Zero Hallucination GraphRAG
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Knowledge graphs that understand relationships between concepts.
                Get accurate answers with complete traceability to source
                documents.
              </p>
              <div className="flex items-center gap-2 text-sm text-trainlymainlight font-semibold">
                <CheckCircle className="w-4 h-4" />
                <span>Eliminates AI hallucinations</span>
              </div>
            </div>

            {/* Visual Graph Editor */}
            <div className="group p-8 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-trainlymainlight/30 transition-all duration-300 hover:shadow-xl hover:shadow-trainlymainlight/5">
              <div className="w-16 h-16 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Visual Graph Editing
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                See exactly how your AI thinks. Interactive graph visualization
                lets you edit knowledge relationships with simple drag-and-drop.
              </p>
              <div className="flex items-center gap-2 text-sm text-trainlymainlight font-semibold">
                <CheckCircle className="w-4 h-4" />
                <span>Complete transparency</span>
              </div>
            </div>

            {/* Chat to API */}
            <div className="group p-8 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-trainlymainlight/30 transition-all duration-300 hover:shadow-xl hover:shadow-trainlymainlight/5">
              <div className="w-16 h-16 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                <Code className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Chat to API in Seconds
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Turn any conversation into a production-ready API endpoint.
                Perfect for rapid prototyping and building AI-powered apps.
              </p>
              <div className="flex items-center gap-2 text-sm text-trainlymainlight font-semibold">
                <CheckCircle className="w-4 h-4" />
                <span>Instant deployment</span>
              </div>
            </div>
          </div>

          {/* Developer Use Cases */}
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-slate-900 dark:text-white mb-8">
              Built for developers who care about quality
            </h3>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Whether you're building side projects or production apps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-start gap-6 p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-trainlymainlight/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-trainlymainlight" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  Rapid Prototyping
                </h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Upload documents, chat to test ideas, then export as API
                  endpoints. Perfect for hackathons and quick experiments.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6 p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-trainlymainlight/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-trainlymainlight" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  Trustworthy AI
                </h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Debug your AI's reasoning with visual graphs. See exactly
                  which documents influenced each answer.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6 p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-trainlymainlight/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Code className="w-6 h-6 text-trainlymainlight" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  Production Ready
                </h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Scale from prototype to production with proper API endpoints,
                  monitoring, and performance optimization.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6 p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-trainlymainlight/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-trainlymainlight" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  Developer Experience
                </h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Clean APIs, comprehensive docs, and SDKs for popular
                  languages. Built by developers, for developers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Community */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-12">
            Join the developer community
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-trainlymainlight mb-2">
                500+
              </div>
              <div className="text-slate-600 dark:text-slate-400">
                Developers
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-trainlymainlight mb-2">
                10k+
              </div>
              <div className="text-slate-600 dark:text-slate-400">
                API Calls
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-trainlymainlight mb-2">
                50+
              </div>
              <div className="text-slate-600 dark:text-slate-400">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-trainlymainlight mb-2">
                99%
              </div>
              <div className="text-slate-600 dark:text-slate-400">Uptime</div>
            </div>
          </div>
          <div className="flex justify-center items-center gap-8 opacity-70">
            <span className="text-lg font-medium text-slate-500 dark:text-slate-400">
              YC Startups
            </span>
            <span className="text-lg font-medium text-slate-500 dark:text-slate-400">
              Indie Hackers
            </span>
            <span className="text-lg font-medium text-slate-500 dark:text-slate-400">
              Research Labs
            </span>
            <span className="text-lg font-medium text-slate-500 dark:text-slate-400">
              Side Projects
            </span>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 bg-gradient-to-br from-trainlymainlight/5 via-purple-50/50 to-pink-50/50 dark:from-trainlymainlight/10 dark:via-slate-900 dark:to-slate-900">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Ready to build AI you can trust?
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join hundreds of developers who've discovered the power of
            explainable GraphRAG. Start building today with our free tier.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <SignedOut>
              <SignInButton mode="modal">
                <Button className="bg-trainlymainlight hover:bg-trainlymainlight/90 text-white px-10 py-4 text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl hover:shadow-trainlymainlight/25 transition-all duration-300 flex items-center gap-3">
                  Start Building Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Button
                className="bg-trainlymainlight hover:bg-trainlymainlight/90 text-white px-10 py-4 text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl hover:shadow-trainlymainlight/25 transition-all duration-300 flex items-center gap-3"
                onClick={() => router.push("/dashboard")}
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </Button>
            </SignedIn>

            <Button
              variant="faded"
              className="border-2 border-slate-300 dark:border-slate-600 hover:border-trainlymainlight/50 px-10 py-4 text-lg font-bold rounded-xl transition-all duration-300"
              onClick={() => router.push("/pricing")}
            >
              View Pricing
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              No credit card required • Free tier forever
            </p>
            <div className="flex justify-center items-center gap-12 text-slate-500">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">Setup in 2 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Your data stays yours
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span className="text-sm font-medium">API ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
