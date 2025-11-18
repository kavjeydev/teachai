"use client";

import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import { Button } from "@nextui-org/button";
import { useRouter } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";
import Navbar from "./components/navbar";
import { Spinner } from "@nextui-org/spinner";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";
import { HeroChatDemo } from "@/components/hero-chat-demo";
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
  ChevronDown,
  Play,
  Star,
  Globe,
  Layers,
  Brain,
  Loader2,
  Gift,
  X,
  FileText,
  BookOpen,
} from "lucide-react";
import { useNavigationLoading } from "@/hooks/useNavigationLoading";
import MarqueeDemo from "./components/marquee-component";
import { MockupCarousel } from "./components/mockup-carousel";

// Lazy load heavy components for better performance
const ParticlesBackground = dynamic(() => import("./components/particles"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-blue-900 to-amber-900"></div>
  ),
});

// Removed Spline scenes for performance

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
    <span className="overflow-hidden inline-block h-24 pt-8 pb-4 -mt-6">
      <span
        className={`inline-block transform transition-all duration-700 bg-gradient-to-t from-amber-600 to-amber-400 dark:from-amber-400 dark:to-amber-200
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
  const [mounted, setMounted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [showBetaListBanner, setShowBetaListBanner] = useState(false);
  const { isNavigating, navigateTo } = useNavigationLoading();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Adjust navbar position when banner is visible
  useEffect(() => {
    if (!mounted) return;

    const updateNavbarPosition = () => {
      const navbar = document.querySelector('nav');
      if (navbar) {
        if (showBetaListBanner) {
          navbar.style.top = window.innerWidth >= 640 ? '96px' : '88px';
        } else {
          navbar.style.top = '16px';
        }
      }
    };

    // Small delay to ensure navbar is rendered
    const timeoutId = setTimeout(updateNavbarPosition, 0);
    window.addEventListener('resize', updateNavbarPosition);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateNavbarPosition);
    };
  }, [showBetaListBanner, mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-zinc-50 to-zinc-100 dark:from-zinc-950 dark:via-black dark:to-zinc-950 text-zinc-900 dark:text-white overflow-hidden">
      {/* BetaList Special Offer Banner - Fixed at top */}
      {showBetaListBanner && (
        <div className="fixed top-0 left-0 right-0 z-[60] w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 dark:from-amber-600 dark:via-amber-500 dark:to-amber-600 border-b border-amber-600/20 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-pulse flex-shrink-0" />
              <p className="text-sm sm:text-base md:text-lg font-semibold text-white text-center">
                <span className="font-bold">BetaList users:</span> First 50 signups get{" "}
                <span className="font-bold underline decoration-2 underline-offset-2">1 month of Pro free</span>
              </p>
              <button
                onClick={() => setShowBetaListBanner(false)}
                className="ml-2 sm:ml-4 p-1.5 rounded-full hover:bg-white/20 transition-colors duration-200 flex-shrink-0"
                aria-label="Close banner"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
            </div>
          </div>
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer pointer-events-none"></div>
        </div>
      )}

      <Navbar />

      {/* Hero Section - Minimal Awwwards Style */}
      <section className="relative pt-56 pb-20 overflow-hidden min-h-screen flex flex-col justify-center">
        {/* Enhanced Background with subtle glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-100 via-white to-zinc-50 dark:from-black dark:via-zinc-950 dark:to-black"></div>

        {/* Enhanced floating elements for better glass visibility */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-amber-400/8 to-amber-600/8 rounded-full blur-3xl animate-float opacity-70"></div>
        <div
          className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-amber-400/4 to-blue-600/4 rounded-full blur-3xl animate-float opacity-50"
          style={{ animationDelay: "3s" }}
        ></div>
        <div
          className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-600/4 to-amber-600/4 rounded-full blur-3xl animate-float opacity-40"
          style={{ animationDelay: "6s" }}
        ></div>

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          {/* Header Content */}
          <div className="text-center mb-12">
            {/* Minimal Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 dark:border-white/20 text-zinc-600 dark:text-white/70 text-sm font-light mb-8 backdrop-blur-sm bg-white/50 dark:bg-transparent">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
              <span>Ship AI in minutes, not months</span>
            </div>

            {/* Main Headline - Responsive */}
            <h1
              className={`font-sans font-normal tracking-tight mb-6 leading-tight ${
                user
                  ? "text-5xl sm:text-6xl md:text-7xl lg:text-8xl"
                  : "text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
              }`}
            >
              <span className="block text-zinc-900 dark:text-white mb-2 tracking-tighter">
                The <span className="text-amber-400">GraphRAG</span> platform
              </span>
              <span className="block text-zinc-900 dark:text-white tracking-tighter">
                developers trust
              </span>
            </h1>

            {/* Minimal Subheadline */}
            <p className="text-lg md:text-xl text-zinc-600 dark:text-white/70 mb-8 max-w-2xl mx-auto leading-relaxed font-light tracking-tighter">
              Build production-ready AI with visual debugging, complete traceability, and APIs that ship in minutes—not months
            </p>
          </div>

          {/* Interactive Demo - Only for non-signed-in users */}
          {!user && (
            <div className="mb-12">
              <HeroChatDemo />
            </div>
          )}

          {/* CTA Buttons - Show for all users */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            {user === undefined && (
              <div className="flex items-center gap-2">
                <Spinner size="sm" />
                <span className="text-sm text-zinc-500 dark:text-white/50">
                  Loading...
                </span>
              </div>
            )}
            <SignedOut>
              <SignInButton mode="modal">
                <button className="group relative overflow-hidden bg-zinc-900 dark:bg-white text-white dark:text-black px-8 py-4 rounded-full font-medium text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-amber-400/25">
                  <span className="relative z-10 flex items-center gap-2">
                    Start Building Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-zinc-900 dark:bg-white group-hover:bg-transparent transition-colors duration-300"></div>
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <button
                className="group relative overflow-hidden bg-zinc-900 dark:bg-white text-white dark:text-black px-8 py-4 rounded-full font-medium text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-amber-400/25 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                onClick={() => navigateTo("/dashboard")}
                disabled={isNavigating}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isNavigating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Go to Dashboard
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-zinc-900 dark:bg-white group-hover:bg-transparent transition-colors duration-300"></div>
              </button>
            </SignedIn>
            <button
              className="group border border-zinc-300 dark:border-white/20 text-zinc-700 dark:text-white px-8 py-4 rounded-full font-medium text-lg transition-all duration-300 hover:border-amber-400 hover:bg-amber-400/5 backdrop-blur-sm flex items-center gap-2"
              onClick={() =>
                window.open("https://docs.trainlyai.com", "_blank")
              }
            >
              <Play className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              Watch Demo
            </button>
          </div>

          {/* Minimal Scroll Indicator */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <ChevronDown className="w-5 h-5 text-zinc-400 dark:text-white/30 animate-bounce" />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center mt-8">
          <MarqueeDemo />
          <MockupCarousel />
        </div>
      </section>

      {/* What is Trainly Section */}
      <section className="py-40 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-sans font-normal text-zinc-900 dark:text-white mb-8 leading-[0.9]">
              What is Trainly?
            </h2>
            <p className="text-xl md:text-2xl text-zinc-600 dark:text-white/70 max-w-3xl mx-auto leading-relaxed font-light">
              Trainly is the complete GraphRAG platform that transforms how developers build AI applications. 
              Upload documents, build knowledge graphs, and deploy production APIs—all with visual debugging and complete traceability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400/20 to-amber-600/20 rounded-xl flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-3">
                Upload & Process
              </h3>
              <p className="text-zinc-600 dark:text-white/70 leading-relaxed">
                Upload PDFs, documents, or entire folders. Trainly automatically extracts knowledge, 
                builds relationships, and creates a searchable knowledge graph.
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-xl flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-3">
                Visual Debugging
              </h3>
              <p className="text-zinc-600 dark:text-white/70 leading-relaxed">
                See exactly how your AI reasons. Visualize knowledge graphs, trace citations, 
                and debug responses like you debug code—with breakpoints and step-through.
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400/20 to-purple-600/20 rounded-xl flex items-center justify-center mb-6">
                <Code className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-3">
                Production APIs
              </h3>
              <p className="text-zinc-600 dark:text-white/70 leading-relaxed">
                Get instant API keys and REST endpoints. Integrate GraphRAG into your apps 
                in minutes with complete privacy controls and usage analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Ultra Minimal */}
      <section className="py-40 relative">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-16">
            <div className="text-center group">
              <div className="text-6xl md:text-7xl font-sans text-zinc-900 dark:text-white mb-4 group-hover:scale-105 transition-all duration-500">
                2min
              </div>
              <div className="text-zinc-500 dark:text-zinc-500 dark:text-white/50 font-light text-sm tracking-wide uppercase">
                to production
              </div>
            </div>
            <div className="text-center group">
              <div className="text-6xl md:text-7xl font-sans text-zinc-900 dark:text-white mb-4 group-hover:scale-105 transition-all duration-500">
                Safe
              </div>
              <div className="text-zinc-500 dark:text-zinc-500 dark:text-white/50 font-light text-sm tracking-wide uppercase">
                APIs
              </div>
            </div>
            <div className="text-center group">
              <div className="text-6xl md:text-7xl font-sans text-zinc-900 dark:text-white mb-4 group-hover:scale-105 transition-all duration-500">
                100%
              </div>
              <div className="text-zinc-500 dark:text-zinc-500 dark:text-white/50 font-light text-sm tracking-wide uppercase">
                source traceable
              </div>
            </div>
            <div className="text-center group">
              <div className="text-6xl md:text-7xl font-sans text-zinc-900 dark:text-white mb-4 group-hover:scale-105 transition-all duration-500">
                90%
              </div>
              <div className="text-zinc-500 dark:text-zinc-500 dark:text-white/50 font-light text-sm tracking-wide uppercase">
                fewer hallucinations
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Developers Choose Trainly */}
      <section className="py-40 relative bg-gradient-to-b from-transparent via-zinc-50/50 to-transparent dark:via-zinc-950/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-sans font-normal text-zinc-900 dark:text-white mb-8 leading-[0.9]">
              Why developers choose
              <br />
              <span className="text-amber-400">Trainly</span>
            </h2>
            <p className="text-xl text-zinc-600 dark:text-white/70 max-w-3xl mx-auto leading-relaxed font-light">
              Built by developers, for developers. Every feature is designed to make your life easier.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-400/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                    Privacy-First Architecture
                  </h3>
                  <p className="text-zinc-600 dark:text-white/70 leading-relaxed">
                    Complete data isolation. You can see usage analytics but never access raw user data. 
                    Perfect for B2B SaaS where privacy is non-negotiable.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-400/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Terminal className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                    Developer-Friendly APIs
                  </h3>
                  <p className="text-zinc-600 dark:text-white/70 leading-relaxed">
                    RESTful APIs with SDKs for Python and React. Simple authentication, 
                    comprehensive docs, and instant API keys. No vendor lock-in.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-400/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Eye className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                    Complete Transparency
                  </h3>
                  <p className="text-zinc-600 dark:text-white/70 leading-relaxed">
                    Every response includes citations. Visualize knowledge graphs, 
                    trace reasoning paths, and understand exactly how your AI works.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-400/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <GitBranch className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                    Custom Scopes & Filtering
                  </h3>
                  <p className="text-zinc-600 dark:text-white/70 leading-relaxed">
                    Organize knowledge with custom scopes. Filter by workspace, project, 
                    or any metadata. Perfect for multi-tenant applications.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-orange-400/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                    Production-Ready Analytics
                  </h3>
                  <p className="text-zinc-600 dark:text-white/70 leading-relaxed">
                    Privacy-first usage analytics. Track API calls, file uploads, 
                    and user activity without compromising data privacy.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-400/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                    Multi-User Support
                  </h3>
                  <p className="text-zinc-600 dark:text-white/70 leading-relaxed">
                    Built for teams. Each API key creates isolated user sessions. 
                    Perfect for SaaS applications serving multiple customers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section className="py-40 relative">
        <div className="max-w-6xl mx-auto px-6">
          {/* Minimal Section Header */}
          <div className="text-center mb-32">
            <h2 className="text-5xl md:text-7xl font-sans font-normal text-zinc-900 dark:text-white mb-8 leading-[0.9]">
              Ship AI faster than
              <br />
              <span className="text-zinc-900 dark:text-white">ever before</span>
            </h2>
          </div>

          {/* Enhanced Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {/* Visual Debugging */}
            <div className="group text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400/10 to-amber-600/10 rounded-full flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition-all duration-500 border border-amber-400/20">
                <Brain className="w-10 h-10 text-amber-400" />
              </div>
              <h3 className="text-2xl font-sans text-zinc-900 dark:text-white mb-6">
                Visual Debugging
              </h3>
              <p className="text-zinc-600 dark:text-white/70 leading-relaxed font-light mb-4">
                See your AI's reasoning process in real-time. Debug AI like code
                with visual breakpoints and step-through debugging.
              </p>
              <ul className="text-sm text-zinc-500 dark:text-white/50 space-y-2 text-left max-w-xs mx-auto">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Knowledge graph visualization</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Citation tracing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Reasoning path inspection</span>
                </li>
              </ul>
            </div>

            {/* GraphRAG */}
            <div className="group text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400/10 to-amber-600/10 rounded-full flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition-all duration-500 border border-amber-400/20">
                <Layers className="w-10 h-10 text-amber-400" />
              </div>
              <h3 className="text-2xl font-sans text-zinc-900 dark:text-white mb-6">
                Reliable GraphRAG
              </h3>
              <p className="text-zinc-600 dark:text-white/70 leading-relaxed font-light mb-4">
                Knowledge graphs with complete traceability. 90% fewer
                hallucinations guaranteed with source attribution.
              </p>
              <ul className="text-sm text-zinc-500 dark:text-white/50 space-y-2 text-left max-w-xs mx-auto">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Automatic relationship extraction</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>100% source traceability</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Neo4j-powered knowledge graphs</span>
                </li>
              </ul>
            </div>

            {/* Instant Deploy */}
            <div className="group text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400/10 to-amber-600/10 rounded-full flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition-all duration-500 border border-amber-400/20">
                <Zap className="w-10 h-10 text-amber-400" />
              </div>
              <h3 className="text-2xl font-sans text-zinc-900 dark:text-white mb-6">
                2-Minute Deploy
              </h3>
              <p className="text-zinc-600 dark:text-white/70 leading-relaxed font-light mb-4">
                From upload to production API in 120 seconds. No complex setup
                required—just upload and go.
              </p>
              <ul className="text-sm text-zinc-500 dark:text-white/50 space-y-2 text-left max-w-xs mx-auto">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Instant API keys</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>RESTful endpoints</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Python & React SDKs</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-40 relative bg-gradient-to-b from-transparent via-zinc-50/50 to-transparent dark:via-zinc-950/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-sans font-normal text-zinc-900 dark:text-white mb-8 leading-[0.9]">
              How it works
            </h2>
            <p className="text-xl text-zinc-600 dark:text-white/70 max-w-3xl mx-auto leading-relaxed font-light">
              From document upload to production API in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center mb-6 text-white font-bold text-xl">
                  1
                </div>
                <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
                  Upload Documents
                </h3>
                <p className="text-zinc-600 dark:text-white/70 leading-relaxed mb-4">
                  Upload PDFs, Word docs, or text files. Trainly automatically processes 
                  them and builds a knowledge graph with relationships and entities.
                </p>
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <FileText className="w-4 h-4" />
                  <span>Supports PDF, DOC, DOCX, TXT</span>
                </div>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-amber-400 to-transparent z-10"></div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-6 text-white font-bold text-xl">
                  2
                </div>
                <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
                  Test & Debug
                </h3>
                <p className="text-zinc-600 dark:text-white/70 leading-relaxed mb-4">
                  Ask questions and see how your AI reasons. Visualize the knowledge graph, 
                  trace citations, and debug responses in real-time.
                </p>
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <Eye className="w-4 h-4" />
                  <span>Visual debugging included</span>
                </div>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-400 to-transparent z-10"></div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-6 text-white font-bold text-xl">
                  3
                </div>
                <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
                  Deploy API
                </h3>
                <p className="text-zinc-600 dark:text-white/70 leading-relaxed mb-4">
                  Get instant API keys and integrate GraphRAG into your application. 
                  Complete with usage analytics and privacy controls.
                </p>
                <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                  <Code className="w-4 h-4" />
                  <span>REST APIs & SDKs ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Use Cases */}
      <section className="py-40 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-sans font-normal text-zinc-900 dark:text-white mb-8 leading-[0.9]">
              Built for developers
            </h2>
            <p className="text-xl text-zinc-600 dark:text-white/70 max-w-3xl mx-auto leading-relaxed font-light">
              Powering AI applications across industries
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-400/10 rounded-lg flex items-center justify-center">
                  <Code className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                  SaaS Applications
                </h3>
              </div>
              <p className="text-zinc-600 dark:text-white/70 leading-relaxed">
                Build AI-powered features into your SaaS product. Multi-tenant support, 
                privacy-first analytics, and instant API integration.
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-400/10 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                  Documentation Assistants
                </h3>
              </div>
              <p className="text-zinc-600 dark:text-white/70 leading-relaxed">
                Create intelligent documentation chatbots. Upload technical docs, 
                get instant answers with citations, and visualize knowledge relationships.
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-400/10 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                  Customer Support
                </h3>
              </div>
              <p className="text-zinc-600 dark:text-white/70 leading-relaxed">
                Build AI support agents with complete knowledge bases. Visual debugging 
                helps you understand and improve responses before deployment.
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-400/10 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                  Research & Analysis
                </h3>
              </div>
              <p className="text-zinc-600 dark:text-white/70 leading-relaxed">
                Analyze research papers, legal documents, or technical specifications. 
                Visualize relationships and trace insights back to source material.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof - Ultra Minimal */}
      <section className="py-32 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50">
            <span className="text-sm font-light text-zinc-400 dark:text-white/40 tracking-widest uppercase">
              YC Startups
            </span>
            <span className="text-sm font-light text-zinc-400 dark:text-white/40 tracking-widest uppercase">
              Research Labs
            </span>
            <span className="text-sm font-light text-zinc-400 dark:text-white/40 tracking-widest uppercase">
              Indie Hackers
            </span>
            <span className="text-sm font-light text-zinc-400 dark:text-white/40 tracking-widest uppercase">
              Fortune 500
            </span>
          </div>
        </div>
      </section>

      {/* Final CTA - Ultra Minimal */}
      <section className="py-40 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-6xl md:text-8xl font-sans font-normal text-black dark:text-white mb-12 leading-[0.9]">
            Ready to build with
            <br />
            <span className="text-amber-400">Trainly?</span>
          </h2>
          <p className="text-xl text-zinc-600 dark:text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            Join developers who are shipping production AI faster than ever. 
            Start free, no credit card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="group relative overflow-hidden bg-zinc-900 dark:bg-white text-white dark:text-black px-12 py-4 rounded-full font-medium text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-amber-400/25">
                  <span className="relative z-10 flex items-center gap-2">
                    Start Building Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-zinc-900 dark:bg-white group-hover:bg-transparent transition-colors duration-300"></div>
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <button
                className="group relative overflow-hidden bg-zinc-900 dark:bg-white text-white dark:text-black px-12 py-4 rounded-full font-medium text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-amber-400/25 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                onClick={() => navigateTo("/dashboard")}
                disabled={isNavigating}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isNavigating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Go to Dashboard
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-zinc-900 dark:bg-white group-hover:bg-transparent transition-colors duration-300"></div>
              </button>
            </SignedIn>
          </div>

          <div className="text-center opacity-60 mb-12">
            <p className="text-sm text-zinc-400 dark:text-white/40 font-light tracking-wide mb-6">
              No credit card • Free forever
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-xs text-zinc-500 dark:text-white/50 font-light">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-400" />
                <span>Full API access</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-400" />
                <span>500 AI credits/month</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-400" />
                <span>Visual debugging</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-400" />
                <span>GraphRAG included</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-zinc-200 dark:border-white/10 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm text-zinc-500 dark:text-white/50 font-light">
              © {new Date().getFullYear()} Trainly AI. All rights reserved.
            </div>
            <div className="flex gap-8">
              <button
                onClick={() => router.push("/privacy-policy")}
                className="text-sm text-zinc-600 dark:text-white/70 hover:text-amber-400 dark:hover:text-amber-400 transition-colors duration-200 font-light"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => router.push("/terms-of-service")}
                className="text-sm text-zinc-600 dark:text-white/70 hover:text-amber-400 dark:hover:text-amber-400 transition-colors duration-200 font-light"
              >
                Terms of Service
              </button>
              <button
                onClick={() => router.push("/data-handling")}
                className="text-sm text-zinc-600 dark:text-white/70 hover:text-amber-400 dark:hover:text-amber-400 transition-colors duration-200 font-light"
              >
                Data Handling
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
