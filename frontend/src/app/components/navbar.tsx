"use client";
import { ModeToggle } from "@/components/mode-toggle";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  SignUpButton,
  useUser,
} from "@clerk/nextjs";
import { Popover, PopoverTrigger, PopoverContent } from "@nextui-org/popover";
import { useRouter } from "next/navigation";
import { Spinner } from "@nextui-org/spinner";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, Loader2 } from "lucide-react";
import { useNavigationLoading } from "@/hooks/useNavigationLoading";

export default function Navbar() {
  const router = useRouter();
  const { user } = useUser();
  const { theme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isNavigating, navigateTo } = useNavigationLoading();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Floating Glass Navbar */}
      <nav
        className="fixed top-4 left-1/2 z-50 navbar-width-transition"
        style={{
          transform: "translateX(-50%)",
          width: isScrolled ? "95%" : "90%",
          maxWidth: isScrolled ? "72rem" : "64rem",
        }}
      >
        <div
          className={`glass backdrop-blur-xl bg-white/90 dark:bg-black/20 rounded-2xl transition-all duration-300`}
        >
          <div className="px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => navigateTo("/")}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <img
                      src="/trainly_icon_black.png"
                      alt="Trainly Logo"
                      className="w-8 h-8 block dark:hidden"
                    />
                    <img
                      src="/trainly_icon_white.png"
                      alt="Trainly Logo"
                      className="w-8 h-8 hidden dark:block"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl opacity-0 group-hover:opacity-20 blur-md transition-all duration-300"></div>
                </div>
                <span className="text-2xl font-sans text-zinc-900 dark:text-white group-hover:text-amber-400 transition-colors duration-300">
                  trainly
                </span>
              </div>

              {/* Desktop Navigation Links */}
              <div className="hidden lg:flex items-center gap-8">
                <button
                  className="relative text-zinc-700 dark:text-white/80 hover:text-zinc-900 dark:hover:text-white font-medium transition-all duration-300 group py-2 flex items-center gap-2"
                  onClick={() => navigateTo("/")}
                  disabled={isNavigating}
                >
                  {isNavigating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  Home
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-400 transition-all duration-300 group-hover:w-full rounded-full"></span>
                  <div className="absolute inset-0 bg-zinc-100 dark:bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 -z-10"></div>
                </button>
                <button
                  className="relative text-zinc-700 dark:text-white/80 hover:text-zinc-900 dark:hover:text-white font-medium transition-all duration-300 group py-2"
                  onClick={() => navigateTo("/pricing")}
                >
                  Pricing
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-400 transition-all duration-300 group-hover:w-full rounded-full"></span>
                  <div className="absolute inset-0 bg-zinc-100 dark:bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 -z-10"></div>
                </button>
                <button
                  className="relative text-zinc-700 dark:text-white/80 hover:text-zinc-900 dark:hover:text-white font-medium transition-all duration-300 group py-2"
                  onClick={() =>
                    window.open("https://docs.trainlyai.com", "_blank")
                  }
                >
                  Docs
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-400 transition-all duration-300 group-hover:w-full rounded-full"></span>
                  <div className="absolute inset-0 bg-zinc-100 dark:bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 -z-10"></div>
                </button>
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center gap-4">
                {/* Theme Toggle - Hidden on mobile for space */}
                <div className="hidden md:block">
                  <ModeToggle />
                </div>

                {user === undefined && (
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" />
                    <span className="text-sm text-white/60 hidden sm:block">
                      Loading...
                    </span>
                  </div>
                )}

                <SignedOut>
                  <div className="hidden md:flex items-center gap-3">
                    <SignInButton mode="modal">
                      <Button
                        variant="outline"
                        className="glass border border-white/20 dark:text-white text-black hover:text-amber-400 hover:border-amber-400/50 rounded-xl backdrop-blur-sm bg-white/5 hover:bg-white/10 transition-all duration-300"
                      >
                        Sign In
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-400/90 hover:to-amber-600/90 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-amber-400/25 hover:shadow-amber-400/40 transition-all duration-300 hover:scale-105">
                        Get Started
                      </Button>
                    </SignUpButton>
                  </div>

                  {/* Mobile Sign In Button */}
                  <div className="md:hidden">
                    <SignInButton mode="modal">
                      <Button className="bg-gradient-to-r from-amber-400 to-amber-600 dark:text-white text-black font-semibold px-4 py-2 rounded-xl shadow-lg shadow-amber-400/25 text-sm">
                        Sign In
                      </Button>
                    </SignInButton>
                  </div>
                </SignedOut>

                <SignedIn>
                  <Popover placement="bottom-end">
                    <PopoverTrigger>
                      <div className="flex items-center gap-2 cursor-pointer p-2 rounded-xl glass bg-white/5 hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-white/20">
                        <img
                          src={user?.imageUrl}
                          alt="Profile"
                          className="w-8 h-8 rounded-full ring-2 ring-white/20"
                        />
                        <span className="hidden sm:block text-sm font-medium text-zinc-700 dark:text-white/90">
                          {user?.firstName}
                        </span>
                        <ChevronDown className="w-4 h-4 text-zinc-500 dark:text-white/60 hidden sm:block" />
                      </div>
                    </PopoverTrigger>

                    <PopoverContent className="glass backdrop-blur-xl bg-white/95 dark:bg-black/20 border border-zinc-200/60 dark:border-white/20 rounded-2xl shadow-2xl">
                      <div className="p-4 min-w-[220px]">
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-200 dark:border-white/20">
                          <img
                            src={user?.imageUrl}
                            alt="Profile"
                            className="w-12 h-12 rounded-full ring-2 ring-zinc-200 dark:ring-white/20"
                          />
                          <div>
                            <p className="font-semibold text-zinc-900 dark:text-white">
                              {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-sm text-zinc-600 dark:text-white/60 truncate max-w-[120px]">
                              {user?.primaryEmailAddress?.emailAddress}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            className="w-full justify-start glass bg-amber-400/20 text-zinc-900 dark:text-white border-amber-400/30 hover:bg-amber-400/30 hover:border-amber-400/50 transition-all duration-300"
                            onClick={() => navigateTo("/dashboard")}
                            disabled={isNavigating}
                          >
                            {isNavigating && (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            )}
                            Dashboard
                          </Button>

                          <SignOutButton>
                            <Button
                              variant="outline"
                              className="w-full justify-start glass bg-red-500/10 text-zinc-900 dark:text-white border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-300"
                            >
                              Sign Out
                            </Button>
                          </SignOutButton>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </SignedIn>

                {/* Mobile Menu Button */}
                <button
                  className="lg:hidden glass bg-white/5 hover:bg-white/10 border border-white/20 p-2 rounded-xl transition-all duration-300"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5 text-white" />
                  ) : (
                    <Menu className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="absolute top-24 left-4 right-4 glass backdrop-blur-xl bg-white/95 dark:bg-black/20 border border-zinc-200/60 dark:border-white/20 rounded-2xl shadow-2xl navbar-glow dark:navbar-glow-dark">
            <div className="p-6">
              <div className="flex flex-col gap-4">
                <button
                  className="text-zinc-700 dark:text-white/80 hover:text-zinc-900 dark:hover:text-white font-medium text-left py-3 px-4 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-all duration-300 flex items-center gap-2"
                  onClick={() => {
                    navigateTo("/");
                    setIsMobileMenuOpen(false);
                  }}
                  disabled={isNavigating}
                >
                  {isNavigating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Home
                </button>
                <button
                  className="text-zinc-700 dark:text-white/80 hover:text-zinc-900 dark:hover:text-white font-medium text-left py-3 px-4 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-all duration-300"
                  onClick={() => {
                    navigateTo("/pricing");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Pricing
                </button>
                <button
                  className="text-zinc-700 dark:text-white/80 hover:text-zinc-900 dark:hover:text-white font-medium text-left py-3 px-4 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-all duration-300"
                  onClick={() => {
                    window.open("https://docs.trainlyai.com", "_blank");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Docs
                </button>

                {/* Theme Toggle in Mobile Menu */}
                <div className="pt-2 border-t border-zinc-200 dark:border-white/20">
                  <div className="flex items-center justify-between py-3 px-4">
                    <span className="text-zinc-700 dark:text-white/80 font-medium">
                      Theme
                    </span>
                    <ModeToggle />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
