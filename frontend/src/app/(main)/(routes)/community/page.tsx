"use client";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/navbar";
import {
  Users,
  TrendingUp,
  Zap,
  Eye,
  ExternalLink,
  Star,
  GitFork,
  Code,
  Sparkles,
} from "lucide-react";

export default function CommunityPage() {
  const publicChats = useQuery(api.chats.getPublicChats);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-400/20 bg-amber-400/5 text-amber-400 text-sm font-medium mb-6">
              <Code className="w-4 h-4" />
              <span>Developer Showcase</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-zinc-900 dark:text-white mb-6">
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                Built by
              </span>
              <br />
              <span className="text-zinc-700 dark:text-zinc-300">
                developers
              </span>
            </h1>

            <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-4xl mx-auto leading-relaxed">
              Explore amazing projects built with Trainly. From AI chatbots to
              knowledge management systems, see what's possible with GraphRAG.
            </p>
          </div>

          {/* Developer Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <div className="text-center p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:border-amber-400/30 transition-all duration-300">
              <div className="text-3xl font-bold text-amber-400 mb-2">500+</div>
              <div className="text-zinc-600 dark:text-zinc-400">Developers</div>
            </div>
            <div className="text-center p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:border-amber-400/30 transition-all duration-300">
              <div className="text-3xl font-bold text-amber-400 mb-2">50+</div>
              <div className="text-zinc-600 dark:text-zinc-400">
                Open Projects
              </div>
            </div>
            <div className="text-center p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:border-amber-400/30 transition-all duration-300">
              <div className="text-3xl font-bold text-amber-400 mb-2">10k+</div>
              <div className="text-zinc-600 dark:text-zinc-400">API Calls</div>
            </div>
            <div className="text-center p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:border-amber-400/30 transition-all duration-300">
              <div className="text-3xl font-bold text-amber-400 mb-2">99%</div>
              <div className="text-zinc-600 dark:text-zinc-400">Uptime</div>
            </div>
          </div>

          {/* Featured Projects */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {publicChats?.map((chat) => (
              <div
                key={chat._id}
                className="group cursor-pointer"
                onClick={() => {
                  window.open(`/preview/${chat._id}`, "_blank");
                }}
              >
                <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-700 hover:border-amber-400/50 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-400/10 overflow-hidden">
                  {/* Project Preview */}
                  <div className="h-40 bg-gradient-to-br from-amber-400/10 via-amber-50 to-amber-400/5 dark:from-amber-400/20 dark:via-zinc-700 dark:to-amber-400/10 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent"></div>
                    <div className="relative z-10 flex items-center justify-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <TrendingUp className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    {/* Floating Elements */}
                    <div className="absolute top-4 left-4 w-3 h-3 bg-amber-400/30 rounded-full animate-pulse"></div>
                    <div className="absolute top-8 right-6 w-2 h-2 bg-amber-400/40 rounded-full animate-pulse delay-300"></div>
                    <div className="absolute bottom-6 left-8 w-2 h-2 bg-amber-400/40 rounded-full animate-pulse delay-700"></div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-amber-400 transition-colors line-clamp-2">
                        {chat.title}
                      </h3>
                      <ExternalLink className="w-5 h-5 text-zinc-400 group-hover:text-amber-400 transition-colors flex-shrink-0 ml-2" />
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>
                          {Math.floor(Math.random() * 1000) + 100} views
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        <span>{Math.floor(Math.random() * 50) + 10}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <GitFork className="w-4 h-4" />
                        <span>{Math.floor(Math.random() * 20) + 5}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-2 py-1 bg-amber-400/10 text-amber-400 text-xs font-medium rounded-md">
                        GraphRAG
                      </span>
                      <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium rounded-md">
                        Open Source
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        Developer Project
                      </span>
                      <div className="flex items-center gap-1 text-sm text-amber-400 font-medium group-hover:gap-2 transition-all">
                        <span>Explore</span>
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Empty State */}
      {!publicChats?.length && (
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-amber-400/20 to-amber-100 dark:from-amber-400/20 dark:to-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Sparkles className="w-16 h-16 text-amber-400" />
            </div>

            <h2 className="text-4xl font-bold text-zinc-900 dark:text-white mb-6">
              Developer Showcase Coming Soon
            </h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Be among the first developers to share your GraphRAG projects.
              Show off what you've built and inspire the community.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button
                onClick={() => router.push("/dashboard")}
                className="bg-amber-400 hover:bg-amber-400/90 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-amber-400/25"
              >
                <Zap className="w-5 h-5" />
                Start Building
              </button>

              <button
                onClick={() =>
                  window.open("https://docs.trainlyai.com", "_blank")
                }
                className="border-2 border-zinc-200 dark:border-zinc-700 hover:border-amber-400/50 px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
              >
                <Eye className="w-5 h-5" />
                View Examples
              </button>
            </div>

            {/* Coming Soon Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                <div className="w-12 h-12 bg-amber-400/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Code className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-white mb-2">
                  Project Templates
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                  Starter templates for common developer use cases and patterns
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                <div className="w-12 h-12 bg-amber-400/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Star className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-white mb-2">
                  Developer Voting
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                  Upvote amazing projects and discover trending implementations
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                <div className="w-12 h-12 bg-amber-400/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <GitFork className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-white mb-2">
                  Fork & Remix
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                  Build upon existing projects and create your own variations
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
