"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { AnimatedBeam } from "@/components/magicui/animated-beam";
import { motion } from "motion/react";

function InstantAPIVisualization() {
  const endpoints = [
    { method: "POST", path: "/v1/{chat_id}/answer_question" },
    { method: "POST", path: "/v1/me/chats/files/upload" },
    { method: "GET", path: "/v1/{chat_id}/info" },
  ];

  return (
    <div className="space-y-2">
      {endpoints.map((endpoint, index) => (
        <div
          key={index}
          className="bg-white rounded-lg p-3 relative overflow-hidden"
          style={{
            boxShadow:
              "0 2px 16px rgba(0, 0, 0, 0.1), 0 -2px 4px rgba(255, 255, 255, 0.9), 0 0 20px rgba(251, 191, 36, 0.1)",
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <code className="text-zinc-600 font-mono text-xs">
              <span className="text-zinc-400">{endpoint.method}</span>{" "}
              {endpoint.path}
            </code>
          </div>
        </div>
      ))}
    </div>
  );
}

function CitationsVisualization() {
  const citations = [
    {
      id: 1,
      title: "api-reference.md",
      description:
        "Section 3.2: GraphRAG implementation details and best practices...",
    },
    {
      id: 2,
      title: "getting-started.md",
      description:
        "Quick start guide: Upload documents and configure your knowledge graph...",
    },
    {
      id: 3,
      title: "examples.md",
      description:
        "Code examples: Building RAG applications with Trainly's Graph API...",
    },
  ];

  return (
    <div className="space-y-3">
      {/* AI Response */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-zinc-50 rounded-lg p-3 border border-zinc-200"
        style={{
          boxShadow: "0 0 20px rgba(251, 191, 36, 0.08)",
        }}
      >
        <div className="text-xs text-zinc-600 mb-2 font-medium">
          AI Response
        </div>
        <div className="text-sm text-zinc-800 leading-relaxed">
          Based on the documentation, Trainly provides a comprehensive API for
          building Graph-RAG applications...
        </div>
      </motion.div>

      {/* Citations */}
      <div className="space-y-2">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-xs text-zinc-500 font-medium uppercase tracking-wide"
        >
          Citations
        </motion.div>
        <div className="space-y-2">
          {citations.map((citation, index) => (
            <motion.div
              key={citation.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.3 + index * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ scale: 1.02, x: 4 }}
              className="bg-white rounded-lg p-2.5 border border-zinc-200 hover:border-amber-400 transition-colors cursor-pointer"
              style={{
                boxShadow: "0 0 15px rgba(251, 191, 36, 0.1)",
              }}
            >
              <div className="flex items-start gap-2">
                <motion.div
                  className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 flex-shrink-0"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.8, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.3,
                    ease: "easeInOut",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-zinc-800 truncate">
                    {citation.title}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                    {citation.description}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GraphVisualization() {
  const containerRef = useRef<HTMLDivElement>(null);
  const node1Ref = useRef<HTMLDivElement>(null);
  const node2Ref = useRef<HTMLDivElement>(null);
  const node3Ref = useRef<HTMLDivElement>(null);
  const node4Ref = useRef<HTMLDivElement>(null);
  const node5Ref = useRef<HTMLDivElement>(null);
  const node6Ref = useRef<HTMLDivElement>(null);
  const node7Ref = useRef<HTMLDivElement>(null);
  const node8Ref = useRef<HTMLDivElement>(null);
  const node9Ref = useRef<HTMLDivElement>(null);
  const node10Ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="relative h-40 flex items-center justify-center"
      style={{
        filter: "drop-shadow(0 0 15px rgba(251, 191, 36, 0.15))",
      }}
    >
      {/* Node 1 - Top Left (clustered) */}
      <div ref={node1Ref} className="absolute top-3 left-[18%] z-10">
        <div className="w-4 h-4 bg-zinc-400 rounded-full border-2 border-zinc-500"></div>
      </div>
      {/* Node 2 - Upper Center-Left */}
      <div ref={node2Ref} className="absolute top-8 left-[42%] z-10">
        <div className="w-3 h-3 bg-zinc-300 rounded-full border-2 border-zinc-400"></div>
      </div>
      {/* Node 3 - Upper Far Right (isolated) */}
      <div ref={node3Ref} className="absolute top-12 right-4 z-10">
        <div className="w-3 h-3 bg-zinc-300 rounded-full border-2 border-zinc-400"></div>
      </div>
      {/* Node 4 - Middle Left (highlighted) */}
      <div ref={node4Ref} className="absolute top-[32%] left-5 z-10">
        <div className="w-4 h-4 bg-amber-400 rounded-full border-2 border-amber-500"></div>
      </div>
      {/* Node 5 - Middle Upper-Right (clustered) */}
      <div ref={node5Ref} className="absolute top-[28%] right-[22%] z-10">
        <div className="w-3 h-3 bg-zinc-400 rounded-full border-2 border-zinc-500"></div>
      </div>
      {/* Node 6 - Middle Lower-Right */}
      <div ref={node6Ref} className="absolute top-[52%] right-[15%] z-10">
        <div className="w-4 h-4 bg-zinc-300 rounded-full border-2 border-zinc-400"></div>
      </div>
      {/* Node 7 - Lower Left (clustered) */}
      <div ref={node7Ref} className="absolute bottom-20 left-8 z-10">
        <div className="w-3 h-3 bg-zinc-300 rounded-full"></div>
      </div>
      {/* Node 8 - Lower Center-Left */}
      <div ref={node8Ref} className="absolute bottom-14 left-[38%] z-10">
        <div className="w-3 h-3 bg-zinc-300 rounded-full"></div>
      </div>
      {/* Node 9 - Lower Right (spread) */}
      <div ref={node9Ref} className="absolute bottom-10 right-[28%] z-10">
        <div className="w-3 h-3 bg-zinc-300 rounded-full"></div>
      </div>
      {/* Node 10 - Bottom Far Right */}
      <div ref={node10Ref} className="absolute bottom-3 right-6 z-10">
        <div className="w-3 h-3 bg-zinc-300 rounded-full"></div>
      </div>

      {/* Animated Beams - Asymmetrical connections */}
      {/* Top cluster to middle left */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={node1Ref}
        toRef={node4Ref}
        curvature={-75}
        duration={3.2}
        delay={0}
        pathColor="#a1a1aa"
        pathWidth={1.5}
        gradientStartColor="#fbbf24"
        gradientStopColor="#a78bfa"
      />
      {/* Top left to center-left */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={node1Ref}
        toRef={node2Ref}
        curvature={25}
        duration={3.8}
        delay={0.15}
        pathColor="#a1a1aa"
        pathWidth={1}
        gradientStartColor="#fbbf24"
        gradientStopColor="#a78bfa"
      />
      {/* Center-left to upper-right cluster */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={node2Ref}
        toRef={node5Ref}
        curvature={-60}
        duration={4.1}
        delay={0.3}
        pathColor="#a1a1aa"
        pathWidth={1}
        gradientStartColor="#fbbf24"
        gradientStopColor="#a78bfa"
      />
      {/* Isolated top-right to middle-right */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={node3Ref}
        toRef={node6Ref}
        curvature={-45}
        duration={3.6}
        delay={0.25}
        pathColor="#a1a1aa"
        pathWidth={1}
        gradientStartColor="#fbbf24"
        gradientStopColor="#a78bfa"
      />
      {/* Middle-left (highlighted) to lower-left cluster */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={node4Ref}
        toRef={node7Ref}
        curvature={65}
        duration={3.4}
        delay={0.1}
        pathColor="#a1a1aa"
        pathWidth={1.5}
        gradientStartColor="#fbbf24"
        gradientStopColor="#a78bfa"
      />
      {/* Middle-left to lower center-left */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={node4Ref}
        toRef={node8Ref}
        curvature={-35}
        duration={3.9}
        delay={0.45}
        pathColor="#a1a1aa"
        pathWidth={1}
        gradientStartColor="#fbbf24"
        gradientStopColor="#a78bfa"
      />
      {/* Upper-right cluster to lower center-left */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={node5Ref}
        toRef={node8Ref}
        curvature={55}
        duration={4.3}
        delay={0.55}
        pathColor="#a1a1aa"
        pathWidth={1}
        gradientStartColor="#fbbf24"
        gradientStopColor="#a78bfa"
      />
      {/* Middle-right to lower-right */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={node6Ref}
        toRef={node9Ref}
        curvature={45}
        duration={3.5}
        delay={0.65}
        pathColor="#a1a1aa"
        pathWidth={1}
        gradientStartColor="#fbbf24"
        gradientStopColor="#a78bfa"
      />
      {/* Middle-right to bottom-right */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={node6Ref}
        toRef={node10Ref}
        curvature={70}
        duration={4}
        delay={0.75}
        pathColor="#a1a1aa"
        pathWidth={1}
        gradientStartColor="#fbbf24"
        gradientStopColor="#a78bfa"
      />
      {/* Lower-left cluster to lower center-left */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={node7Ref}
        toRef={node8Ref}
        curvature={-25}
        duration={3.3}
        delay={0.85}
        pathColor="#a1a1aa"
        pathWidth={1}
        gradientStartColor="#fbbf24"
        gradientStopColor="#a78bfa"
      />
      {/* Lower center-left to lower-right */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={node8Ref}
        toRef={node9Ref}
        curvature={-40}
        duration={3.7}
        delay={0.95}
        pathColor="#a1a1aa"
        pathWidth={1}
        gradientStartColor="#fbbf24"
        gradientStopColor="#a78bfa"
      />
      {/* Lower-right to bottom-right */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={node9Ref}
        toRef={node10Ref}
        curvature={30}
        duration={3.6}
        delay={1.05}
        pathColor="#a1a1aa"
        pathWidth={1}
        gradientStartColor="#fbbf24"
        gradientStopColor="#a78bfa"
      />
      {/* Additional cross-connections for more complexity */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={node2Ref}
        toRef={node4Ref}
        curvature={-50}
        duration={3.8}
        delay={0.5}
        pathColor="#a1a1aa"
        pathWidth={0.8}
        pathOpacity={0.15}
        gradientStartColor="#fbbf24"
        gradientStopColor="#a78bfa"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={node5Ref}
        toRef={node6Ref}
        curvature={35}
        duration={3.9}
        delay={0.6}
        pathColor="#a1a1aa"
        pathWidth={0.8}
        pathOpacity={0.15}
        gradientStartColor="#fbbf24"
        gradientStopColor="#a78bfa"
      />
    </div>
  );
}

export function FeatureCards() {
  const [currentCommand, setCurrentCommand] = useState(0);
  const commands = ["pip install trainly", "npm install @trainly/react"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCommand((prev) => (prev + 1) % commands.length);
    }, 3000); // Switch every 3 seconds

    return () => clearInterval(interval);
  }, [commands.length]);
  return (
    <section className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Section - Centered */}
        <div className="mb-16 text-center">
          <p className="text-sm text-zinc-600 font-medium mb-4">
            AI Development Platform
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-black mb-6 max-w-2xl mx-auto">
            Everything you need to build AI features
          </h2>
          <p className="text-lg text-zinc-600 mb-8 max-w-3xl mx-auto">
            Ever feel like AI requirements change with the season? Trainly keeps
            up with the latest trends and best practices, so you can ship
            faster.
          </p>
          <button className="flex items-center gap-2 text-black font-medium hover:text-amber-600 transition-colors mx-auto justify-center">
            Explore features
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Feature Cards Grid - Asymmetrical */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: GraphRAG */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 hover:border-amber-400 transition-colors flex flex-col justify-between">
            <div className="mb-3">
              {/* Graph visualization */}
              <GraphVisualization />
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-black mb-2">
                GraphRAG
              </h3>
              <p className="text-sm text-zinc-600">
                Build knowledge graphs from your data with complete traceability
                and 90% fewer hallucinations.
              </p>
            </div>
          </div>

          {/* Card 2: Visual Debugging - Spans 2 rows */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 hover:border-amber-400 transition-colors lg:row-span-2 flex flex-col justify-between">
            <div className="flex-1 flex items-start">
              <div
                className="bg-white rounded-lg p-4 w-full"
                style={{
                  boxShadow:
                    "0 2px 16px rgba(0, 0, 0, 0.1), 0 -2px 4px rgba(255, 255, 255, 0.9), 0 0 20px rgba(251, 191, 36, 0.1)",
                }}
              >
                {/* Citations visualization */}
                <CitationsVisualization />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-black mb-2">
                Visual Debugging
              </h3>
              <p className="text-sm text-zinc-600">
                See your AI's reasoning process. Know exactly which context it got from which nodes for an easy debugging experience.
              </p>
            </div>
          </div>

          {/* Card 3: API Access - Spans 2 columns */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 hover:border-amber-400 transition-colors md:col-span-2 lg:col-span-1 flex flex-col justify-between">
            <div>
              <InstantAPIVisualization />
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-black mb-2">
                Instant API
              </h3>
              <p className="text-sm text-zinc-600">
                Get production-ready APIs in minutes. No complex setup required,
                just upload your docs and start building.
              </p>
            </div>
          </div>

          {/* Card 4: Data Scoping */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 hover:border-amber-400 transition-colors flex flex-col justify-between">
            <div className="mb-4">
              <div
                className="bg-white rounded-lg p-4 mb-4"
                style={{
                  boxShadow:
                    "0 2px 16px rgba(0, 0, 0, 0.1), 0 -2px 4px rgba(255, 255, 255, 0.9), 0 0 20px rgba(251, 191, 36, 0.1)",
                }}
              >
                {/* Data Scoping visualization */}
                <div className="flex items-center justify-center py-2">
                  <div className="relative w-full">
                    {/* Three separate user scopes */}
                    <div className="flex items-center justify-center gap-3">
                      {/* User 1 Scope */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 bg-zinc-200 rounded-full border-2 border-zinc-300 flex items-center justify-center">
                          <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                        </div>
                        <div className="w-12 h-8 bg-amber-50 border border-amber-200 rounded-sm flex items-center justify-center">
                          <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                        </div>
                      </div>

                      {/* Separator */}
                      <div className="w-px h-12 bg-zinc-200"></div>

                      {/* User 2 Scope */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 bg-zinc-200 rounded-full border-2 border-zinc-300 flex items-center justify-center">
                          <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        </div>
                        <div className="w-12 h-8 bg-blue-50 border border-blue-200 rounded-sm flex items-center justify-center">
                          <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        </div>
                      </div>

                      {/* Separator */}
                      <div className="w-px h-12 bg-zinc-200"></div>

                      {/* User 3 Scope */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 bg-zinc-200 rounded-full border-2 border-zinc-300 flex items-center justify-center">
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        </div>
                        <div className="w-12 h-8 bg-green-50 border border-green-200 rounded-sm flex items-center justify-center">
                          <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-black mb-2">
                Data Scoping
              </h3>
              <p className="text-sm text-zinc-600">
                Separate data for multi-user applications. Each user gets their
                own isolated knowledge base with automatic scoping.
              </p>
            </div>
          </div>

          {/* Card 5: Multi-format Support - Spans 2 columns */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 hover:border-amber-400 transition-colors md:col-span-2 lg:col-span-1 flex flex-col justify-between">
            <div className="mb-4">
              <div
                className="bg-white rounded-lg p-4 mb-4"
                style={{
                  boxShadow:
                    "0 2px 16px rgba(0, 0, 0, 0.1), 0 -2px 4px rgba(255, 255, 255, 0.9), 0 0 20px rgba(251, 191, 36, 0.1)",
                }}
              >
                {/* File type icons */}
                <div className="flex items-center justify-center gap-2">
                  <div className="w-6 h-8 bg-zinc-300 rounded-sm"></div>
                  <div className="w-6 h-8 bg-zinc-200 rounded-sm"></div>
                  <div className="w-6 h-8 bg-zinc-400 rounded-sm"></div>
                  <div className="w-6 h-8 bg-zinc-200 rounded-sm"></div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-black mb-2">
                Multi-format Support
              </h3>
              <p className="text-sm text-zinc-600">
                Upload PDFs, docs, code, or any text format. Trainly handles
                chunking, storage, and updates automatically.
              </p>
            </div>
          </div>

          {/* Card 6: Real-time Streaming */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 hover:border-amber-400 transition-colors flex flex-col justify-between">
            <div className="mb-4">
              <div
                className="bg-white rounded-lg p-4 mb-4"
                style={{
                  boxShadow:
                    "0 2px 16px rgba(0, 0, 0, 0.1), 0 -2px 4px rgba(255, 255, 255, 0.9), 0 0 20px rgba(251, 191, 36, 0.1)",
                }}
              >
                {/* Streaming indicator */}
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse"></div>
                  <div
                    className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                  <div className="flex-1 h-px bg-zinc-200"></div>
                  <div className="h-2 bg-zinc-300 rounded w-8"></div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-black mb-2">
                Real-time Streaming
              </h3>
              <p className="text-sm text-zinc-600">
                Native streaming responses with React hooks. No setup, just
                import and use for instant user feedback.
              </p>
            </div>
          </div>

          {/* Card 7: Team Collaboration - Spans 2 columns */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 hover:border-amber-400 transition-colors md:col-span-2 lg:col-span-1 flex flex-col justify-between">
            <div className="mb-4">
              <div
                className="bg-white rounded-lg p-4 mb-4"
                style={{
                  boxShadow:
                    "0 2px 16px rgba(0, 0, 0, 0.1), 0 -2px 4px rgba(255, 255, 255, 0.9), 0 0 20px rgba(251, 191, 36, 0.1)",
                }}
              >
                {/* User avatars */}
                <div className="flex items-center justify-center gap-2">
                  <div className="w-6 h-6 bg-zinc-300 rounded-full"></div>
                  <div className="w-6 h-6 bg-zinc-400 rounded-full -ml-2"></div>
                  <div className="w-6 h-6 bg-zinc-300 rounded-full -ml-2"></div>
                  <div className="w-6 h-6 bg-zinc-200 rounded-full -ml-2 border-2 border-white"></div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-black mb-2">
                Team Collaboration
              </h3>
              <p className="text-sm text-zinc-600">
                Share knowledge bases across teams. Organize by projects,
                departments, or custom scopes with fine-grained access control.
              </p>
            </div>
          </div>

          {/* Card 8: Production SDKs */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 hover:border-amber-400 transition-colors flex flex-col justify-between">
            <div className="mb-4">
              <div
                className="bg-white rounded-lg p-4 mb-4 relative overflow-hidden"
                style={{
                  boxShadow:
                    "0 2px 16px rgba(0, 0, 0, 0.1), 0 -2px 4px rgba(255, 255, 255, 0.9), 0 0 20px rgba(251, 191, 36, 0.1)",
                }}
              >
                <code
                  key={currentCommand}
                  className="text-zinc-700 font-mono text-sm block animate-fade-in"
                >
                  {commands[currentCommand]}
                </code>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-black mb-2">
                Production SDKs
              </h3>
              <p className="text-sm text-zinc-600">
                Production-ready SDKs with OAuth, streaming, and full TypeScript
                support. Ship in minutes, not months.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeatureCards;
