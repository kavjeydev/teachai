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
import "../../../components/styles.scss";
import Document from "@tiptap/extension-document";
import Mention from "@tiptap/extension-mention";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { EditorContent, useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import suggestion from "../../../components/suggestion";
import { sanitizeHTML } from "@/app/(main)/components/sanitizeHtml";
import { Toaster, toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatNavbar } from "@/app/(main)/components/chat-navbar";
import { GraphSidebar } from "@/components/graph-sidebar";

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

  // Get chatId from params
  const unwrappedParams = React.use(params);
  const chatId = unwrappedParams.chatId;

  const [input, setInput] = useState("");
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [fileKey, setFileKey] = useState<Date>(new Date());
  const [isGraphSidebarOpen, setIsGraphSidebarOpen] = useState(false);

  const scrollToBottom = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentChat = useQuery(api.chats.getChatById, { id: chatId });
  const chatContent = useQuery(api.chats.getChatContent, { id: chatId });
  const showContextData = useQuery(api.chats.getContext, { id: chatId });

  const writeContent = useMutation(api.chats.writeContent);
  const uploadContext = useMutation(api.chats.uploadContext);

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
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
  });

  const onWrite = (sender: string, text: string, reasoningContext?: any[]) => {
    writeContent({
      id: chatId,
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
          chat_id: chatId as string,
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
        await uploadContext({
          id: chatId,
          context: {
            filename: file.name,
            fileId: uniqueFileId,
          },
        });

        setProgress(100);
        setProgressText("Complete!");
        toast.success(`${file.name} uploaded successfully!`);
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Failed to upload file. Make sure your backend is running.");
    } finally {
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

  // Handle citation clicks to open inspector
  const handleCitationClick = (
    chunkIndex: number,
    messageReasoningContext: any[],
  ) => {
    if (messageReasoningContext[chunkIndex]) {
      const clickedChunk = messageReasoningContext[chunkIndex];
      console.log("Citation clicked:", clickedChunk);

      // Find related chunks from the same document
      const documentId = clickedChunk.chunk_id.split("-")[0];
      const relatedChunks = messageReasoningContext.filter((chunk) =>
        chunk.chunk_id.startsWith(documentId + "-"),
      );

      // Convert chunks to CitedNode format for inspector
      const citedNodes = relatedChunks.map((chunk) => ({
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
      }));

      // Open citation inspector
      setInspectedCitations(citedNodes);
      setShowCitationInspector(true);

      console.log(`Opening inspector for ${citedNodes.length} related nodes`);
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

    // Open graph sidebar
    setIsGraphSidebarOpen(true);

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

  // GraphRAG API integration
  async function answerQuestion(question: string) {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/";
    const answerQuestionPayload = {
      question: question,
      chat_id: chatId as string,
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

    return json.answer;
  }

  const handleSendMessage = async () => {
    const editorContent = editor?.getHTML() || "";
    if (!editorContent.trim() || editorContent === "<p></p>") {
      toast.error("Message cannot be empty.");
      return;
    }

    const userMessage = editor?.getText() || "";
    if (editor) {
      editor.commands.setContent("");
    }

    // Send user message
    onWrite("user", userMessage);

    // Call actual GraphRAG API
    try {
      const botReply = await answerQuestion(userMessage);

      // Write bot response with reasoning context
      onWrite("bot", botReply, latestReasoningContext);
    } catch (error) {
      console.error("GraphRAG API error:", error);
      toast.error(
        "Failed to get response from GraphRAG API. Make sure your backend is running.",
      );
      onWrite(
        "bot",
        "Sorry, I encountered an error processing your question. Please make sure the backend server is running and try again.",
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    scrollToBottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatContent]);

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

  if (!chatId) {
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

  // Show chat skeleton while data is loading
  if (!currentChat || chatContent === undefined) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <ResizableSidebar chatId={chatId} />
        <div
          className="h-screen flex flex-col"
          style={{
            marginLeft: `${sidebarWidth}px`,
            transition: "margin-left 300ms ease-out",
          }}
        >
          <div className="flex items-center justify-between w-full h-12 px-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
            <Skeleton className="h-6 w-32" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="w-full h-full px-6 py-4 max-w-4xl mx-auto">
              <div className="space-y-6">
                {/* Chat message skeletons */}
                <div className="flex gap-4">
                  <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                  <div className="flex-1 max-w-[80%]">
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </div>
                </div>
                <div className="flex gap-4 justify-end">
                  <div className="flex-1 max-w-[80%] flex justify-end">
                    <Skeleton className="h-12 w-48 rounded-xl" />
                  </div>
                  <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                </div>
                <div className="flex gap-4">
                  <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                  <div className="flex-1 max-w-[80%]">
                    <Skeleton className="h-20 w-full rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Input skeleton */}
          <div className="p-4">
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        </div>

        {/* Graph Sidebar */}
        <GraphSidebar
          chatId={chatId}
          isOpen={isGraphSidebarOpen}
          onToggle={() => setIsGraphSidebarOpen(!isGraphSidebarOpen)}
          reasoningContext={latestReasoningContext}
        />

        {/* Citation Inspector */}
        <CitationInspector
          isOpen={showCitationInspector}
          onClose={() => setShowCitationInspector(false)}
          citedNodes={inspectedCitations}
          onOpenInGraph={handleOpenInGraph}
        />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Toaster position="top-center" richColors />

      {/* Resizable Sidebar */}
      <ResizableSidebar chatId={chatId} />

      {/* Main Content Area - Responsive to sidebar width */}
      <div
        className="h-screen flex flex-col"
        style={{
          marginLeft: `${sidebarWidth}px`,
          transition: "margin-left 300ms ease-out",
        }}
      >
        <ChatNavbar
          chatId={chatId}
          onGraphToggle={() => setIsGraphSidebarOpen(!isGraphSidebarOpen)}
          isGraphOpen={isGraphSidebarOpen}
          reasoningContextCount={latestReasoningContext.length}
        />

        {/* Chat Messages Area - Full width */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full h-full px-4 py-3 max-w-4xl mx-auto">
            {chatContent?.length === 0 && (
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
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  Start Your GraphRAG Chat
                </h3>
                <p className="text-base text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">
                  Upload documents and ask questions to build your knowledge
                  graph. Watch as relationships form and your AI becomes more
                  intelligent.
                </p>
              </div>
            )}

            {chatContent?.map((msg: any, index: number) => (
              <div key={index} className="mb-8">
                {msg.sender === "user" ? (
                  // User message - keep bubble style
                  <div className="flex justify-end gap-4 mb-6">
                    <div className="bg-trainlymainlight text-white rounded-xl px-4 py-3 text-sm leading-relaxed max-w-[80%] shadow-lg shadow-trainlymainlight/20">
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
                  // AI response - bubble without border, smaller text
                  <div className="flex gap-4 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-trainlymainlight/20">
                      <span className="text-white font-bold text-xs">T</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 max-w-[85%] shadow-sm">
                      <CitationMarkdown
                        content={msg.text}
                        reasoningContext={msg.reasoningContext || []}
                        onCitationClick={(chunkIndex) =>
                          handleCitationClick(
                            chunkIndex,
                            msg.reasoningContext || [],
                          )
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={scrollToBottom} />
          </div>
        </div>

        {/* Enhanced Input Area */}
        <div className="px-12 pb-8 pt-4 max-w-5xl mx-auto w-full">
          <div className="bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden">
            {/* Context Files */}
            {currentChat?.context?.length ? (
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
                  <ContextList context={showContextData} chatId={chatId} />
                  {currentChat?.context.map((context: any) => (
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
                <div className="relative bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 group-focus-within:border-trainlymainlight/50 group-focus-within:shadow-lg group-focus-within:shadow-trainlymainlight/10 transition-all duration-300">
                  <EditorContent
                    editor={editor}
                    className="text-slate-900 dark:text-white text-sm p-3 min-h-[80px] max-h-[200px] overflow-y-auto focus:outline-none bg-transparent resize-none"
                    onKeyDown={handleKeyDown}
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
                    {/* File Upload Button */}
                    <button
                      onClick={triggerFileInput}
                      className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group/upload"
                      title="Upload document"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-slate-400 group-hover/upload:text-trainlymainlight transition-colors" />
                    </button>

                    {/* Send Button */}
                    <button
                      onClick={handleSendMessage}
                      disabled={!editor?.getText()?.trim()}
                      className="bg-trainlymainlight hover:bg-trainlymainlight/90 disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-trainlymainlight/25 disabled:shadow-none"
                    >
                      <Send className="w-3.5 h-3.5" />
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
      </div>

      {/* Graph Sidebar */}
      <GraphSidebar
        chatId={chatId}
        isOpen={isGraphSidebarOpen}
        onToggle={() => setIsGraphSidebarOpen(!isGraphSidebarOpen)}
        reasoningContext={latestReasoningContext}
      />

      {/* Citation Inspector */}
      <CitationInspector
        isOpen={showCitationInspector}
        onClose={() => setShowCitationInspector(false)}
        citedNodes={inspectedCitations}
        onOpenInGraph={handleOpenInGraph}
      />
    </div>
  );
}
