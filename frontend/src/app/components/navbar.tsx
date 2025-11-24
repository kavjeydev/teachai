"use client";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  SignUpButton,
  useUser,
} from "@clerk/nextjs";
import { Popover, PopoverTrigger, PopoverContent } from "@nextui-org/popover";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Spinner } from "@nextui-org/spinner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import {
  Menu,
  X,
  ChevronDown,
  Loader2,
  FileText,
  Code,
  Shield,
  Users,
  Database,
  Network,
} from "lucide-react";
import { useNavigationLoading } from "@/hooks/useNavigationLoading";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDevelopersDropdownOpen, setIsDevelopersDropdownOpen] =
    useState(false);
  const [isUseCasesDropdownOpen, setIsUseCasesDropdownOpen] = useState(false);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [developersDropdownTimeout, setDevelopersDropdownTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const [useCasesDropdownTimeout, setUseCasesDropdownTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const { isNavigating, navigateTo } = useNavigationLoading();
  const isLandingPage = pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 20);

      // Show navbar when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY) {
        // Scrolling up
        setIsNavbarVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past 100px
        setIsNavbarVisible(false);
      }

      // Always show navbar at the top
      if (currentScrollY < 10) {
        setIsNavbarVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (developersDropdownTimeout) {
        clearTimeout(developersDropdownTimeout);
      }
      if (useCasesDropdownTimeout) {
        clearTimeout(useCasesDropdownTimeout);
      }
    };
  }, [developersDropdownTimeout, useCasesDropdownTimeout]);

  // Use cases data
  const useCases = [
    {
      icon: Code,
      title: "AI Support Agent Trained on All Your Product Knowledge",
      days: 5,
    },
    {
      icon: Database,
      title: "Automate Insights from Logs, Dashboards, and Operational Data",
      days: 3,
    },
    {
      icon: FileText,
      title: "AI Tutor Trained on Your Video Playlists",
      days: 1,
    },
    {
      icon: Network,
      title: "AI Day Planner That Learns From Your Habits and Past Behavior",
      days: 7,
    },
  ];

  return (
    <>
      {/* Standard Navbar */}
      <nav
        style={
          {
            transform: isNavbarVisible ? "translateY(0)" : "translateY(-100%)",
            transition: "transform 0.3s ease-in-out",
            willChange: "transform",
          } as React.CSSProperties
        }
        className={`navbar-scroll-transition fixed top-0 left-0 right-0 z-50 border-b ${
          isLandingPage
            ? "bg-black border-white/15"
            : "bg-white dark:bg-black border-zinc-200 dark:border-white/10"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigateTo("/")}
            >
              <Image
                src="/trainly_icon_black.png"
                alt="Trainly Logo"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span
                className={`text-xl font-semibold ${isLandingPage ? "text-white" : "text-zinc-900 dark:text-white"}`}
              >
                trainly
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1">
              {/* Developers Dropdown */}
              <div
                onMouseEnter={() => {
                  if (developersDropdownTimeout) {
                    clearTimeout(developersDropdownTimeout);
                    setDevelopersDropdownTimeout(null);
                  }
                  setIsDevelopersDropdownOpen(true);
                }}
                onMouseLeave={() => {
                  const timeout = setTimeout(() => {
                    setIsDevelopersDropdownOpen(false);
                  }, 200);
                  setDevelopersDropdownTimeout(timeout);
                }}
              >
                <DropdownMenu
                  open={isDevelopersDropdownOpen}
                  onOpenChange={setIsDevelopersDropdownOpen}
                  modal={false}
                >
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${isLandingPage ? "text-white hover:text-white hover:bg-white/10" : "text-zinc-700 dark:text-white/80 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10"}`}
                      onMouseEnter={() => {
                        if (developersDropdownTimeout) {
                          clearTimeout(developersDropdownTimeout);
                          setDevelopersDropdownTimeout(null);
                        }
                        setIsDevelopersDropdownOpen(true);
                      }}
                    >
                      Developers
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className={`w-[320px] max-w-[calc(100vw-2rem)] p-4 ${isLandingPage ? "bg-zinc-900 border-white/20" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/20"}`}
                    sideOffset={8}
                    onCloseAutoFocus={(e) => e.preventDefault()}
                    onMouseEnter={() => {
                      if (developersDropdownTimeout) {
                        clearTimeout(developersDropdownTimeout);
                        setDevelopersDropdownTimeout(null);
                      }
                      setIsDevelopersDropdownOpen(true);
                    }}
                    onMouseLeave={() => {
                      const timeout = setTimeout(() => {
                        setIsDevelopersDropdownOpen(false);
                      }, 200);
                      setDevelopersDropdownTimeout(timeout);
                    }}
                  >
                    <div>
                      {/* Resources Column */}
                      <div>
                        <DropdownMenuLabel
                          className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isLandingPage ? "text-white/60" : "text-zinc-500 dark:text-white/60"}`}
                        >
                          Resources
                        </DropdownMenuLabel>
                        <div className="space-y-1">
                          <DropdownMenuItem
                            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer ${isLandingPage ? "hover:bg-white/10" : "hover:bg-zinc-100 dark:hover:bg-white/10"}`}
                            onClick={() =>
                              window.open(
                                "https://docs.trainlyai.com",
                                "_blank",
                              )
                            }
                          >
                            <FileText
                              className={`w-5 h-5 mt-0.5 ${isLandingPage ? "text-white/80" : "text-zinc-600 dark:text-white/80"}`}
                            />
                            <div>
                              <div
                                className={`font-medium text-sm ${isLandingPage ? "text-white" : "text-zinc-900 dark:text-white"}`}
                              >
                                Docs
                              </div>
                              <div
                                className={`text-xs mt-0.5 ${isLandingPage ? "text-white/60" : "text-zinc-500 dark:text-white/60"}`}
                              >
                                Integrate Trainly into your product
                              </div>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer ${isLandingPage ? "hover:bg-white/10" : "hover:bg-zinc-100 dark:hover:bg-white/10"}`}
                            onClick={() =>
                              window.open(
                                "https://docs.trainlyai.com/api-reference/introduction",
                                "_blank",
                              )
                            }
                          >
                            <Code
                              className={`w-5 h-5 mt-0.5 ${isLandingPage ? "text-white/80" : "text-zinc-600 dark:text-white/80"}`}
                            />
                            <div>
                              <div
                                className={`font-medium text-sm ${isLandingPage ? "text-white" : "text-zinc-900 dark:text-white"}`}
                              >
                                API Reference
                              </div>
                              <div
                                className={`text-xs mt-0.5 ${isLandingPage ? "text-white/60" : "text-zinc-500 dark:text-white/60"}`}
                              >
                                APIs to access Trainly
                              </div>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer ${isLandingPage ? "hover:bg-white/10" : "hover:bg-zinc-100 dark:hover:bg-white/10"}`}
                            onClick={() =>
                              window.open(
                                "https://docs.trainlyai.com/api-reference/scope-management",
                                "_blank",
                              )
                            }
                          >
                            <Users
                              className={`w-5 h-5 mt-0.5 ${isLandingPage ? "text-white/80" : "text-zinc-600 dark:text-white/80"}`}
                            />
                            <div>
                              <div
                                className={`font-medium text-sm ${isLandingPage ? "text-white" : "text-zinc-900 dark:text-white"}`}
                              >
                                Data Scoping
                              </div>
                              <div
                                className={`text-xs mt-0.5 ${isLandingPage ? "text-white/60" : "text-zinc-500 dark:text-white/60"}`}
                              >
                                Separate data for multi-user applications
                              </div>
                            </div>
                          </DropdownMenuItem>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* <button
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isLandingPage ? "text-white/80 hover:text-white hover:bg-white/10" : "text-zinc-700 dark:text-white/80 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10"}`}
                onClick={() => navigateTo("/resources")}
              >
                Resources
              </button> */}

              {/* Use Cases Dropdown */}
              <div
                onMouseEnter={() => {
                  if (useCasesDropdownTimeout) {
                    clearTimeout(useCasesDropdownTimeout);
                    setUseCasesDropdownTimeout(null);
                  }
                  setIsUseCasesDropdownOpen(true);
                }}
                onMouseLeave={() => {
                  const timeout = setTimeout(() => {
                    setIsUseCasesDropdownOpen(false);
                  }, 200);
                  setUseCasesDropdownTimeout(timeout);
                }}
              >
                <DropdownMenu
                  open={isUseCasesDropdownOpen}
                  onOpenChange={setIsUseCasesDropdownOpen}
                  modal={false}
                >
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${isLandingPage ? "text-white hover:text-white hover:bg-white/10" : "text-zinc-700 dark:text-white/80 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10"}`}
                      onMouseEnter={() => {
                        if (useCasesDropdownTimeout) {
                          clearTimeout(useCasesDropdownTimeout);
                          setUseCasesDropdownTimeout(null);
                        }
                        setIsUseCasesDropdownOpen(true);
                      }}
                    >
                      Usecases
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className={`w-[600px] max-w-[calc(100vw-2rem)] p-4 ${isLandingPage ? "bg-zinc-900 border-white/20" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/20"}`}
                    sideOffset={8}
                    onCloseAutoFocus={(e) => e.preventDefault()}
                    onMouseEnter={() => {
                      if (useCasesDropdownTimeout) {
                        clearTimeout(useCasesDropdownTimeout);
                        setUseCasesDropdownTimeout(null);
                      }
                      setIsUseCasesDropdownOpen(true);
                    }}
                    onMouseLeave={() => {
                      const timeout = setTimeout(() => {
                        setIsUseCasesDropdownOpen(false);
                      }, 200);
                      setUseCasesDropdownTimeout(timeout);
                    }}
                  >
                    <div className="grid grid-cols-2 gap-6">
                      {useCases.map((useCase, index) => {
                        const IconComponent = useCase.icon;
                        return (
                          <DropdownMenuItem
                            key={index}
                            className="flex items-start gap-3 p-3 rounded-lg cursor-not-allowed opacity-50"
                            onClick={(e) => e.preventDefault()}
                            disabled
                          >
                            <IconComponent
                              className={`w-5 h-5 mt-0.5 ${isLandingPage ? "text-white/40" : "text-zinc-400 dark:text-white/40"}`}
                            />
                            <div className="flex-1">
                              <div
                                className={`font-medium text-sm ${isLandingPage ? "text-white/60" : "text-zinc-500 dark:text-white/60"}`}
                              >
                                {useCase.title}
                              </div>
                              <div
                                className={`text-xs mt-0.5 ${isLandingPage ? "text-white/40" : "text-zinc-400 dark:text-white/40"}`}
                              >
                                Coming soon
                              </div>
                            </div>
                          </DropdownMenuItem>
                        );
                      })}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <button
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isLandingPage ? "text-white/80 hover:text-white hover:bg-white/10" : "text-zinc-700 dark:text-white/80 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10"}`}
                onClick={() => navigateTo("/pricing")}
              >
                Pricing
              </button>
              <button
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isLandingPage ? "text-white/80 hover:text-white hover:bg-white/10" : "text-zinc-700 dark:text-white/80 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10"}`}
                onClick={() => navigateTo("/about")}
              >
                About
              </button>
              <button
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isLandingPage ? "text-white/80 hover:text-white hover:bg-white/10" : "text-zinc-700 dark:text-white/80 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10"}`}
                onClick={() =>
                  window.open("https://docs.trainlyai.com", "_blank")
                }
              >
                Docs
              </button>
              <button
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isLandingPage ? "text-white/80 hover:text-white hover:bg-white/10" : "text-zinc-700 dark:text-white/80 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10"}`}
                onClick={() =>
                  (window.location.href = "mailto:support@trainlyai.com")
                }
              >
                Support
              </button>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {user === undefined && (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                </div>
              )}

              <SignedOut>
                <div className="hidden md:flex items-center gap-3">
                  <SignUpButton mode="modal">
                    <Button
                      className={`${isLandingPage ? "bg-white text-black hover:bg-white/90" : "bg-white dark:bg-white text-black hover:bg-zinc-100 dark:hover:bg-zinc-100"} font-medium px-4 py-2 rounded-lg transition-colors`}
                    >
                      Get Started
                    </Button>
                  </SignUpButton>
                </div>

                {/* Mobile Menu Button */}
                <button
                  className="md:hidden p-2 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  <Menu
                    className={`w-5 h-5 ${isLandingPage ? "text-white" : "text-zinc-900 dark:text-white"}`}
                  />
                </button>
              </SignedOut>

              <SignedIn>
                <div className="hidden md:block">
                  <Popover placement="bottom-end">
                    <PopoverTrigger>
                      <div
                        className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-colors ${isLandingPage ? "hover:bg-white/10" : "hover:bg-zinc-100 dark:hover:bg-white/10"}`}
                      >
                        <img
                          src={user?.imageUrl}
                          alt="Profile"
                          className="w-8 h-8 rounded-full"
                        />
                        <span
                          className={`text-sm font-medium ${isLandingPage ? "text-white" : "text-zinc-900 dark:text-white"}`}
                        >
                          {user?.firstName}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 ${isLandingPage ? "text-white/60" : "text-zinc-500 dark:text-white/60"}`}
                        />
                      </div>
                    </PopoverTrigger>

                    <PopoverContent
                      className={`${isLandingPage ? "bg-zinc-900 border-white/20" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/20"} rounded-lg shadow-lg`}
                    >
                      <div className="p-2 min-w-[200px]">
                        <div
                          className={`flex items-center gap-3 mb-3 pb-3 border-b ${isLandingPage ? "border-white/20" : "border-zinc-200 dark:border-white/20"}`}
                        >
                          <img
                            src={user?.imageUrl}
                            alt="Profile"
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p
                              className={`font-semibold text-sm ${isLandingPage ? "text-white" : "text-zinc-900 dark:text-white"}`}
                            >
                              {user?.firstName} {user?.lastName}
                            </p>
                            <p
                              className={`text-xs ${isLandingPage ? "text-white/60" : "text-zinc-600 dark:text-white/60"} truncate max-w-[120px]`}
                            >
                              {user?.primaryEmailAddress?.emailAddress}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            className={`w-full justify-start ${isLandingPage ? "text-white hover:bg-white/10" : "text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10"}`}
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
                              variant="ghost"
                              className={`w-full justify-start ${isLandingPage ? "text-white hover:bg-white/10" : "text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10"}`}
                            >
                              Sign Out
                            </Button>
                          </SignOutButton>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Mobile Menu Button */}
                <button
                  className="md:hidden p-2 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  <Menu
                    className={`w-5 h-5 ${isLandingPage ? "text-white" : "text-zinc-900 dark:text-white"}`}
                  />
                </button>
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div
            className={`absolute top-12 left-0 right-0 ${isLandingPage ? "bg-zinc-900 border-t border-white/10" : "bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-white/10"} shadow-lg`}
          >
            <div className="p-4">
              <div className="flex flex-col gap-1">
                <button
                  className={`${isLandingPage ? "text-white hover:bg-white/10" : "text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10"} font-medium text-left py-3 px-4 rounded-lg transition-colors`}
                  onClick={() => {
                    navigateTo("/");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Products
                </button>
                <button
                  className={`${isLandingPage ? "text-white hover:bg-white/10" : "text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10"} font-medium text-left py-3 px-4 rounded-lg transition-colors`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Developers
                </button>
                <button
                  className={`${isLandingPage ? "text-white hover:bg-white/10" : "text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10"} font-medium text-left py-3 px-4 rounded-lg transition-colors`}
                  onClick={() => {
                    navigateTo("/resources");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Resources
                </button>
                <button
                  className={`${isLandingPage ? "text-white hover:bg-white/10" : "text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10"} font-medium text-left py-3 px-4 rounded-lg transition-colors`}
                  onClick={() => {
                    navigateTo("/usecases");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Usecases
                </button>
                <button
                  className={`${isLandingPage ? "text-white hover:bg-white/10" : "text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10"} font-medium text-left py-3 px-4 rounded-lg transition-colors`}
                  onClick={() => {
                    navigateTo("/pricing");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Pricing
                </button>
                <button
                  className={`${isLandingPage ? "text-white hover:bg-white/10" : "text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10"} font-medium text-left py-3 px-4 rounded-lg transition-colors`}
                  onClick={() => {
                    navigateTo("/about");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  About
                </button>
                <button
                  className={`${isLandingPage ? "text-white hover:bg-white/10" : "text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10"} font-medium text-left py-3 px-4 rounded-lg transition-colors`}
                  onClick={() => {
                    window.open("https://docs.trainlyai.com", "_blank");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Docs
                </button>
                <button
                  className={`${isLandingPage ? "text-white hover:bg-white/10" : "text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10"} font-medium text-left py-3 px-4 rounded-lg transition-colors`}
                  onClick={() => {
                    window.location.href = "mailto:support@trainlyai.com";
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Support
                </button>

                <div className="pt-4 mt-4 border-t border-white/10 dark:border-white/10">
                  <SignUpButton mode="modal">
                    <Button
                      className={`w-full ${isLandingPage ? "bg-white text-black hover:bg-white/90" : "bg-white dark:bg-white text-black hover:bg-zinc-100 dark:hover:bg-zinc-100"} font-medium`}
                    >
                      Get Started
                    </Button>
                  </SignUpButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
