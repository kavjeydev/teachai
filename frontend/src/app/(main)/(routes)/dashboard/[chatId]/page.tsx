"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "next-themes";
import {
  File,
  Paperclip,
  Send,
  Sparkles,
  Archive,
  Key,
  Wrench,
  BarChart3,
  BookOpen,
  ExternalLink,
  Shield,
  Users,
  Files,
  HardDrive,
  Activity,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { api } from "../../../../../../convex/_generated/api";
import React, { Suspense } from "react";
import { useUser } from "@clerk/clerk-react";
import { useSidebarWidth } from "@/hooks/use-sidebar-width";
import dynamic from "next/dynamic";
import DashboardLoading from "./loading";
import { captureEvent } from "@/lib/posthog";
import { ChatSkeleton } from "@/components/chat-page/chat-skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// CRITICAL: Aggressively lazy load ALL heavy components to reduce initial bundle
// Dynamic import heavy sidebar and navbar components
const ResizableSidebar = dynamic(
  () =>
    import("@/app/(main)/components/resizable-sidebar").then((mod) => ({
      default: mod.ResizableSidebar,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="w-72 bg-white dark:bg-zinc-900 animate-pulse" />
    ),
  },
);

const CitationMarkdown = dynamic(
  () =>
    import("@/components/citation-markdown").then((mod) => ({
      default: mod.CitationMarkdown,
    })),
  {
    ssr: false, // Changed to false for faster loading
    loading: () => (
      <div className="animate-pulse h-20 bg-zinc-100 rounded-lg"></div>
    ),
  },
);

const CitationInspector = dynamic(
  () =>
    import("@/components/citation-inspector").then((mod) => ({
      default: mod.CitationInspector,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse h-32 bg-zinc-100 rounded-lg"></div>
    ),
  },
);

const ContextList = dynamic(
  () =>
    import("@/app/(main)/components/context-list").then((mod) => ({
      default: mod.ContextList,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse h-24 bg-zinc-100 rounded-lg"></div>
    ),
  },
);

const ContextFilesSection = dynamic(
  () =>
    import("@/app/(main)/components/context-files-section").then((mod) => ({
      default: mod.ContextFilesSection,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse h-16 bg-zinc-100 rounded-lg"></div>
    ),
  },
);

const ChatSettings = dynamic(
  () =>
    import("@/components/chat-settings").then((mod) => ({
      default: mod.ChatSettings,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse h-40 bg-zinc-100 rounded-lg"></div>
    ),
  },
);

const ChatSettingsPage = dynamic(
  () =>
    import("@/components/chat-settings-page").then((mod) => ({
      default: mod.ChatSettingsPage,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse h-64 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
    ),
  },
);

const ModelSelector = dynamic(
  () =>
    import("@/components/model-selector").then((mod) => ({
      default: mod.ModelSelector,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse h-10 bg-zinc-100 rounded-lg"></div>
    ),
  },
);

const UnhingedModeToggle = dynamic(
  () =>
    import("@/components/unhinged-mode-toggle").then((mod) => ({
      default: mod.UnhingedModeToggle,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse h-10 bg-zinc-100 rounded-lg"></div>
    ),
  },
);

const SimpleApiManager = dynamic(
  () =>
    import("@/components/simple-api-manager").then((mod) => ({
      default: mod.SimpleApiManager,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse h-40 bg-zinc-100 rounded-lg"></div>
    ),
  },
);

const FileQueueMonitor = dynamic(
  () =>
    import("@/components/file-queue-monitor").then((mod) => ({
      default: mod.FileQueueMonitor,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse h-16 bg-zinc-100 rounded-lg"></div>
    ),
  },
);

const FileQueueSidebar = dynamic(
  () =>
    import("@/components/file-queue-sidebar").then((mod) => ({
      default: mod.FileQueueSidebar,
    })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-screen bg-zinc-100"></div>,
  },
);

const CreditWarning = dynamic(
  () =>
    import("@/components/credit-warning").then((mod) => ({
      default: mod.CreditWarning,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse h-8 bg-yellow-100 rounded"></div>
    ),
  },
);

// Conditionally load TipTap editor - only when testing view is active
// Using React.lazy for true conditional loading - won't load until component is rendered
const ConditionalTipTapEditor = React.lazy(() =>
  import("@/components/tiptap-editor-wrapper").then((mod) => ({
    default: mod.TipTapEditorWrapper,
  })),
);

import { useConvexAuth } from "@/hooks/use-auth-state";
import "../../../components/styles.scss";
import {
  sanitizeHTML,
  sanitizeUserMessage,
  sanitizeText,
} from "@/lib/sanitization";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { flushSync } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useCreditConsumption } from "@/hooks/use-credit-consumption";
import { startTransition } from "react";
import { MessageSquare, FolderOpen, FileText } from "lucide-react";
import { useFileQueue } from "@/hooks/use-file-queue";
import {
  usePerformanceMonitor,
  useRenderPerformance,
} from "@/hooks/usePerformanceMonitor";
import { ChatPageContent } from "@/components/chat-page/chat-page-content";

// Extend window object for global cache
declare global {
  interface Window {
    trainlyCache?: {
      chats: Record<string, any>;
      content: Record<string, any[]>;
      context: Record<string, any>;
    };
  }
}

interface ChatIdPageProps {
  params: Promise<{
    chatId: Id<"chats">;
  }>;
}

interface ChatMessage {
  sender: "user" | "bot";
  text: string;
}

interface ChatContext {
  filename: string;
  fileId: string;
}

interface EmbeddingsFormData {
  pdf_text: string;
  pdf_id: string;
  chat_id: string;
  filename: string;
}

interface AnswerQuestionPayload {
  question: string;
  chat_id: string;
  selected_model?: string;
  custom_prompt?: string | null;
  temperature?: number;
  max_tokens?: number;
}

function Dashboard({ params }: ChatIdPageProps) {
  // Performance monitoring
  const { logPageLoad, logUserAction } = usePerformanceMonitor();
  const { startMeasure, endMeasure } = useRenderPerformance("Dashboard");
  const pathname = usePathname();
  const router = useRouter();

  const skeletonData = [
    { sender: "user", text: "        " },
    { sender: "bot", text: "              " },
    { sender: "user", text: "                    " },
    { sender: "bot", text: "        " },
    {
      sender: "user",
      text: "                                                     ",
    },
    {
      sender: "bot",
      text: "                                                                                                          ",
    },
    {
      sender: "user",
      text: "                                                     ",
    },
  ];

  const uid = function (): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const { user } = useUser();
  const { sidebarWidth } = useSidebarWidth();
  const { canQuery, skipQuery } = useConvexAuth();

  // Helper to check if a chatId is valid (not a known non-chat route)
  const isValidChatId = (id: string | null | undefined): id is Id<"chats"> => {
    if (!id) return false;
    const knownNonChatRoutes = ["manage"];
    return !knownNonChatRoutes.includes(id);
  };

  // Get chatId from params with caching - resolve async to show skeleton immediately
  const [cachedChatId, setCachedChatId] = useState<Id<"chats"> | null>(null);
  const [chatId, setChatId] = useState<Id<"chats"> | null>(null);
  const [isResolvingParams, setIsResolvingParams] = useState(true);

  // Resolve params asynchronously - don't block render
  useEffect(() => {
    const unwrapParams = async () => {
      try {
        const resolvedParams = await params;
        const resolvedChatId = resolvedParams.chatId;
        setChatId(resolvedChatId);
        setIsResolvingParams(false);

        // Update cache
        if (resolvedChatId) {
          setCachedChatId(resolvedChatId);
          // Log page load performance
          logPageLoad(`dashboard_${resolvedChatId}`);
        }
      } catch (error) {
        setIsResolvingParams(false);
      }
    };
    unwrapParams();
  }, [params, logPageLoad]);

  // Use cached chatId if current one is undefined (during navigation)
  // Only use it if it's a valid chatId (not "manage" or other non-chat routes)
  // Also check pathname to ensure we're not on a non-chat route
  const isOnManageRoute = pathname.includes("/dashboard/manage");
  const rawEffectiveChatId = chatId || cachedChatId;
  const effectiveChatId: Id<"chats"> | null =
    !isOnManageRoute && isValidChatId(rawEffectiveChatId)
      ? rawEffectiveChatId
      : null;

  const [input, setInput] = useState("");
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [fileKey, setFileKey] = useState<Date>(new Date());
  const [isFileQueueSlideoutOpen, setIsFileQueueSlideoutOpen] = useState(false);
  const [sidebarActiveView, setSidebarActiveView] = useState<string>("testing");
  const [isViewChanging, setIsViewChanging] = useState(false);
  const previousViewRef = useRef<string>("testing");

  // Optimistic updates for instant message display
  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([]);

  const scrollToBottom = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const lastScrollTimeRef = useRef<number>(0);

  const currentChat = useQuery(
    api.chats.getChatById,
    !canQuery || !effectiveChatId || !isValidChatId(effectiveChatId)
      ? "skip"
      : { id: effectiveChatId },
  );
  const chatContent = useQuery(
    api.chats.getChatContent,
    !canQuery || !effectiveChatId || !isValidChatId(effectiveChatId)
      ? "skip"
      : { id: effectiveChatId },
  );
  const showContextData = useQuery(
    api.chats.getContext,
    !canQuery || !effectiveChatId || !isValidChatId(effectiveChatId)
      ? "skip"
      : { id: effectiveChatId },
  );

  // For sidebar views
  const subscription = useQuery(api.subscriptions.getUserSubscription);
  const credits = useQuery(api.subscriptions.getUserCredits);
  const chatAnalytics = useQuery(
    api.chat_analytics.getChatAnalytics,
    effectiveChatId && isValidChatId(effectiveChatId)
      ? { chatId: effectiveChatId }
      : "skip",
  );

  // Global cache that persists across navigation (stored in window object)
  const getGlobalCache = () => {
    if (typeof window !== "undefined") {
      if (!window.trainlyCache) {
        window.trainlyCache = {
          chats: {},
          content: {},
          context: {},
        };
      }
      return window.trainlyCache;
    }
    return { chats: {}, content: {}, context: {} };
  };

  // Update global cache when data loads and manage loading states
  useEffect(() => {
    if (currentChat && effectiveChatId) {
      const cache = getGlobalCache();
      cache.chats[effectiveChatId] = currentChat;
    }
  }, [currentChat, effectiveChatId]);

  useEffect(() => {
    if (chatContent && effectiveChatId) {
      const cache = getGlobalCache();
      cache.content[effectiveChatId] = chatContent;
    }
  }, [chatContent, effectiveChatId]);

  useEffect(() => {
    if (showContextData && effectiveChatId) {
      const cache = getGlobalCache();
      cache.context[effectiveChatId] = showContextData;
    }
  }, [showContextData, effectiveChatId]);

  // Manage initial loading state
  useEffect(() => {
    if (effectiveChatId) {
      const hasBasicData =
        currentChat !== undefined &&
        chatContent !== undefined &&
        showContextData !== undefined;
      if (hasBasicData) {
        setIsLoadingInitialData(false);
      }
    }
  }, [currentChat, chatContent, showContextData, effectiveChatId]);

  // Get cached or current data - prioritize fresh data over cache
  const cache = getGlobalCache();
  const displayChat =
    currentChat || (effectiveChatId && cache.chats[effectiveChatId]);
  const baseContent =
    chatContent || (effectiveChatId && cache.content[effectiveChatId]);
  const displayContext =
    showContextData || (effectiveChatId && cache.context[effectiveChatId]);

  // Merge optimistic messages with real messages for instant display
  const displayContent = React.useMemo(() => {
    if (!baseContent) return optimisticMessages;

    // Filter out optimistic messages that have been persisted
    const filteredOptimistic = optimisticMessages.filter(
      (optMsg) =>
        !baseContent.some(
          (realMsg) =>
            realMsg.text === optMsg.text && realMsg.sender === optMsg.sender,
        ),
    );

    return [...baseContent, ...filteredOptimistic];
  }, [baseContent, optimisticMessages]);

  // Clean up optimistic messages when real messages arrive
  React.useEffect(() => {
    if (baseContent && optimisticMessages.length > 0) {
      const filteredOptimistic = optimisticMessages.filter(
        (optMsg) =>
          !baseContent.some(
            (realMsg) =>
              realMsg.text === optMsg.text && realMsg.sender === optMsg.sender,
          ),
      );

      if (filteredOptimistic.length !== optimisticMessages.length) {
        setOptimisticMessages(filteredOptimistic);
      }
    }
  }, [baseContent, optimisticMessages]);

  // Display content effect
  React.useEffect(() => {
    // Content updated
  }, [baseContent, optimisticMessages, displayContent]);

  // Detect view from URL pathname and show skeleton immediately on change
  React.useEffect(() => {
    let newView = "testing";
    if (pathname.includes("/dashboard/manage")) {
      newView = "manage";
    } else if (pathname.includes("/graph")) {
      newView = "graph";
    } else if (pathname.includes("/testing")) {
      newView = "testing";
    } else if (pathname.includes("/files")) {
      newView = "files";
    } else if (pathname.includes("/api-keys")) {
      newView = "api-keys";
    } else if (pathname.includes("/custom-settings")) {
      newView = "custom-settings";
    } else if (pathname.includes("/usage")) {
      newView = "usage";
    } else if (pathname === "/dashboard") {
      newView = "manage";
    } else if (pathname.includes("/dashboard/")) {
      // Default to testing for regular dashboard pages
      newView = "testing";
    }

    // Show skeleton immediately when view changes
    if (newView !== previousViewRef.current) {
      setIsViewChanging(true);
      previousViewRef.current = newView;
      setSidebarActiveView(newView);
      // Clear view changing flag immediately - content will handle its own loading states
      // Use requestAnimationFrame to ensure state update happens after render
      requestAnimationFrame(() => {
        setIsViewChanging(false);
      });
    } else {
      setSidebarActiveView(newView);
    }
  }, [pathname]);

  const writeContent = useMutation(api.chats.writeContent);
  const uploadContext = useMutation(api.chats.uploadContext);

  // Use the credit consumption hook
  const {
    checkSufficientCredits,
    consumeCreditsForResponse,
    calculateCreditsFromTokens,
  } = useCreditConsumption();

  // Direct credit consumption (since backend consumption isn't working)
  const consumeCredits = useMutation(api.subscriptions.consumeCredits);
  const consumeCreditsDirectly = async (
    credits: number,
    model: string,
    tokens: number,
  ) => {
    try {
      await consumeCredits({
        credits: credits,
        model: model,
        tokensUsed: tokens,
        chatId: effectiveChatId || undefined,
        description: `AI chat response using ${model}`,
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleSendMessageRef = React.useRef<(() => void) | null>(null);

  // Ref for TipTap editor wrapper
  const editorRef = React.useRef<{
    editor: any;
    getHTML: () => string;
    getText: () => string;
    focus: () => void;
    isEmpty: () => boolean;
  } | null>(null);

  const onWrite = (sender: string, text: string, reasoningContext?: any[]) => {
    if (!effectiveChatId) {
      console.error("❌ No effectiveChatId when trying to write message");
      return;
    }

    // Writing message to chat
    writeContent({
      id: effectiveChatId,
      chat: {
        sender: sender,
        text: text,
        user: user?.id || "user",
        reasoningContext: reasoningContext,
      },
    });
  };

  // File upload handler - now uses queue system
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileKey(new Date());

    // Check if chat is archived
    if (currentChat?.isArchived) {
      toast.error(
        "Cannot upload files to an archived chat. Please restore it first.",
      );
      return;
    }

    const files = e.target.files;
    if (!files || files.length === 0) {
      toast.error("No files selected.");
      return;
    }

    // Check if this is a folder upload
    const firstFile = files[0] as any;
    const isFolder = Boolean(
      firstFile.webkitRelativePath && firstFile.webkitRelativePath.length > 0,
    );

    // Extract folder name if it's a folder upload
    let folderName;
    if (isFolder) {
      const pathParts = firstFile.webkitRelativePath.split("/");
      folderName = pathParts[0];
    }

    // Use the queue system for file processing
    await fileQueue.uploadFiles(files, isFolder, folderName);
  };

  const triggerFileInput = () => {
    if (currentChat?.isArchived) {
      toast.error(
        "Cannot upload files to an archived chat. Please restore it first.",
      );
      return;
    }
    fileInputRef.current?.click();
  };

  const triggerFolderInput = () => {
    if (currentChat?.isArchived) {
      toast.error(
        "Cannot upload files to an archived chat. Please restore it first.",
      );
      return;
    }
    folderInputRef.current?.click();
  };

  // Store the latest reasoning context for graph visualization
  const [latestReasoningContext, setLatestReasoningContext] = useState<any[]>(
    [],
  );

  // Store reasoning context per message
  const [messageReasoningContext, setMessageReasoningContext] = useState<
    Record<number, any[]>
  >({});

  // Citation inspector state
  const [showCitationInspector, setShowCitationInspector] = useState(false);
  const [inspectedCitations, setInspectedCitations] = useState<any[]>([]);

  // Graph refresh trigger
  const [graphRefreshTrigger, setGraphRefreshTrigger] = useState(0);

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const streamingRef = useRef<HTMLDivElement>(null);
  const streamingMessageRef = useRef<HTMLDivElement>(null);

  // Loading states for better UX
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isProcessingMessage, setIsProcessingMessage] = useState(false);

  // File queue system - only initialize if we have a valid chatId
  const fileQueue = useFileQueue({
    chatId: (effectiveChatId && isValidChatId(effectiveChatId)
      ? effectiveChatId
      : null) as Id<"chats"> | null,
    chatInfo: displayChat
      ? { chatType: displayChat.chatType, chatId: displayChat.chatId }
      : undefined,
    onFileProcessed: (fileId, fileName) => {
      // Add file to context when processed
      if (effectiveChatId) {
        uploadContext({
          id: effectiveChatId,
          context: {
            filename: fileName,
            fileId: fileId,
          },
        });
      }
    },
    onQueueComplete: (queueId) => {
      toast.success("All files processed successfully!");
    },
  });

  // Single scroll function to prevent conflicts
  const scrollToBottomSafe = useCallback(
    (force: boolean = false, delayMs: number = 50) => {
      const now = Date.now();
      // Prevent rapid successive scrolls unless forced
      if (force || now - lastScrollTimeRef.current > 100) {
        lastScrollTimeRef.current = now;

        // Use requestAnimationFrame for better timing, then add delay if needed
        requestAnimationFrame(() => {
          setTimeout(() => {
            scrollToBottom.current?.scrollIntoView({ behavior: "smooth" });
          }, delayMs);
        });
      }
    },
    [],
  );

  // Streaming content monitoring
  useEffect(() => {
    // Monitor streaming progress
  }, [streamingContent]);

  // Copy to clipboard function
  const copyToClipboard = async (text: string, messageType: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${messageType} copied to clipboard!`);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy to clipboard");
    }
  };


  // Helper function to extract all citation indices from response text
  const extractCitationIndices = (text: string): number[] => {
    const citationRegex = /\[\^(\d+)\^*\]/g;
    const indices = new Set<number>();
    let match;

    while ((match = citationRegex.exec(text)) !== null) {
      indices.add(parseInt(match[1]));
    }

    return Array.from(indices).sort((a, b) => a - b);
  };

  // Handle citation clicks to open inspector - MOVED BEFORE useMemo
  const handleCitationClick = React.useCallback(
    (
      chunkIndex: number,
      messageReasoningContext: any[],
      messageText?: string,
    ) => {
      if (messageReasoningContext[chunkIndex]) {
        const clickedChunk = messageReasoningContext[chunkIndex];

        // NEW: Parse the message text to find which chunks are actually cited
        let relatedChunks = messageReasoningContext;

        if (messageText) {
          const citedIndices = extractCitationIndices(messageText);

          // Only show chunks that are actually cited in the response
          relatedChunks = citedIndices
            .map((index) => messageReasoningContext[index])
            .filter((chunk) => chunk !== undefined);

          // If no citations found in text, fall back to showing all chunks
          if (relatedChunks.length === 0) {
            relatedChunks = messageReasoningContext;
          }
        }

        // Convert chunks to CitedNode format for inspector
        try {
          const citedNodes = relatedChunks.map((chunk, index) => {
            return {
              id: chunk.chunk_id,
              title: `Chunk ${chunk.chunk_id}`,
              snippet: chunk.chunk_text.substring(0, 200) + "...",
              properties: {
                score: chunk.score,
                chunk_id: chunk.chunk_id,
                full_text: chunk.chunk_text,
              },
              relationships: [], // TODO: Fetch actual relationships
              labels: ["Chunk"],
            };
          });

          // Open citation inspector
          setInspectedCitations(citedNodes);
          setShowCitationInspector(true);
        } catch (error) {
          console.error("❌ Error processing citation nodes:", error);
        }
      } else {
        // Citation not found in context
        toast.error(
          `Citation [^${chunkIndex}] not available. Only ${messageReasoningContext.length} chunks provided.`,
        );
      }
    },
    [],
  );


  // Function to trigger graph refresh
  const triggerGraphRefresh = () => {
    const newTrigger = graphRefreshTrigger + 1;
    // Triggering graph refresh
    setGraphRefreshTrigger(newTrigger);
  };

  // Handle opening specific node in full graph view
  const handleOpenInGraph = (nodeId: string) => {
    // Close inspector
    setShowCitationInspector(false);

    // Navigate to graph page
    if (effectiveChatId) {
      // Track graph view access in PostHog
      captureEvent("graph_view_accessed", {
        chatId: effectiveChatId,
        source: "citation_inspector",
        nodeId: nodeId,
      });

      router.push(`/dashboard/${effectiveChatId}/graph`);
      toast.success("Opening graph view...");
    }
  };

  // GraphRAG API integration with streaming
  async function answerQuestionStream(
    question: string,
    onContent: (content: string) => void,
    onContext: (context: any[]) => void,
    onComplete: (fullAnswer: string) => void,
  ) {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/";
    const answerQuestionPayload = {
      question: question,
      chat_id: chatId as string,
      selected_model: displayChat?.selectedModel || "gpt-4o-mini",
      custom_prompt: displayChat?.customPrompt || null,
      temperature: displayChat?.temperature || 0.7,
      max_tokens: displayChat?.maxTokens || 1000,
      unhinged_mode: displayChat?.unhingedMode || false,
    };

    // Credit checking temporarily disabled to fix chat functionality
    // const model = displayChat?.selectedModel || "gpt-4o-mini";
    // const maxTokens = displayChat?.maxTokens || 1000;
    // const creditCheck = checkSufficientCredits(question, model, maxTokens);

    // if (!creditCheck.sufficient) {
    //   throw new Error(
    //     `Insufficient credits: need ${creditCheck.needed}, have ${creditCheck.available}. Please upgrade your plan.`,
    //   );
    // }

    const response = await fetch(baseUrl + "answer_question_stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(answerQuestionPayload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Failed to get response reader");
    }

    const decoder = new TextDecoder();
    let fullAnswer = "";
    let receivedContext: any[] = [];
    let buffer = "";

    try {
      let chunkCount = 0;
      while (true) {
        const { done, value } = await reader.read();
        chunkCount++;

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonStr = line.slice(6).trim();
              if (jsonStr) {
                const data = JSON.parse(jsonStr);

                if (data.type === "context") {
                  receivedContext = data.data;
                  onContext(receivedContext);
                  setLatestReasoningContext(receivedContext);
                } else if (data.type === "content") {
                  fullAnswer += data.data;
                  onContent(data.data);
                } else if (data.type === "end") {
                  onComplete(fullAnswer);
                  break; // Break out of the while loop to continue with credit processing
                }
              }
            } catch (e) {
              // Failed to parse streaming data
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Calculate precise credit usage based on actual tokens
    const model = displayChat?.selectedModel || "gpt-4o-mini";
    const questionTokens = Math.ceil(question.length / 4);
    const responseTokens = Math.ceil(fullAnswer.length / 4);
    const totalTokens = questionTokens + responseTokens;
    const creditsUsed = calculateCreditsFromTokens(totalTokens, model);

    // Consume credits directly in frontend (since backend consumption isn't updating UI)
    setTimeout(async () => {
      await consumeCreditsDirectly(creditsUsed, model, totalTokens);
    }, 500);

    return {
      answer: fullAnswer,
      context: receivedContext,
    };
  }

  // Keep the original non-streaming function as fallback
  async function answerQuestion(question: string) {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/";
    const answerQuestionPayload = {
      question: question,
      chat_id: chatId as string,
      selected_model: displayChat?.selectedModel || "gpt-4o-mini",
      custom_prompt: displayChat?.customPrompt || null,
      temperature: displayChat?.temperature || 0.7,
      max_tokens: displayChat?.maxTokens || 1000,
      unhinged_mode: displayChat?.unhingedMode || false,
    };

    const response = await fetch(baseUrl + "answer_question", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(answerQuestionPayload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    if (json.errors && json.errors.length > 0) {
      throw new Error(json.errors[0].message);
    }

    // Store the reasoning context for graph visualization
    if (json.context) {
      setLatestReasoningContext(json.context);
    }

    // Calculate precise credit usage based on actual tokens
    const currentModel = displayChat?.selectedModel || "gpt-4o-mini";
    const questionTokens = Math.ceil(question.length / 4);
    const responseTokens = Math.ceil(json.answer.length / 4);
    const totalTokens = questionTokens + responseTokens;
    const creditsUsed = calculateCreditsFromTokens(totalTokens, currentModel);

    // Consume credits directly in frontend (since backend consumption isn't updating UI)
    setTimeout(async () => {
      await consumeCreditsDirectly(creditsUsed, currentModel, totalTokens);
    }, 500);

    // Return both answer and context to avoid state timing issues
    return {
      answer: json.answer,
      context: json.context,
    };
  }

  const handleSendMessage = async () => {
    const messageStart = performance.now();
    logUserAction("send_message_start");

    // Check if chat is archived
    if (currentChat?.isArchived) {
      toast.error(
        "Cannot send messages to an archived chat. Please restore it first.",
      );
      return;
    }

    const editorContent = editorRef.current?.getHTML() || "";
    if (!editorContent.trim() || editorContent === "<p></p>") {
      toast.error("Message cannot be empty.");
      return;
    }

    if (isStreaming || isProcessingMessage) {
      toast.error("Please wait for the current response to complete.");
      return;
    }

    const userMessage = editorRef.current?.getText() || "";

    // Sanitize the user message before processing
    const sanitizedMessage = sanitizeUserMessage(userMessage);
    if (!sanitizedMessage) {
      toast.error("Invalid message content detected.");
      logUserAction("send_message_error", performance.now() - messageStart);
      return;
    }

    if (editorRef.current?.editor) {
      editorRef.current.editor.commands.setContent("");
    }

    setIsProcessingMessage(true);

    // Add message optimistically for instant display
    const optimisticMessage = {
      sender: "user",
      text: sanitizedMessage,
      user: user?.id || "user",
      _id: `optimistic-${Date.now()}`, // Temporary ID
    };

    // Adding optimistic user message
    setOptimisticMessages((prev) => [...prev, optimisticMessage]);

    // Send user message to database (will be filtered out once persisted)
    onWrite("user", sanitizedMessage);

    // Track message sent in PostHog
    captureEvent("message_sent", {
      chatId: chatId,
      messageLength: sanitizedMessage.length,
      model: displayChat?.selectedModel || "gpt-4o-mini",
      hasCustomPrompt: !!displayChat?.customPrompt,
      unhingedMode: displayChat?.unhingedMode || false,
    });

    setIsStreaming(true);
    setStreamingContent("");

    // Scroll to bottom immediately when streaming starts
    scrollToBottomSafe(true); // Force scroll for new message

    // Call streaming GraphRAG API
    try {
      let finalContext: any[] = [];

      await answerQuestionStream(
        sanitizedMessage,
        // onContent callback - update the streaming content
        (content: string) => {
          setStreamingContent((prev) => prev + content);
        },
        // onContext callback
        (context: any[]) => {
          finalContext = context;
        },
        // onComplete callback
        (fullAnswer: string) => {
          // Write the complete bot response FIRST
          onWrite("bot", fullAnswer, finalContext);

          // Track message response received in PostHog
          const responseTime = performance.now() - messageStart;
          captureEvent("message_response_received", {
            chatId: chatId,
            responseLength: fullAnswer.length,
            responseTime: Math.round(responseTime),
            contextCount: finalContext?.length || 0,
            model: displayChat?.selectedModel || "gpt-4o-mini",
          });

          // Keep the streaming content until the real message appears
          // This prevents the visual gap that causes scroll jumping
          setTimeout(() => {
            setIsStreaming(false);
            setStreamingContent("");
          }, 200);

          // Clear any remaining optimistic messages after response is complete
          setTimeout(() => {
            setOptimisticMessages([]);
          }, 1000);
        },
      );
    } catch (error) {
      console.error("GraphRAG API error:", error);
      setIsStreaming(false);
      setStreamingContent("");

      // Clear optimistic messages on error
      setOptimisticMessages([]);

      toast.error(
        "Failed to get response from GraphRAG API. Make sure your backend is running.",
      );
      onWrite(
        "bot",
        "Sorry, I encountered an error processing your question. Please try again.",
      );
    } finally {
      setIsProcessingMessage(false);
    }
  };

  // Update ref whenever handleSendMessage changes (after it's defined)
  React.useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  }, [handleSendMessage]);

  // Scroll to bottom when content changes (only when not streaming)
  useEffect(() => {
    if (!isStreaming && displayContent && displayContent.length > 0) {
      // Use longer delay for initial load to ensure all content is rendered
      const isInitialLoad =
        !lastScrollTimeRef.current ||
        Date.now() - lastScrollTimeRef.current > 5000;
      scrollToBottomSafe(false, isInitialLoad ? 200 : 50);
    }
  }, [displayContent, isStreaming, scrollToBottomSafe]);

  // Auto-scroll during streaming
  useEffect(() => {
    if (isStreaming && streamingContent && streamingContent.length % 15 === 0) {
      scrollToBottomSafe();
    }
  }, [streamingContent, isStreaming, scrollToBottomSafe]);

  // Additional scroll after page loads are complete (for images, etc.)
  useEffect(() => {
    if (displayContent && displayContent.length > 0 && !isStreaming) {
      // Wait for images and other content to load, then scroll again
      const timer = setTimeout(() => {
        scrollToBottomSafe(true, 100); // Force scroll after content loads
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [displayContent, isStreaming, scrollToBottomSafe]);

  const isUserLoading = user === undefined;
  // Only show loading if we're actually on a chat route (not manage) and don't have a chatId yet
  const isOnChatRoute =
    pathname.includes("/dashboard/") && !pathname.includes("/dashboard/manage");
  const isEffectiveChatLoading =
    isOnChatRoute && !effectiveChatId && !isResolvingParams;
  const isLoadingFreshData = !displayContent && chatContent === undefined;

  // Render skeleton immediately when view is changing OR when we're still resolving params
  // But allow content to render once we have the basic data (chatId and user)
  // Only show skeleton briefly when switching views, or when we truly don't have data yet
  const showSkeleton =
    isOnChatRoute &&
    (isViewChanging ||
      (isResolvingParams && !cachedChatId && !chatId) ||
      (isUserLoading && !user) ||
      (isEffectiveChatLoading && !cachedChatId && !chatId));

  return (
    <>
      <div className="flex-1 overflow-y-auto relative border rounded-3xl border-zinc-200 dark:border-zinc-800 p-4 h-fit">
        <Suspense fallback={<ChatSkeleton />}>
          <ChatPageContent
            sidebarActiveView={sidebarActiveView}
            showSkeleton={showSkeleton}
            isOnChatRoute={isOnChatRoute}
            effectiveChatId={effectiveChatId}
            currentChat={currentChat}
            displayChat={displayChat}
            displayContent={displayContent}
            isLoadingInitialData={isLoadingInitialData}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
            user={user}
            displayContext={displayContext}
            editorRef={editorRef}
            input={input}
            setInput={setInput}
            handleSendMessage={handleSendMessage}
            fileInputRef={fileInputRef}
            folderInputRef={folderInputRef}
            fileKey={fileKey}
            handleFileChange={handleFileChange}
            triggerFileInput={triggerFileInput}
            triggerFolderInput={triggerFolderInput}
            isProcessingMessage={isProcessingMessage}
            showProgress={showProgress}
            progress={progress}
            progressText={progressText}
            fileQueue={fileQueue}
            setIsFileQueueSlideoutOpen={setIsFileQueueSlideoutOpen}
            triggerGraphRefresh={triggerGraphRefresh}
            onCitationClick={handleCitationClick}
            copyToClipboard={copyToClipboard}
            chatAnalytics={chatAnalytics}
            subscription={subscription}
            credits={credits}
            scrollToBottom={scrollToBottom}
          />
        </Suspense>
      </div>

      {/* File Queue Slideout - positioned to cover entire chat area (messages + input) */}
      <FileQueueSidebar
        isOpen={isFileQueueSlideoutOpen}
        onClose={() => setIsFileQueueSlideoutOpen(false)}
        queues={fileQueue.allQueues}
      />

      {/* Citation Inspector */}
      <CitationInspector
        key={`citation-inspector-${inspectedCitations.length}-${inspectedCitations[0]?.id || "empty"}`}
        isOpen={showCitationInspector}
        onClose={() => setShowCitationInspector(false)}
        citedNodes={inspectedCitations}
        onOpenInGraph={handleOpenInGraph}
      />
    </>
  );
}

export default Dashboard;
