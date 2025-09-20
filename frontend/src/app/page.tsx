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
              <Zap className="w-4 h-4" />
              <span>Ship AI in Minutes, Not Months</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-8 leading-[0.9] font-inter">
              <span className="bg-gradient-to-r from-trainlymainlight via-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI you can see,
              </span>
              <br />
              <span className="text-slate-700 dark:text-slate-300">
                shape, and ship
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed font-inter">
              Ship reliable AI in{" "}
              <strong className="text-trainlymainlight">2 minutes</strong> with
              visual GraphRAG debugging. See exactly how your AI thinks, fix
              knowledge gaps instantly, and deploy production APIs with reduced
              hallucinations.
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
                2 min
              </div>
              <div className="text-slate-600 dark:text-slate-400 font-medium text-sm">
                From idea to production API
              </div>
            </div>
            <div className="group p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-trainlymainlight/30 transition-all duration-300 hover:shadow-xl hover:shadow-trainlymainlight/5">
              <div className="text-4xl font-bold bg-gradient-to-r from-trainlymainlight to-purple-600 bg-clip-text text-transparent mb-3">
                DEBUG
              </div>
              <div className="text-slate-600 dark:text-slate-400 font-medium text-sm">
                Visual AI reasoning paths
              </div>
            </div>
            <div className="group p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-trainlymainlight/30 transition-all duration-300 hover:shadow-xl hover:shadow-trainlymainlight/5">
              <div className="text-4xl font-bold bg-gradient-to-r from-trainlymainlight to-purple-600 bg-clip-text text-transparent mb-3">
                90%
              </div>
              <div className="text-slate-600 dark:text-slate-400 font-medium text-sm">
                Fewer hallucinations with GraphRAG
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
            <h2 className="text-5xl font-bold text-slate-900 dark:text-white mb-6 font-inter">
              Ship AI faster than ever before
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-4xl mx-auto leading-relaxed font-inter">
              Stop debugging black-box AI for weeks. With Trainly, you get{" "}
              <strong className="text-trainlymainlight">
                visual debugging tools
              </strong>
              ,
              <strong className="text-trainlymainlight">
                {" "}
                instant API deployment
              </strong>
              , and complete transparency into your AI's reasoning—all in
              minutes, not months.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {/* Graph RAG Feature */}
            <div className="group p-8 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-trainlymainlight/30 transition-all duration-300 hover:shadow-xl hover:shadow-trainlymainlight/5">
              <div className="w-16 h-16 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 font-inter">
                Reliable GraphRAG
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed font-inter">
                Knowledge graphs that understand relationships between concepts.
                Get accurate answers with complete traceability to source
                documents.
              </p>
              <div className="flex items-center gap-2 text-sm text-trainlymainlight font-semibold">
                <CheckCircle className="w-4 h-4" />
                <span>Dramatically reduces hallucinations</span>
              </div>
            </div>

            {/* Visual Graph Editor */}
            <div className="group p-8 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-trainlymainlight/30 transition-all duration-300 hover:shadow-xl hover:shadow-trainlymainlight/5">
              <div className="w-16 h-16 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                <Terminal className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 font-inter">
                Debug Your AI Like Code
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed font-inter">
                Set breakpoints on AI reasoning. Visual graph debugging shows
                exactly which knowledge influenced each decision—just like
                debugging code.
              </p>
              <div className="flex items-center gap-2 text-sm text-trainlymainlight font-semibold">
                <CheckCircle className="w-4 h-4" />
                <span>Visual debugging tools</span>
              </div>
            </div>

            {/* Chat to API */}
            <div className="group p-8 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-trainlymainlight/30 transition-all duration-300 hover:shadow-xl hover:shadow-trainlymainlight/5">
              <div className="w-16 h-16 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 font-inter">
                Ship in 2 Minutes
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed font-inter">
                From upload to production API in 120 seconds. No complex setup,
                no infrastructure headaches—just upload, chat, and deploy.
              </p>
              <div className="flex items-center gap-2 text-sm text-trainlymainlight font-semibold">
                <CheckCircle className="w-4 h-4" />
                <span>Lightning-fast deployment</span>
              </div>
            </div>
          </div>

          {/* Developer Use Cases */}
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-slate-900 dark:text-white mb-8 font-inter">
              Built for developers who ship fast
            </h3>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-inter">
              Stop wasting weeks debugging AI. Start shipping reliable AI
              products in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-start gap-6 p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-trainlymainlight/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-trainlymainlight" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3 font-inter">
                  2-Minute MVP
                </h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-inter">
                  Upload docs → Chat → Deploy API. From zero to demo in 120
                  seconds. Perfect for hackathons, investor demos, and rapid
                  validation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6 p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-trainlymainlight/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Terminal className="w-6 h-6 text-trainlymainlight" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  AI Debugging Like Code
                </h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Set breakpoints, inspect variables, trace execution paths.
                  Debug AI reasoning with the same tools you use for code.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6 p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-trainlymainlight/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-trainlymainlight" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  Scale Without Rewrites
                </h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Your 2-minute prototype becomes production-ready
                  automatically. No migration headaches, no architectural
                  rewrites.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6 p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-trainlymainlight/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <GitBranch className="w-6 h-6 text-trainlymainlight" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  Ship & Iterate Fast
                </h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Deploy instantly, debug visually, iterate quickly. The fastest
                  way to go from AI idea to paying customers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Community */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-12 font-inter">
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
          <h2 className="text-5xl font-bold text-slate-900 dark:text-white mb-6 font-inter">
            Ready to build AI you can trust?
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed font-inter">
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
                <span className="text-sm font-medium">Deploy in 2 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                <span className="text-sm font-medium">Visual AI debugging</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Scale instantly</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
