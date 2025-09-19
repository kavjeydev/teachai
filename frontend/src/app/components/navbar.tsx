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

export default function Navbar() {
  const router = useRouter();
  const { user } = useUser();
  const { theme } = useTheme();

  return (
    <nav className="fixed top-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => router.push("/")}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-trainlymainlight transition-colors">
              trainly
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <button
              className="text-slate-600 dark:text-slate-300 hover:text-trainlymainlight dark:hover:text-trainlymainlight font-medium transition-colors relative group"
              onClick={() => router.push("/")}
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-trainlymainlight transition-all duration-200 group-hover:w-full"></span>
            </button>
            <button
              className="text-slate-600 dark:text-slate-300 hover:text-trainlymainlight dark:hover:text-trainlymainlight font-medium transition-colors relative group"
              onClick={() => router.push("/pricing")}
            >
              Pricing
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-trainlymainlight transition-all duration-200 group-hover:w-full"></span>
            </button>
            <button
              className="text-slate-600 dark:text-slate-300 hover:text-trainlymainlight dark:hover:text-trainlymainlight font-medium transition-colors relative group"
              onClick={() =>
                window.open("https://docs.trainlyai.com", "_blank")
              }
            >
              Docs
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-trainlymainlight transition-all duration-200 group-hover:w-full"></span>
            </button>
            <button
              className="text-slate-600 dark:text-slate-300 hover:text-trainlymainlight dark:hover:text-trainlymainlight font-medium transition-colors relative group"
              onClick={() => router.push("/community")}
            >
              Community
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-trainlymainlight transition-all duration-200 group-hover:w-full"></span>
            </button>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            <ModeToggle />

            {user === undefined && (
              <div className="flex items-center gap-2">
                <Spinner size="sm" />
                <span className="text-sm text-slate-500">Loading...</span>
              </div>
            )}

            <SignedOut>
              <div className="hidden md:flex items-center gap-3">
                <SignInButton mode="modal">
                  <Button
                    variant="outline"
                    className="text-slate-600 dark:text-slate-300 hover:text-trainlymainlight border-slate-200 dark:border-slate-700 hover:border-trainlymainlight/50 rounded-lg"
                  >
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button className="bg-trainlymainlight hover:bg-trainlymainlight/90 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg hover:shadow-trainlymainlight/25 transition-all duration-200">
                    Get Started
                  </Button>
                </SignUpButton>
              </div>
            </SignedOut>

            <SignedIn>
              <Popover placement="bottom-end">
                <PopoverTrigger>
                  <div className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <img
                      src={user?.imageUrl}
                      alt="Profile"
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="hidden md:block text-sm font-medium text-slate-700 dark:text-slate-300">
                      {user?.firstName}
                    </span>
                  </div>
                </PopoverTrigger>

                <PopoverContent>
                  <div className="p-4 min-w-[200px]">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                      <img
                        src={user?.imageUrl}
                        alt="Profile"
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {user?.primaryEmailAddress?.emailAddress}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-trainlymainlight/10 text-trainlymainlight hover:bg-trainlymainlight/20"
                        onClick={() => router.push("/dashboard")}
                      >
                        Dashboard
                      </Button>

                      <SignOutButton>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-slate-600 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Sign Out
                        </Button>
                      </SignOutButton>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  );
}
