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
} from "lucide-react";

const ParticlesBackground = dynamic(() => import("./components/particles"), {
  ssr: false,
});

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
  const [mounted, setMounted] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-black dark:to-slate-950 text-slate-900 dark:text-white overflow-hidden">
      <Navbar />

      {/* Hero Section - Minimal Awwwards Style */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Enhanced Background with subtle glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100 via-white to-slate-50 dark:from-black dark:via-slate-950 dark:to-black"></div>

        {/* Enhanced floating elements for better glass visibility */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-trainlymainlight/15 to-purple-600/15 dark:from-trainlymainlight/8 dark:to-purple-600/8 rounded-full blur-3xl animate-float opacity-70"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-trainlymainlight/8 to-blue-600/8 dark:from-trainlymainlight/4 dark:to-blue-600/4 rounded-full blur-3xl animate-float opacity-50" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-br from-purple-600/8 to-pink-600/8 dark:from-purple-600/4 dark:to-pink-600/4 rounded-full blur-3xl animate-float opacity-40" style={{ animationDelay: '6s' }}></div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          {/* Minimal Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 text-sm font-light mb-12 backdrop-blur-sm bg-white/50 dark:bg-transparent">
            <div className="w-1.5 h-1.5 bg-trainlymainlight rounded-full"></div>
            <span>Ship AI in minutes, not months</span>
          </div>

          {/* Main Headline - Ultra Minimal */}
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-viaoda font-normal tracking-tight mb-8 leading-[0.9]">
            <span className="block text-slate-900 dark:text-white/95 mb-2">
              AI you can
            </span>
            <span className="block bg-gradient-to-r from-trainlymainlight via-purple-400 to-trainlymainlight bg-clip-text text-transparent">
              see & shape
            </span>
          </h1>

          {/* Minimal Subheadline */}
          <p className="text-lg md:text-xl text-slate-600 dark:text-white/60 mb-16 max-w-2xl mx-auto leading-relaxed font-light">
            Ship production AI in 2 minutes with visual GraphRAG debugging
          </p>

          {/* Premium CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-24">
            {user === undefined && (
              <div className="flex items-center gap-2">
                <Spinner size="sm" />
                <span className="text-sm text-slate-500 dark:text-white/50">Loading...</span>
              </div>
            )}
            <SignedOut>
              <SignInButton mode="modal">
                <button className="group relative overflow-hidden bg-slate-900 dark:bg-white text-white dark:text-black px-8 py-4 rounded-full font-medium text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-trainlymainlight/25">
                  <span className="relative z-10 flex items-center gap-2">
                    Start Building Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-trainlymainlight to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-slate-900 dark:bg-white group-hover:bg-transparent transition-colors duration-300"></div>
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <button
                className="group relative overflow-hidden bg-slate-900 dark:bg-white text-white dark:text-black px-8 py-4 rounded-full font-medium text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-trainlymainlight/25"
                onClick={() => router.push("/dashboard")}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-trainlymainlight to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-slate-900 dark:bg-white group-hover:bg-transparent transition-colors duration-300"></div>
              </button>
            </SignedIn>
            <button
              className="group border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white px-8 py-4 rounded-full font-medium text-lg transition-all duration-300 hover:border-trainlymainlight hover:bg-trainlymainlight/5 dark:hover:border-white/40 dark:hover:bg-white/5 backdrop-blur-sm flex items-center gap-2"
              onClick={() => window.open("https://docs.trainlyai.com", "_blank")}
            >
              <Play className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              Watch Demo
            </button>
          </div>

          {/* Minimal Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <ChevronDown className="w-5 h-5 text-slate-400 dark:text-white/30 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Stats Section - Ultra Minimal */}
      <section className="py-40 relative">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-16">
            <div className="text-center group">
              <div className="text-6xl md:text-7xl font-viaoda bg-gradient-to-r from-trainlymainlight to-purple-400 bg-clip-text text-transparent mb-4 group-hover:scale-105 transition-all duration-500">
                2min
              </div>
              <div className="text-slate-500 dark:text-slate-400 font-light text-sm tracking-wide uppercase">to production</div>
            </div>
            <div className="text-center group">
              <div className="text-6xl md:text-7xl font-viaoda bg-gradient-to-r from-trainlymainlight to-purple-400 bg-clip-text text-transparent mb-4 group-hover:scale-105 transition-all duration-500">
                90%
              </div>
              <div className="text-slate-500 dark:text-slate-400 font-light text-sm tracking-wide uppercase">fewer hallucinations</div>
            </div>
            <div className="text-center group">
              <div className="text-6xl md:text-7xl font-viaoda bg-gradient-to-r from-trainlymainlight to-purple-400 bg-clip-text text-transparent mb-4 group-hover:scale-105 transition-all duration-500">
                100%
              </div>
              <div className="text-slate-500 dark:text-slate-400 font-light text-sm tracking-wide uppercase">source traceable</div>
            </div>
            <div className="text-center group">
              <div className="text-6xl md:text-7xl font-viaoda bg-gradient-to-r from-trainlymainlight to-purple-400 bg-clip-text text-transparent mb-4 group-hover:scale-105 transition-all duration-500">
                500+
              </div>
              <div className="text-slate-500 dark:text-slate-400 font-light text-sm tracking-wide uppercase">developers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Ultra Minimal */}
      <section className="py-40 relative">
        <div className="max-w-6xl mx-auto px-6">
          {/* Minimal Section Header */}
          <div className="text-center mb-32">
            <h2 className="text-5xl md:text-7xl font-viaoda font-normal text-slate-900 dark:text-white mb-8 leading-[0.9]">
              Ship AI faster than
              <br />
              <span className="bg-gradient-to-r from-trainlymainlight to-purple-400 bg-clip-text text-transparent">
                ever before
              </span>
            </h2>
          </div>

          {/* Minimal Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {/* Visual Debugging */}
            <div className="group text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-trainlymainlight/10 to-purple-600/10 rounded-full flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition-all duration-500 border border-trainlymainlight/20">
                <Brain className="w-10 h-10 text-trainlymainlight" />
              </div>
              <h3 className="text-2xl font-viaoda text-slate-900 dark:text-white mb-6">
                Visual Debugging
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-light">
                See your AI's reasoning process in real-time. Debug AI like code with visual breakpoints.
              </p>
            </div>

            {/* GraphRAG */}
            <div className="group text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-trainlymainlight/10 to-purple-600/10 rounded-full flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition-all duration-500 border border-trainlymainlight/20">
                <Layers className="w-10 h-10 text-trainlymainlight" />
              </div>
              <h3 className="text-2xl font-viaoda text-slate-900 dark:text-white mb-6">
                Reliable GraphRAG
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-light">
                Knowledge graphs with complete traceability. 90% fewer hallucinations guaranteed.
              </p>
            </div>

            {/* Instant Deploy */}
            <div className="group text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-trainlymainlight/10 to-purple-600/10 rounded-full flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition-all duration-500 border border-trainlymainlight/20">
                <Zap className="w-10 h-10 text-trainlymainlight" />
              </div>
              <h3 className="text-2xl font-viaoda text-slate-900 dark:text-white mb-6">
                2-Minute Deploy
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-light">
                From upload to production API in 120 seconds. No complex setup required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof - Ultra Minimal */}
      <section className="py-32 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex justify-center items-center gap-16 opacity-50">
            <span className="text-sm font-light text-slate-400 dark:text-slate-500 tracking-widest uppercase">YC Startups</span>
            <span className="text-sm font-light text-slate-400 dark:text-slate-500 tracking-widest uppercase">Research Labs</span>
            <span className="text-sm font-light text-slate-400 dark:text-slate-500 tracking-widest uppercase">Indie Hackers</span>
            <span className="text-sm font-light text-slate-400 dark:text-slate-500 tracking-widest uppercase">Fortune 500</span>
          </div>
        </div>
      </section>

      {/* Final CTA - Ultra Minimal */}
      <section className="py-40 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-6xl md:text-8xl font-viaoda font-normal text-slate-900 dark:text-white mb-12 leading-[0.9]">
            Ready to build?
          </h2>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="group relative overflow-hidden bg-slate-900 dark:bg-white text-white dark:text-black px-12 py-4 rounded-full font-medium text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-trainlymainlight/25">
                  <span className="relative z-10 flex items-center gap-2">
                    Start Building Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-trainlymainlight to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-slate-900 dark:bg-white group-hover:bg-transparent transition-colors duration-300"></div>
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <button
                className="group relative overflow-hidden bg-slate-900 dark:bg-white text-white dark:text-black px-12 py-4 rounded-full font-medium text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-trainlymainlight/25"
                onClick={() => router.push("/dashboard")}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-trainlymainlight to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-slate-900 dark:bg-white group-hover:bg-transparent transition-colors duration-300"></div>
              </button>
            </SignedIn>
          </div>

          <div className="text-center opacity-60">
            <p className="text-sm text-slate-400 dark:text-slate-500 font-light tracking-wide">
              No credit card • Free forever
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}