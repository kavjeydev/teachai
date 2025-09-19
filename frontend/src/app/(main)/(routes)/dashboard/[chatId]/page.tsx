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

  const onWrite = (sender: string, text: string) => {
    writeContent({
      id: chatId,
      chat: {
        sender: sender,
        text: text,
        user: user?.id || "user",
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
        const formData = new FormData();
        formData.append("file", file);
        formData.append("pdf_id", uniqueFileId);
        formData.append("chat_id", chatId as string);
        formData.append("filename", file.name);

        setProgress(30);
        setProgressText("Processing document...");

        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/";
        const response = await fetch(baseUrl + "create_nodes_and_embeddings", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`);
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
      onWrite("bot", botReply);
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
        <ChatNavbar chatId={chatId} />

        {/* Chat Messages Area - Full width */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full h-full px-12 py-8 max-w-5xl mx-auto">
            {chatContent?.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-trainlymainlight/20">
                  <svg
                    className="w-12 h-12 text-white"
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
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                  Start Your GraphRAG Chat
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
                  Upload documents and ask questions to build your knowledge
                  graph. Watch as relationships form and your AI becomes more
                  intelligent.
                </p>
              </div>
            )}

            {chatContent?.map((msg: any, index: number) => (
              <div
                key={index}
                className={`flex mb-12 gap-6 ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "bot" && (
                  <div className="w-10 h-10 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-trainlymainlight/20">
                    <span className="text-white font-bold text-sm">T</span>
                  </div>
                )}

                <div
                  className={cn(
                    "rounded-2xl px-6 py-4 text-sm leading-relaxed max-w-[80%]",
                    msg.sender === "user"
                      ? "bg-trainlymainlight text-white shadow-lg shadow-trainlymainlight/20"
                      : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm",
                  )}
                >
                  {msg.sender === "bot" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(
                              className || "",
                            );
                            const language = match ? match[1] : "";
                            return language ? (
                              <CodeBlock
                                language={language}
                                value={String(children).replace(/\n$/, "")}
                                {...props}
                              />
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHTML(msg.text),
                      }}
                    />
                  )}
                </div>

                {msg.sender === "user" && user?.imageUrl && (
                  <img
                    src={user.imageUrl}
                    className="w-10 h-10 rounded-xl flex-shrink-0 mt-1 shadow-sm"
                  />
                )}
              </div>
            ))}
            <div ref={scrollToBottom} />
          </div>
        </div>

        {/* Enhanced Input Area */}
        <div className="px-12 pb-8 max-w-5xl mx-auto w-full">
          <div className="bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden">
            {/* Context Files */}
            {currentChat?.context?.length ? (
              <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 bg-trainlymainlight/10 rounded-md flex items-center justify-center">
                    <File className="h-3 w-3 text-trainlymainlight" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Context Files
                  </span>
                </div>
                <div className="flex gap-2 items-center overflow-x-auto pb-1">
                  <ContextList context={showContextData} chatId={chatId} />
                  {currentChat?.context.map((context: any) => (
                    <div
                      key={context.fileId}
                      className="flex gap-3 items-center rounded-xl p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0 hover:border-trainlymainlight/30 transition-all duration-200 shadow-sm"
                    >
                      <div className="h-8 w-8 bg-gradient-to-br from-trainlymainlight/20 to-purple-100 dark:from-trainlymainlight/20 dark:to-slate-700 rounded-lg flex items-center justify-center">
                        <File className="h-4 w-4 text-trainlymainlight" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[120px]">
                          {context.filename}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Active context
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Enhanced Message Input */}
            <div className="p-6 relative">
              <div className="relative group">
                {/* Input Label */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 bg-trainlymainlight/10 rounded-md flex items-center justify-center">
                    <Send className="h-3 w-3 text-trainlymainlight" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Ask Your Question
                  </span>
                </div>

                {/* Input Container */}
                <div className="relative bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 group-focus-within:border-trainlymainlight/50 group-focus-within:shadow-lg group-focus-within:shadow-trainlymainlight/10 transition-all duration-300">
                  <EditorContent
                    editor={editor}
                    className="text-slate-900 dark:text-white text-sm p-4 min-h-[80px] max-h-[200px] overflow-y-auto focus:outline-none bg-transparent resize-none"
                    onKeyDown={handleKeyDown}
                  />

                  {/* Enhanced Placeholder */}
                  {editor?.getHTML() === "<p></p>" && (
                    <div className="absolute top-4 left-4 pointer-events-none">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Sparkles className="w-4 h-4 opacity-50" />
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
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    {/* File Upload Button */}
                    <button
                      onClick={triggerFileInput}
                      className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group/upload"
                      title="Upload document"
                    >
                      <Paperclip className="w-4 h-4 text-slate-400 group-hover/upload:text-trainlymainlight transition-colors" />
                    </button>

                    {/* Send Button */}
                    <button
                      onClick={handleSendMessage}
                      disabled={!editor?.getText()?.trim()}
                      className="bg-trainlymainlight hover:bg-trainlymainlight/90 disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-trainlymainlight/25 disabled:shadow-none"
                    >
                      <Send className="w-4 h-4" />
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
    </div>
  );
}
