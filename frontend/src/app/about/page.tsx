"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { motion } from "motion/react";
import { AnimatedBeam } from "@/components/magicui/animated-beam";
import {
  FileText,
  Code,
  Database,
  Network,
  Zap,
  Box,
  MessageSquare,
  BookOpen,
  Github,
  Webhook,
  BarChart3,
  Globe,
  Cloud,
  Link,
} from "lucide-react";

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const node1Ref = useRef<HTMLDivElement>(null);
  const node2Ref = useRef<HTMLDivElement>(null);
  const node3Ref = useRef<HTMLDivElement>(null);
  const node4Ref = useRef<HTMLDivElement>(null);
  const node5Ref = useRef<HTMLDivElement>(null);
  const node6Ref = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);

  // Background/future nodes
  const bgNode1Ref = useRef<HTMLDivElement>(null);
  const bgNode2Ref = useRef<HTMLDivElement>(null);
  const bgNode3Ref = useRef<HTMLDivElement>(null);
  const bgNode4Ref = useRef<HTMLDivElement>(null);
  const bgNode5Ref = useRef<HTMLDivElement>(null);
  const bgNode6Ref = useRef<HTMLDivElement>(null);
  const bgNode7Ref = useRef<HTMLDivElement>(null);
  const bgNode8Ref = useRef<HTMLDivElement>(null);

  // Force dark mode on about page
  useEffect(() => {
    const htmlElement = document.documentElement;
    htmlElement.classList.add("dark");

    return () => {
      htmlElement.classList.remove("dark");
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Navbar />

      {/* Article Header */}
      <div className="pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          {/* Breadcrumb */}
          <div className="mb-8 text-center">
            <span className="text-md text-white/40">
              Our Vision for the Future of AI
            </span>
          </div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-6xl font-semibold mb-12 text-center tracking-tight"
          >
            The Trainly Blueprint
          </motion.h1>

          {/* Central Visual Diagram */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-20 flex justify-center"
          >
            <div
              ref={containerRef}
              className="relative w-full h-[600px] flex items-center justify-center"
            >
              {/* Central Node - Trainly Core */}
              <div ref={centerRef} className="absolute z-20">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.4, type: "spring" }}
                  className="relative"
                >
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-xl border border-white/20 p-3">
                    <Image
                      src="/trainly_icon_white.png"
                      alt="Trainly"
                      width={64}
                      height={64}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 bg-white/10 rounded-2xl blur-2xl -z-10"></div>
                </motion.div>
              </div>

              {/* Left Side Nodes - Input Sources */}
              <motion.div
                ref={node1Ref}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="absolute left-[8%] top-[18%] z-10"
              >
                <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-white/70" />
                    <span className="text-sm font-medium text-white/90">
                      Documents
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                ref={node2Ref}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="absolute left-[10%] top-[50%] z-10 transform -translate-y-1/2"
              >
                <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2.5">
                    <Code className="w-4 h-4 text-white/70" />
                    <span className="text-sm font-medium text-white/90">
                      Code
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                ref={node3Ref}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="absolute left-[8%] bottom-[18%] z-10"
              >
                <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4 text-white/70" />
                    <span className="text-sm font-medium text-white/90">
                      Knowledge Bases
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Right Side Nodes - Outputs */}
              <motion.div
                ref={node4Ref}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="absolute right-[8%] top-[18%] z-10"
              >
                <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2.5">
                    <Network className="w-4 h-4 text-white/70" />
                    <span className="text-sm font-medium text-white/90">
                      Graph-RAG
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                ref={node5Ref}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="absolute right-[10%] top-[50%] z-10 transform -translate-y-1/2"
              >
                <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2.5">
                    <Zap className="w-4 h-4 text-white/70" />
                    <span className="text-sm font-medium text-white/90">
                      APIs
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                ref={node6Ref}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.1 }}
                className="absolute right-[8%] bottom-[18%] z-10"
              >
                <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2.5">
                    <Box className="w-4 h-4 text-white/70" />
                    <span className="text-sm font-medium text-white/90">
                      SDKs
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Background/Future Nodes - Blurred and positioned closer to center */}
              {/* Left side background nodes */}
              <motion.div
                ref={bgNode1Ref}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 0.5, delay: 1.5 }}
                className="absolute left-[18%] top-[12%] z-[5]"
              >
                <div className="bg-white/8 border border-white/15 rounded-lg px-3 py-2 backdrop-blur-md opacity-60 blur-[1px]">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-white/50" />
                    <span className="text-xs font-medium text-white/50">
                      Slack
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                ref={bgNode2Ref}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 0.5, delay: 1.6 }}
                className="absolute left-[20%] top-[42%] z-[5] transform -translate-y-1/2"
              >
                <div className="bg-white/8 border border-white/15 rounded-lg px-3 py-2 backdrop-blur-md opacity-60 blur-[1px]">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-white/50" />
                    <span className="text-xs font-medium text-white/50">
                      Notion
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                ref={bgNode3Ref}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 0.5, delay: 1.7 }}
                className="absolute left-[18%] bottom-[12%] z-[5]"
              >
                <div className="bg-white/8 border border-white/15 rounded-lg px-3 py-2 backdrop-blur-md opacity-60 blur-[1px]">
                  <div className="flex items-center gap-2">
                    <Github className="w-3.5 h-3.5 text-white/50" />
                    <span className="text-xs font-medium text-white/50">
                      GitHub
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                ref={bgNode4Ref}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 0.5, delay: 1.8 }}
                className="absolute left-[22%] top-[72%] z-[5] transform -translate-y-1/2"
              >
                <div className="bg-white/8 border border-white/15 rounded-lg px-3 py-2 backdrop-blur-md opacity-60 blur-[1px]">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-3.5 h-3.5 text-white/50" />
                    <span className="text-xs font-medium text-white/50">
                      Cloud Storage
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Right side background nodes */}
              <motion.div
                ref={bgNode5Ref}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 0.5, delay: 1.9 }}
                className="absolute right-[18%] top-[12%] z-[5]"
              >
                <div className="bg-white/8 border border-white/15 rounded-lg px-3 py-2 backdrop-blur-md opacity-60 blur-[1px]">
                  <div className="flex items-center gap-2">
                    <Webhook className="w-3.5 h-3.5 text-white/50" />
                    <span className="text-xs font-medium text-white/50">
                      Webhooks
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                ref={bgNode6Ref}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 0.5, delay: 2 }}
                className="absolute right-[20%] top-[42%] z-[5] transform -translate-y-1/2"
              >
                <div className="bg-white/8 border border-white/15 rounded-lg px-3 py-2 backdrop-blur-md opacity-60 blur-[1px]">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 text-white/50" />
                    <span className="text-xs font-medium text-white/50">
                      Analytics
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                ref={bgNode7Ref}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 0.5, delay: 2.1 }}
                className="absolute right-[18%] bottom-[12%] z-[5]"
              >
                <div className="bg-white/8 border border-white/15 rounded-lg px-3 py-2 backdrop-blur-md opacity-60 blur-[1px]">
                  <div className="flex items-center gap-2">
                    <Link className="w-3.5 h-3.5 text-white/50" />
                    <span className="text-xs font-medium text-white/50">
                      Integrations
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                ref={bgNode8Ref}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 0.5, delay: 2.2 }}
                className="absolute right-[22%] top-[72%] z-[5] transform -translate-y-1/2"
              >
                <div className="bg-white/8 border border-white/15 rounded-lg px-3 py-2 backdrop-blur-md opacity-60 blur-[1px]">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-white/50" />
                    <span className="text-xs font-medium text-white/50">
                      External APIs
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Animated Beams - Left to Center */}
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={node1Ref}
                toRef={centerRef}
                curvature={-20}
                duration={3}
                delay={1.2}
                pathColor="#ffffff"
                pathWidth={1.5}
                pathOpacity={0.25}
              />
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={node2Ref}
                toRef={centerRef}
                curvature={0}
                duration={3}
                delay={1.3}
                pathColor="#ffffff"
                pathWidth={1.5}
                pathOpacity={0.25}
              />
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={node3Ref}
                toRef={centerRef}
                curvature={20}
                duration={3}
                delay={1.4}
                pathColor="#ffffff"
                pathWidth={1.5}
                pathOpacity={0.25}
              />

              {/* Animated Beams - Center to Right */}
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={centerRef}
                toRef={node4Ref}
                curvature={-20}
                duration={3}
                delay={1.5}
                pathColor="#ffffff"
                pathWidth={1.5}
                pathOpacity={0.25}
              />
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={centerRef}
                toRef={node5Ref}
                curvature={0}
                duration={3}
                delay={1.6}
                pathColor="#ffffff"
                pathWidth={1.5}
                pathOpacity={0.25}
              />
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={centerRef}
                toRef={node6Ref}
                curvature={20}
                duration={3}
                delay={1.7}
                pathColor="#ffffff"
                pathWidth={1.5}
                pathOpacity={0.25}
              />

              {/* Background Beams - Blurred connections to future nodes */}
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={bgNode1Ref}
                toRef={centerRef}
                curvature={-10}
                duration={4}
                delay={2.3}
                pathColor="#ffffff"
                pathWidth={1}
                pathOpacity={0.2}
                className="blur-[2px]"
              />
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={bgNode2Ref}
                toRef={centerRef}
                curvature={-5}
                duration={4}
                delay={2.4}
                pathColor="#ffffff"
                pathWidth={1}
                pathOpacity={0.2}
                className="blur-[2px]"
              />
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={bgNode3Ref}
                toRef={centerRef}
                curvature={10}
                duration={4}
                delay={2.5}
                pathColor="#ffffff"
                pathWidth={1}
                pathOpacity={0.2}
                className="blur-[2px]"
              />
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={bgNode4Ref}
                toRef={centerRef}
                curvature={-3}
                duration={4}
                delay={2.6}
                pathColor="#ffffff"
                pathWidth={1}
                pathOpacity={0.2}
                className="blur-[2px]"
              />
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={centerRef}
                toRef={bgNode5Ref}
                curvature={-10}
                duration={4}
                delay={2.7}
                pathColor="#ffffff"
                pathWidth={1}
                pathOpacity={0.2}
                className="blur-[2px]"
              />
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={centerRef}
                toRef={bgNode6Ref}
                curvature={-5}
                duration={4}
                delay={2.8}
                pathColor="#ffffff"
                pathWidth={1}
                pathOpacity={0.2}
                className="blur-[2px]"
              />
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={centerRef}
                toRef={bgNode7Ref}
                curvature={10}
                duration={4}
                delay={2.9}
                pathColor="#ffffff"
                pathWidth={1}
                pathOpacity={0.2}
                className="blur-[2px]"
              />
              <AnimatedBeam
                containerRef={containerRef}
                fromRef={centerRef}
                toRef={bgNode8Ref}
                curvature={-3}
                duration={4}
                delay={3}
                pathColor="#ffffff"
                pathWidth={1}
                pathOpacity={0.2}
                className="blur-[2px]"
              />
            </div>
          </motion.div>

          {/* Article Text Block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-3xl mx-auto space-y-8 text-lg leading-relaxed text-white/90 prose prose-invert prose-lg"
          >
            {/* Introduction */}
            <div className="space-y-6">
              <p>
                Trainly is an AI platform that transforms how teams integrate
                intelligence into their products. We provide Graph-RAG
                technology, clean APIs, and production-ready SDKs that turn your
                data (whether it's documents, code, knowledge bases, or any
                structured information) into powerful AI capabilities that
                understand context, relationships, and nuance.
              </p>

              <p>
                Our platform automatically ingests your data, intelligently
                chunks it, builds comprehensive graph knowledge bases, and
                exposes everything through clean, well-documented APIs. The
                result? AI applications with 90% fewer hallucinations, complete
                traceability for every response, and the ability to see exactly
                which pieces of your data informed the AI's reasoning.
              </p>

              <p>
                But Trainly is more than just a platform. It's a vision for how
                AI development should work. We believe that adding intelligence
                to your product shouldn't require months of engineering effort,
                a team of AI researchers, or deep expertise in machine learning
                infrastructure.
              </p>
            </div>

            {/* Visual Divider */}
            <div className="my-12 flex items-center justify-center">
              <div className="h-px w-24 bg-white/20"></div>
              <div className="mx-4 h-2 w-2 rounded-full bg-white/40"></div>
              <div className="h-px flex-1 bg-white/20"></div>
            </div>

            {/* Mission Section */}
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold text-white mb-6">
                Our Mission
              </h2>

              <p>
                Our mission is to make Trainly the go-to AI layer for any
                feature that anybody (from individual developers building side
                projects to large corporations deploying enterprise solutions)
                wants to implement. We want it to be a no-brainer to choose
                Trainly over anything else.
              </p>

              <p>
                This means that when a developer thinks "I need to add AI to
                this feature," their first thought should be "I'll use Trainly."
                When a CTO evaluates AI infrastructure options, Trainly should
                be the obvious choice. When a product team wants to ship an
                intelligent feature, Trainly should be the fastest path from
                idea to production.
              </p>

              <p>
                We're building toward this goal with four core pillars that
                guide every decision we make, every feature we build, and every
                improvement we ship.
              </p>
            </div>

            {/* Visual Divider */}
            <div className="my-12 flex items-center justify-center">
              <div className="h-px w-24 bg-white/20"></div>
              <div className="mx-4 h-2 w-2 rounded-full bg-white/40"></div>
              <div className="h-px flex-1 bg-white/20"></div>
            </div>

            {/* Ease of Setup */}
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold text-white mb-2">
                1. Ease of Setup
              </h2>

              <p>
                We believe building AI features should be as straightforward as
                deploying a new API endpoint. The traditional path to adding AI
                involves weeks or months of work: setting up vector databases,
                implementing chunking strategies, building retrieval systems,
                fine-tuning models, managing infrastructure, and handling edge
                cases. Trainly eliminates all of that.
              </p>

              <p>
                With Trainly, you upload your data (documents, code
                repositories, knowledge bases, or any text-based content) and
                our platform handles the rest. We automatically chunk your
                content intelligently, extract relationships and entities, build
                a comprehensive graph knowledge base, and expose everything
                through clean, RESTful APIs. What used to take months now takes
                minutes.
              </p>

              <p>
                Our SDKs integrate seamlessly with your existing stack. Whether
                you're building with Python, React, Node.js, or any other
                technology, we provide production-ready libraries that handle
                authentication, streaming, error handling, and all the
                complexity you'd otherwise have to build yourself. You don't
                need to become an AI expert. You just need to know how to use an
                API.
              </p>

              <p>
                The developer experience is paramount. We provide comprehensive
                documentation, code examples, and interactive tools to help you
                get started quickly. Our APIs follow RESTful conventions, return
                predictable JSON responses, and include detailed error messages
                when something goes wrong. We want using Trainly to feel as
                natural as using Stripe or Twilio.
              </p>
            </div>

            {/* Visual Divider */}
            <div className="my-12 flex items-center justify-center">
              <div className="h-px w-24 bg-white/20"></div>
              <div className="mx-4 h-2 w-2 rounded-full bg-white/40"></div>
              <div className="h-px flex-1 bg-white/20"></div>
            </div>

            {/* AI Accuracy */}
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold text-white mb-2">
                2. AI Accuracy
              </h2>

              <p>
                Accuracy isn't just about getting the right answer. It's about
                getting the right answer for the right reasons, and being able
                to verify that. Traditional RAG systems often struggle with
                hallucinations, context confusion, and lack of traceability.
                Trainly solves these problems through Graph-RAG technology.
              </p>

              <p>
                By building graph knowledge bases instead of simple vector
                embeddings, Trainly understands relationships, hierarchies, and
                context in ways that traditional systems can't. When you ask a
                question, our system doesn't just find similar text. It
                understands how concepts relate to each other, which information
                is most relevant, and how to combine multiple sources of truth
                into a coherent answer.
              </p>

              <p>
                Every response comes with complete traceability. You can see
                exactly which documents, which chunks, and which nodes in the
                knowledge graph informed the AI's reasoning. This isn't just
                useful for debugging. It's essential for building trust with
                your users, meeting compliance requirements, and understanding
                how your AI systems work.
              </p>

              <p>
                Our visual debugging tools let you explore the knowledge graph,
                see how information flows through the system, and understand why
                the AI made specific decisions. This transparency means you can
                catch errors before they reach users, improve your data quality
                over time, and build more reliable applications.
              </p>

              <p>
                The result? AI applications that users can trust. Fewer
                hallucinations mean better user experiences. Complete
                traceability means you can audit and improve your systems. And
                the ability to see the AI's reasoning means you can build
                features that are both powerful and reliable.
              </p>
            </div>

            {/* Visual Divider */}
            <div className="my-12 flex items-center justify-center">
              <div className="h-px w-24 bg-white/20"></div>
              <div className="mx-4 h-2 w-2 rounded-full bg-white/40"></div>
              <div className="h-px flex-1 bg-white/20"></div>
            </div>

            {/* Data Protection */}
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold text-white mb-2">
                3. Data Protection
              </h2>

              <p>
                Your data is your competitive advantage, and we treat it that
                way. Data protection isn't just about encryption and access
                controls. It's about ensuring that your data remains yours, that
                it's isolated from other users, and that you have complete
                control over how it's used.
              </p>

              <p>
                Trainly provides automatic data scoping for multi-user
                applications. When you build a SaaS product, an educational
                platform, or any application where multiple users interact with
                AI, each user gets their own isolated knowledge base. User A's
                data never influences responses for User B. This isn't just a
                feature. It's fundamental to how Trainly works.
              </p>

              <p>
                We're building enterprise-grade security controls that go beyond
                the basics. Role-based access control lets you define who can
                access what data. Audit logs track every interaction with your
                knowledge base. Data retention policies let you control how long
                information is stored. And compliance features help you meet
                GDPR, HIPAA, SOC 2, and other regulatory requirements.
              </p>

              <p>
                For organizations that need even more control, we're developing
                self-hosting options. Deploy Trainly in your own infrastructure,
                behind your own firewalls, with your own security policies. Your
                data never leaves your environment, and you have complete
                control over every aspect of the system.
              </p>

              <p>
                We understand that trust is earned, not given. That's why we're
                transparent about our security practices, undergo regular
                security audits, and build features that give you control over
                your data. When you use Trainly, you're not just getting an AI
                platform. You're getting a partner that takes data protection as
                seriously as you do.
              </p>
            </div>

            {/* Visual Divider */}
            <div className="my-12 flex items-center justify-center">
              <div className="h-px w-24 bg-white/20"></div>
              <div className="mx-4 h-2 w-2 rounded-full bg-white/40"></div>
              <div className="h-px flex-1 bg-white/20"></div>
            </div>

            {/* Cost Saving */}
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold text-white mb-2">
                4. Cost Saving
              </h2>

              <p>
                Building AI infrastructure from scratch is expensive, not just
                in dollars, but in time, resources, and opportunity cost. When
                your engineering team spends months building and maintaining AI
                infrastructure, that's time they're not spending on features
                that differentiate your product. When you hire AI experts,
                that's budget that could go toward product development. When you
                build custom solutions, that's complexity you'll have to
                maintain forever.
              </p>

              <p>
                Trainly eliminates these costs. You don't need to become an AI
                expert or hire a team of them. You don't need to build and
                maintain vector databases, chunking systems, or retrieval
                pipelines. You don't need to fine-tune models or manage
                infrastructure. We handle all of that, so you can focus on what
                matters: building great products.
              </p>

              <p>
                But cost saving isn't just about avoiding upfront development
                costs. It's about ongoing efficiency. Trainly's automatic graph
                construction means your knowledge base stays up-to-date as your
                data changes. Our optimized infrastructure means you get fast
                responses without managing servers. And our predictable pricing
                means you can budget accurately without surprise costs.
              </p>

              <p>
                The real cost saving, though, comes from shipping faster. When
                you can go from idea to production in days instead of months,
                you can iterate faster, respond to user feedback quicker, and
                stay ahead of competitors. Time to market matters, and Trainly
                gives you that advantage.
              </p>

              <p>
                We're committed to making Trainly cost-effective at every scale.
                Whether you're a solo developer building a side project or a
                Fortune 500 company deploying enterprise solutions, we want
                Trainly to be the most cost-effective way to add AI to your
                product. That means transparent pricing, no hidden fees, and
                plans that scale with your needs.
              </p>
            </div>

            {/* Visual Divider */}
            <div className="my-12 flex items-center justify-center">
              <div className="h-px w-24 bg-white/20"></div>
              <div className="mx-4 h-2 w-2 rounded-full bg-white/40"></div>
              <div className="h-px flex-1 bg-white/20"></div>
            </div>

            {/* Conclusion */}
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold text-white mb-2">
                The Road Ahead
              </h2>

              <p>
                We're a long way from fully accomplishing this vision, but we're
                committed to getting there. Every feature we build, every
                integration we add, and every improvement we make brings us
                closer to making Trainly the obvious choice for anyone who wants
                to add AI to their product.
              </p>

              <p>
                We're expanding our SDK support to include more languages and
                frameworks. We're building advanced analytics and visualization
                tools to help you understand your knowledge structures. We're
                developing enterprise features including self-hosting, advanced
                security controls, and compliance tools. We're creating
                real-time collaboration features for teams. And we're constantly
                improving our core technology to make it faster, more accurate,
                and easier to use.
              </p>

              <p>
                The future of AI development shouldn't require becoming an AI
                expert. It shouldn't require months of engineering effort. It
                shouldn't require compromising on accuracy, security, or cost.
                The future of AI development should just work, and that's what
                we're building at Trainly.
              </p>

              <p>
                If you're building something that could benefit from AI, we'd
                love to have you join us on this journey. Together, we can make
                AI accessible to everyone, from individual developers to large
                corporations, and build a future where intelligence is just
                another feature you can add to your product.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
