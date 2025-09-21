"use client";

require("dotenv").config({ path: ".env.local" });
import { useState, useEffect, useRef, useCallback } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "next-themes";
import { File, Paperclip, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { api } from "../../../../../../convex/_generated/api";
import { ResizableSidebar } from "@/app/(main)/components/resizable-sidebar";
import React from "react";
import { useUser } from "@clerk/clerk-react";
import { useSidebarWidth } from "@/hooks/use-sidebar-width";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "@/app/(main)/components/code-block";
import { CitationMarkdown } from "@/components/citation-markdown";
import { CitationInspector } from "@/components/citation-inspector";
import { ContextList } from "@/app/(main)/components/context-list";
import { ChatSettings } from "@/components/chat-settings";
import { ModelSelector } from "@/components/model-selector";
import { useConvexAuth } from "@/hooks/use-auth-state";
import "../../../components/styles.scss";
import Document from "@tiptap/extension-document";
import Mention from "@tiptap/extension-mention";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import HardBreak from "@tiptap/extension-hard-break";
import { EditorContent, useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import suggestion from "../../../components/suggestion";
import { sanitizeHTML } from "@/app/(main)/components/sanitizeHtml";
import { Toaster, toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatNavbar } from "@/app/(main)/components/chat-navbar";
import { GraphSlideout } from "@/components/graph-slideout";
import { ApiSettingsSlideout } from "@/components/api-settings-slideout";
import { flushSync } from "react-dom";
import { startTransition } from "react";
import { MessageSquare } from "lucide-react";

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

export default function Dashboard({ params }: ChatIdPageProps) {
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

  // Get chatId from params with caching
  const [cachedChatId, setCachedChatId] = useState<Id<"chats"> | null>(null);
  const unwrappedParams = React.use(params);
  const chatId = unwrappedParams.chatId;

  // Update cached chatId when it changes
  useEffect(() => {
    if (chatId) {
      setCachedChatId(chatId);
    }
  }, [chatId]);

  // Use cached chatId if current one is undefined (during navigation)
  const effectiveChatId = chatId || cachedChatId;

  const [input, setInput] = useState("");
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [fileKey, setFileKey] = useState<Date>(new Date());
  const [isGraphSlideoutOpen, setIsGraphSlideoutOpen] = useState(false);
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);

  // Optimistic updates for instant message display
  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([]);

  const scrollToBottom = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastScrollTimeRef = useRef<number>(0);

  const currentChat = useQuery(
    api.chats.getChatById,
    !canQuery || !effectiveChatId ? skipQuery : { id: effectiveChatId },
  );
  const chatContent = useQuery(
    api.chats.getChatContent,
    !canQuery || !effectiveChatId ? skipQuery : { id: effectiveChatId },
  );
  const showContextData = useQuery(
    api.chats.getContext,
    !canQuery || !effectiveChatId ? skipQuery : { id: effectiveChatId },
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
      const hasBasicData = currentChat !== undefined && chatContent !== undefined && showContextData !== undefined;
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
        console.log("🧹 Cleaning up optimistic messages");
        setOptimisticMessages(filteredOptimistic);
      }
    }
  }, [baseContent, optimisticMessages]);

  // Debug logging for display content
  React.useEffect(() => {
    console.log("📊 Display content updated:", {
      baseContentLength: baseContent?.length,
      optimisticLength: optimisticMessages.length,
      displayContentLength: displayContent?.length,
    });
  }, [baseContent, optimisticMessages, displayContent]);

  const writeContent = useMutation(api.chats.writeContent);
  const uploadContext = useMutation(api.chats.uploadContext);

  const editor = useEditor(
    {
      extensions: [
        Document,
        Paragraph,
        Text,
        HardBreak.configure({
          keepMarks: false,
        }),
        Mention.configure({
          HTMLAttributes: {
            class: "mention",
          },
          suggestion,
        }),
        Placeholder.configure({
          placeholder: "Type your message here...",
        }),
      ],
      onUpdate: ({ editor }) => {
        setInput(editor.getHTML());
      },
      editorProps: {
        handleKeyDown: (view, event) => {
          console.log("Key pressed:", event.key, "Shift:", event.shiftKey);

          if (event.key === "Enter") {
            if (event.shiftKey) {
              // Force hard break for Shift+Enter
              console.log("Shift+Enter detected, inserting hard break");
              view.dispatch(
                view.state.tr
                  .replaceSelectionWith(
                    view.state.schema.nodes.hardBreak.create(),
                  )
                  .scrollIntoView(),
              );
              return true;
            } else {
              // Regular Enter sends the message
              event.preventDefault();
              handleSendMessage();
              return true;
            }
          }
          return false;
        },
      },
    },
    [],
  );

  const onWrite = (sender: string, text: string, reasoningContext?: any[]) => {
    if (!effectiveChatId) {
      console.error("❌ No effectiveChatId when trying to write message");
      return;
    }

    console.log(`💾 Writing ${sender} message:`, {
      text: text.substring(0, 50) + "...",
      chatId: effectiveChatId,
    });
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

  // File upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileKey(new Date());
    const files = e.target.files;
    if (!files || files.length === 0) {
      toast.error("No files selected.");
      return;
    }

    setIsUploadingFile(true);
    setShowProgress(true);
    setProgress(10);
    setProgressText("File received...");

    try {
      for (const file of files) {
        const uniqueFileId = uid();
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/";

        // Step 1: Extract text from file
        const formData = new FormData();
        formData.append("file", file);

        setProgress(30);
        setProgressText("Extracting text from document...");

        const extractResponse = await fetch(baseUrl + "extract-pdf-text", {
          method: "POST",
          body: formData,
        });

        if (!extractResponse.ok) {
          const errorData = await extractResponse.json();
          throw new Error(
            errorData.detail || "Failed to extract text from file.",
          );
        }

        const extractData = await extractResponse.json();

        setProgress(60);
        setProgressText("Creating knowledge graph nodes...");

        // Step 2: Create nodes and embeddings with extracted text
        const embeddingsPayload = {
          pdf_text: extractData.text,
          pdf_id: uniqueFileId,
          chat_id: effectiveChatId as string,
          filename: file.name,
        };

        const nodesResponse = await fetch(
          baseUrl + "create_nodes_and_embeddings",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(embeddingsPayload),
          },
        );

        if (!nodesResponse.ok) {
          const errorData = await nodesResponse.json();
          throw new Error(
            errorData.detail || "Failed to create knowledge graph nodes.",
          );
        }

        setProgress(80);
        setProgressText("Adding to knowledge graph...");

        // Add to Convex context
        if (effectiveChatId) {
          await uploadContext({
            id: effectiveChatId,
            context: {
              filename: file.name,
              fileId: uniqueFileId,
            },
          });
        }

        setProgress(100);
        setProgressText("Complete!");
        toast.success(`${file.name} uploaded successfully!`);
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Failed to upload file. Make sure your backend is running.");
    } finally {
      setIsUploadingFile(false);
      setShowProgress(false);
      setProgress(0);
      setProgressText("");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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

  // Single scroll function to prevent conflicts
  const scrollToBottomSafe = useCallback((force: boolean = false) => {
    const now = Date.now();
    // Prevent rapid successive scrolls unless forced
    if (force || now - lastScrollTimeRef.current > 100) {
      lastScrollTimeRef.current = now;
      setTimeout(() => {
        scrollToBottom.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }, []);

  // Minimal debug logging for performance
  useEffect(() => {
    if (streamingContent && streamingContent.length % 100 === 0) {
      console.log("🎨 Streaming:", streamingContent.length, "chars");
    }
  }, [streamingContent]);

  // Memoize chat content rendering for performance
  const memoizedChatContent = React.useMemo(
    () =>
      displayContent?.map((msg: any, index: number) => (
        <div
          key={`${index}-${msg.sender}-${msg.text?.substring(0, 20)}`}
          className="mb-8"
        >
          {msg.sender === "user" ? (
            // User message - improved bubble style with better padding
            <div className="flex justify-end gap-4 mb-6">
              <div className="bg-trainlymainlight text-white rounded-2xl px-3 py-2.5 text-sm leading-relaxed max-w-[75%] shadow-lg shadow-trainlymainlight/20 font-inter selectable">
                <div
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHTML(msg.text),
                  }}
                />
              </div>
              {user?.imageUrl && (
                <img
                  src={user.imageUrl}
                  className="w-8 h-8 rounded-lg flex-shrink-0 mt-1 shadow-sm"
                />
              )}
            </div>
          ) : (
            // AI response - improved formatting for better readability
            <div className="flex gap-4 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-trainlymainlight/20">
                <span className="text-white font-bold text-xs">T</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl px-5 py-4 max-w-[90%] shadow-sm selectable">
                <CitationMarkdown
                  content={msg.text}
                  reasoningContext={msg.reasoningContext || []}
                  onCitationClick={(chunkIndex) => {
                    handleCitationClick(chunkIndex, msg.reasoningContext || []);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )),
    [displayContent, user?.imageUrl],
  );

  // Function to trigger graph refresh
  const triggerGraphRefresh = () => {
    const newTrigger = graphRefreshTrigger + 1;
    console.log(
      `🔄 Dashboard: Triggering graph refresh (${graphRefreshTrigger} → ${newTrigger})`,
    );
    setGraphRefreshTrigger(newTrigger);
  };

  // Handle citation clicks to open inspector
  const handleCitationClick = (
    chunkIndex: number,
    messageReasoningContext: any[],
  ) => {
    console.log("=== CITATION CLICK DEBUG ===");
    console.log("Chunk index:", chunkIndex);
    console.log("Message context length:", messageReasoningContext.length);
    console.log("Message context:", messageReasoningContext);
    console.log("============================");

    if (messageReasoningContext[chunkIndex]) {
      const clickedChunk = messageReasoningContext[chunkIndex];
      console.log("Citation clicked:", clickedChunk);

      // Option 1: Show only the clicked chunk (most specific)
      // const relatedChunks = [clickedChunk];

      // Option 2: Show all chunks from this message (current behavior)
      const relatedChunks = messageReasoningContext;

      // Option 3: Show chunks from the same document within this message (original behavior)
      // const documentId = clickedChunk.chunk_id.split("-")[0];
      // const relatedChunks = messageReasoningContext.filter((chunk) =>
      //   chunk.chunk_id.startsWith(documentId + "-"),
      // );

      console.log(
        `Found ${relatedChunks.length} related chunks for this message`,
      );
      console.log("Raw related chunks:", relatedChunks);

      // Convert chunks to CitedNode format for inspector
      try {
        const citedNodes = relatedChunks.map((chunk, index) => {
          console.log(`Processing chunk ${index}:`, chunk);
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
        console.log("🔍 Setting inspected citations:", citedNodes);
        setInspectedCitations(citedNodes);
        setShowCitationInspector(true);

        console.log(`Opening inspector for ${citedNodes.length} related nodes`);
      } catch (error) {
        console.error("❌ Error processing citation nodes:", error);
        console.log("Related chunks that caused error:", relatedChunks);
      }
    } else {
      console.log(
        `Citation ${chunkIndex} not found in context. Available: 0-${messageReasoningContext.length - 1}`,
      );
      toast.error(
        `Citation [^${chunkIndex}] not available. Only ${messageReasoningContext.length} chunks provided.`,
      );
    }
  };

  // Handle opening specific node in full graph view
  const handleOpenInGraph = (nodeId: string) => {
    // Close inspector
    setShowCitationInspector(false);

    // Open graph slideout
    setIsGraphSlideoutOpen(true);

    // Set the specific node for highlighting from inspected citations
    const nodeChunk = inspectedCitations.find((node) => node.id === nodeId);
    if (nodeChunk) {
      // Convert back to reasoning context format
      const contextForGraph = [
        {
          chunk_id: nodeChunk.id,
          chunk_text: nodeChunk.properties.full_text,
          score: nodeChunk.properties.score,
        },
      ];
      setLatestReasoningContext(contextForGraph);
      toast.success(
        `Opening graph view for: ${nodeChunk.snippet.substring(0, 50)}...`,
      );
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
    };

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
      while (true) {
        const { done, value } = await reader.read();

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
                console.log("📡 Received streaming data:", data);

                if (data.type === "context") {
                  receivedContext = data.data;
                  onContext(receivedContext);
                  setLatestReasoningContext(receivedContext);
                  console.log(
                    "📚 Streaming context received:",
                    receivedContext,
                  );
                } else if (data.type === "content") {
                  fullAnswer += data.data;
                  console.log("✍️ Streaming content chunk:", data.data);
                  onContent(data.data);
                } else if (data.type === "end") {
                  console.log("🏁 Stream ended, final answer:", fullAnswer);
                  onComplete(fullAnswer);
                  return {
                    answer: fullAnswer,
                    context: receivedContext,
                  };
                }
              }
            } catch (e) {
              console.warn("Failed to parse streaming data:", line, e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

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
      console.log("Full API response:", json);
      console.log("Reasoning context received:", json.context);
      console.log("Context length:", json.context.length);
      json.context.forEach((chunk: any, index: number) => {
        console.log(
          `Context[${index}]:`,
          chunk.chunk_id,
          chunk.chunk_text.substring(0, 100),
        );
      });
    }

    // Return both answer and context to avoid state timing issues
    return {
      answer: json.answer,
      context: json.context,
    };
  }

  const handleSendMessage = async () => {
    const editorContent = editor?.getHTML() || "";
    if (!editorContent.trim() || editorContent === "<p></p>") {
      toast.error("Message cannot be empty.");
      return;
    }

    if (isStreaming || isProcessingMessage) {
      toast.error("Please wait for the current response to complete.");
      return;
    }

    const userMessage = editor?.getText() || "";
    if (editor) {
      editor.commands.setContent("");
    }

    setIsProcessingMessage(true);

    // Add message optimistically for instant display
    const optimisticMessage = {
      sender: "user",
      text: userMessage,
      user: user?.id || "user",
      _id: `optimistic-${Date.now()}`, // Temporary ID
    };

    console.log("📝 Adding optimistic user message:", userMessage);
    setOptimisticMessages((prev) => [...prev, optimisticMessage]);

    // Send user message to database (will be filtered out once persisted)
    onWrite("user", userMessage);

    setIsStreaming(true);
    setStreamingContent("");

    // Scroll to bottom immediately when streaming starts
    scrollToBottomSafe(true); // Force scroll for new message

    // Call streaming GraphRAG API
    try {
      let finalContext: any[] = [];

      await answerQuestionStream(
        userMessage,
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
        "Sorry, I encountered an error processing your question. Please make sure the backend server is running and try again.",
      );
    } finally {
      setIsProcessingMessage(false);
    }
  };

  // Scroll to bottom when content changes (only when not streaming)
  useEffect(() => {
    if (!isStreaming && displayContent && displayContent.length > 0) {
      scrollToBottomSafe();
    }
  }, [displayContent, isStreaming, scrollToBottomSafe]);

  // Auto-scroll during streaming
  useEffect(() => {
    if (isStreaming && streamingContent && streamingContent.length % 15 === 0) {
      scrollToBottomSafe();
    }
  }, [streamingContent, isStreaming, scrollToBottomSafe]);

  if (user === undefined) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!effectiveChatId) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 dark:text-slate-400">Loading chat...</p>
        </div>
      </div>
    );
  }

  // Show loading indicator in navbar instead of full screen for better UX
  const isLoadingFreshData = !displayContent && chatContent === undefined;

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Toaster position="top-center" richColors />

      {/* Resizable Sidebar */}
      <ResizableSidebar chatId={effectiveChatId} />

      {/* Main Content Area - Responsive to sidebar width */}
      <div
        className="h-screen flex flex-col relative"
        style={{
          marginLeft: `${sidebarWidth}px`,
          transition: "margin-left 300ms ease-out",
        }}
      >
        <ChatNavbar
          chatId={effectiveChatId}
          onGraphToggle={() => setIsGraphSlideoutOpen(!isGraphSlideoutOpen)}
          isGraphOpen={isGraphSlideoutOpen}
          reasoningContextCount={latestReasoningContext.length}
          onApiSettingsToggle={() => setIsApiSettingsOpen(!isApiSettingsOpen)}
        />

        {/* Chat Messages Area - Full width */}
        <div className="flex-1 overflow-y-auto relative">
          <div className="w-full h-full px-4 py-3 max-w-4xl mx-auto">
            {/* Loading overlay for initial data */}
            {isLoadingInitialData && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 animate-pulse">
                    Loading your chat...
                  </p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!isLoadingInitialData && displayContent?.length === 0 && !isStreaming && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-trainlymainlight/20">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 font-inter">
                  Start Your GraphRAG Chat
                </h3>
                <p className="text-base text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto leading-relaxed font-inter">
                  Upload documents and ask questions to build your knowledge
                  graph. Watch as relationships form and your AI becomes more
                  intelligent.
                </p>
              </div>
            )}

            {/* Chat content - only show when not in initial loading */}
            {!isLoadingInitialData && memoizedChatContent}

            {/* Streaming message display */}
            {(isStreaming || streamingContent) && (
              <div
                ref={streamingMessageRef}
                key={`streaming-${streamingContent.length}`}
                className="mb-8"
              >
                <div className="flex gap-4 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-trainlymainlight/20">
                    <span className="text-white font-bold text-xs">T</span>
                  </div>
                  <div
                    ref={streamingRef}
                    className="bg-slate-50 dark:bg-slate-800 rounded-2xl px-5 py-4 max-w-[90%] shadow-sm selectable"
                  >
                    {streamingContent ? (
                      <div className="whitespace-pre-wrap text-slate-900 dark:text-white text-sm leading-relaxed font-inter">
                        {streamingContent}
                        {/* Blinking cursor to show active streaming */}
                        <span className="inline-block w-0.5 h-5 bg-trainlymainlight ml-1 animate-pulse"></span>
                      </div>
                    ) : (
                      <div className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-trainlymainlight rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-trainlymainlight rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-trainlymainlight rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <span>Thinking...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div ref={scrollToBottom} />
          </div>

        </div>

        {/* Enhanced Input Area */}
        <div className="px-12 pb-8 pt-4 max-w-5xl mx-auto w-full">
          <div className="bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden">
            {/* Context Files */}
            {displayChat?.context?.length ? (
              <div className="px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 bg-trainlymainlight/10 rounded-md flex items-center justify-center">
                    <File className="h-2.5 w-2.5 text-trainlymainlight" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Context Files
                  </span>
                </div>
                <div className="flex gap-2 items-center overflow-x-auto">
                  <ContextList
                    context={displayContext}
                    chatId={effectiveChatId}
                    onContextDeleted={triggerGraphRefresh}
                  />
                  {displayChat?.context.map((context: any) => (
                    <div
                      key={context.fileId}
                      className="flex gap-2 items-center rounded-lg p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0 hover:border-trainlymainlight/30 transition-all duration-200 shadow-sm"
                    >
                      <div className="h-6 w-6 bg-gradient-to-br from-trainlymainlight/20 to-purple-100 dark:from-trainlymainlight/20 dark:to-slate-700 rounded-md flex items-center justify-center">
                        <File className="h-3 w-3 text-trainlymainlight" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-slate-900 dark:text-white truncate max-w-[100px]">
                          {context.filename}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Context
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Enhanced Message Input */}
            <div className="p-4 relative">
              <div className="relative group">
                {/* Input Container */}
                <div
                  className="relative bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 group-focus-within:border-trainlymainlight/50 group-focus-within:shadow-lg group-focus-within:shadow-trainlymainlight/10 transition-all duration-300 cursor-text"
                  onClick={() => editor?.commands.focus()}
                >
                  <EditorContent
                    editor={editor}
                    className="text-slate-900 dark:text-white text-sm p-3 min-h-[80px] max-h-[200px] overflow-y-auto focus:outline-none bg-transparent resize-none"
                  />

                  {/* Enhanced Placeholder */}
                  {editor?.getHTML() === "<p></p>" && (
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Sparkles className="w-3.5 h-3.5 opacity-50" />
                        <span className="text-sm">
                          Ask anything about your documents...
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={handleFileChange}
                    key={fileKey.getTime()}
                  />

                  {/* Input Actions */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                    {/* Model Selector - subtle and integrated */}
                    <ModelSelector
                      chatId={effectiveChatId}
                      currentModel={displayChat?.selectedModel}
                      onModelChange={() => {
                        // Optionally trigger a refresh of chat data
                      }}
                      compact={true}
                    />

                    {/* Chat Settings Button */}
                    <ChatSettings
                      chatId={effectiveChatId}
                      currentPrompt={displayChat?.customPrompt}
                      currentTemperature={displayChat?.temperature}
                      currentMaxTokens={displayChat?.maxTokens}
                      onSettingsChange={() => {
                        // Optionally trigger a refresh of chat data
                      }}
                    />

                    {/* File Upload Button */}
                    <button
                      onClick={triggerFileInput}
                      disabled={isUploadingFile || isStreaming}
                      className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors group/upload"
                      title={isUploadingFile ? "Uploading..." : "Upload document"}
                    >
                      {isUploadingFile ? (
                        <div className="w-3.5 h-3.5 border border-trainlymainlight/50 border-t-trainlymainlight rounded-full animate-spin" />
                      ) : (
                        <Paperclip className="w-3.5 h-3.5 text-slate-400 group-hover/upload:text-trainlymainlight transition-colors" />
                      )}
                    </button>

                    {/* Send Button */}
                    <button
                      onClick={handleSendMessage}
                      disabled={!editor?.getText()?.trim() || isStreaming || isProcessingMessage || isUploadingFile}
                      className="bg-trainlymainlight hover:bg-trainlymainlight/90 disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-trainlymainlight/25 disabled:shadow-none"
                    >
                      {isStreaming || isProcessingMessage ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Progress Indicator */}
                {showProgress && (
                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-5 h-5 bg-trainlymainlight/10 rounded-md flex items-center justify-center">
                        <Sparkles className="h-3 w-3 text-trainlymainlight animate-pulse" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {progressText}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-trainlymainlight to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>Press</span>
                    <kbd className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded text-xs font-mono">
                      Enter
                    </kbd>
                    <span>to send,</span>
                    <kbd className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded text-xs font-mono">
                      Shift+Enter
                    </kbd>
                    <span>for new line</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    <span>Supports PDF, DOC, TXT files</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* API Settings Slideout - positioned to cover entire chat area (messages + input) */}
        <ApiSettingsSlideout
          chatId={effectiveChatId}
          isOpen={isApiSettingsOpen}
          onClose={() => setIsApiSettingsOpen(false)}
        />

        {/* Graph Slideout - positioned to cover entire chat area (messages + input) */}
        <GraphSlideout
          chatId={effectiveChatId}
          isOpen={isGraphSlideoutOpen}
          onClose={() => setIsGraphSlideoutOpen(false)}
          reasoningContext={latestReasoningContext}
          refreshTrigger={graphRefreshTrigger}
        />
      </div>

      {/* Citation Inspector */}
      <CitationInspector
        key={`citation-inspector-${inspectedCitations.length}-${inspectedCitations[0]?.id || "empty"}`}
        isOpen={showCitationInspector}
        onClose={() => setShowCitationInspector(false)}
        citedNodes={inspectedCitations}
        onOpenInGraph={handleOpenInGraph}
      />
    </div>
  );
}
