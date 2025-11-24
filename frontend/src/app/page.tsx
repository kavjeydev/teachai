"use client";

import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import { Button } from "@nextui-org/button";
import { useRouter } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";
import Navbar from "./components/navbar";
import { Spinner } from "@nextui-org/spinner";
import dynamic from "next/dynamic";
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";
import { HeroChatDemo } from "@/components/hero-chat-demo";
import {
  ArrowRight,
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
  Loader2,
  Gift,
  X,
} from "lucide-react";
import { useNavigationLoading } from "@/hooks/useNavigationLoading";
import MarqueeDemo from "./components/marquee-component";
import FeatureCards from "./components/feature-cards";
import CommitmentSection from "./components/commitment-section";
import UseCasesSection from "./components/use-cases-section";
import Footer from "./components/footer";

// Lazy load heavy components for better performance
const ParticlesBackground = dynamic(() => import("./components/particles"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-blue-900 to-amber-900"></div>
  ),
});

// Removed Spline scenes for performance

export default function Home() {
  const router = useRouter();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [showBetaListBanner, setShowBetaListBanner] = useState(false);
  const { isNavigating, navigateTo } = useNavigationLoading();

  // Force dark mode on landing page by adding dark class to html element
  // This ensures child components (Navbar, etc.) render in dark mode
  useEffect(() => {
    const htmlElement = document.documentElement;
    htmlElement.classList.add("dark");

    return () => {
      // Remove dark class on unmount to let theme system restore correct theme
      // This only runs when navigating away from landing page
      htmlElement.classList.remove("dark");
    };
  }, []);

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
      const navbar = document.querySelector("nav");
      if (navbar) {
        if (showBetaListBanner) {
          navbar.style.top = window.innerWidth >= 640 ? "96px" : "88px";
        } else {
          navbar.style.top = "0px";
        }
      }
    };

    // Small delay to ensure navbar is rendered
    const timeoutId = setTimeout(updateNavbarPosition, 0);
    window.addEventListener("resize", updateNavbarPosition);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updateNavbarPosition);
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
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-950 text-white overflow-hidden">
      {/* BetaList Special Offer Banner - Fixed at top */}
      {showBetaListBanner && (
        <div className="fixed top-0 left-0 right-0 z-[60] w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 border-b border-amber-600/20 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-pulse flex-shrink-0" />
              <p className="text-sm sm:text-base md:text-lg font-semibold text-white text-center">
                <span className="font-bold">BetaList users:</span> First 50
                signups get{" "}
                <span className="font-bold underline decoration-2 underline-offset-2">
                  1 month of Pro free
                </span>
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
      <section className="relative pt-48 pb-20 overflow-hidden min-h-screen flex flex-col justify-center">
        {/* Enhanced Background with subtle glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black"></div>

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
            <div className="mb-8 flex justify-center">
              <a
                target="_blank"
                href="https://betalist.com/startups/trainly?utm_campaign=badge-trainly&utm_medium=badge&utm_source=badge-featured"
                rel="noopener noreferrer"
              >
                <img
                  alt="Trainly - Build Graph-RAG apps in minutes: upload your docs, get an instant API | BetaList"
                  width="156"
                  height="54"
                  style={{ width: "156px", height: "54px" }}
                  src="https://betalist.com/badges/featured?id=138641&theme=dark"
                />
              </a>
            </div>

            {/* Main Headline - Responsive */}
            <h1
              className={`font-sans font-semibold tracking-tight mb-6 leading-tight ${
                user
                  ? "text-5xl sm:text-5xl md:text-6xl lg:text-7xl"
                  : "text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
              }`}
            >
              <span className="block text-white mb-2 tracking-tighter">
                The Fastest Way to <span className="text-amber-400">Ship</span>
              </span>
              <span className="block text-white tracking-tighter">
                AI Features
              </span>
            </h1>

            {/* Minimal Subheadline */}
            <p className="text-lg md:text-xl text-white/70 mb-8 max-w-2xl mx-auto leading-relaxed font-light tracking-tighter">
              Trainly ingests your data, builds a graph knowledge base, and
              exposes it through clean APIs so you can ship in days, not months.
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
                <span className="text-sm text-white/50">Loading...</span>
              </div>
            )}
            <SignedOut>
              <SignInButton mode="modal">
                <button className="group bg-white text-black px-8 py-4 rounded-full font-medium text-lg transition-all duration-300 hover:bg-white/90 flex items-center gap-2 shadow-lg shadow-black/20">
                  Start Building Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <button
                className="group bg-white text-black px-8 py-4 rounded-full font-medium text-lg transition-all duration-300 hover:bg-white/90 flex items-center gap-2 shadow-lg shadow-black/20 disabled:opacity-70 disabled:cursor-not-allowed"
                onClick={() => navigateTo("/dashboard")}
                disabled={isNavigating}
              >
                {isNavigating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </button>
            </SignedIn>
            <button
              className="group border border-white/40 bg-white/5 text-white px-8 py-4 rounded-full font-medium text-lg transition-all duration-300 hover:border-amber-400 hover:bg-amber-400/10 backdrop-blur-sm flex items-center gap-2 shadow-lg shadow-black/20"
              onClick={() =>
                window.open(
                  "https://docs.trainlyai.com/api-reference/introduction",
                  "_blank",
                )
              }
            >
              <Code className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              API Docs
            </button>
          </div>

          {/* Minimal Scroll Indicator */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <ChevronDown className="w-5 h-5 text-white/30 animate-bounce" />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center mt-8">
          <MarqueeDemo />
        </div>
      </section>

      <FeatureCards />

      {/* <CommitmentSection /> */}

      <UseCasesSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
