"use client";

require("dotenv").config({ path: ".env.local" });
import { useState, useEffect, useRef, useCallback, FormEvent } from "react";
import { Textarea } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "next-themes";
import { ChevronDown, File, Lock, Paperclip, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { api } from "../../../../../../convex/_generated/api";
import { AppSidebar } from "@/app/(main)/components/sidebar";
import React from "react";
import { useUser } from "@clerk/clerk-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Spinner } from "@nextui-org/spinner";
import CodeBlock from "@/app/(main)/components/code-block";
import { ContextList } from "@/app/(main)/components/context-list";
import { APISettings } from "@/app/(main)/components/api-settings";
import Document from "@tiptap/extension-document";
import Mention from "@tiptap/extension-mention";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { EditorContent, useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import { sanitizeHTML } from "@/app/(main)/components/sanitizeHtml";
import { Badge } from "@/components/ui/badge";
import { Toaster, toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import suggestion from "@/app/(main)/components/suggestion";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import "../../../../(main)/components/styles.scss";
import { PublicNav } from "@/app/components/public-nav";
import ThemeSwitcher from "@/app/(main)/components/theme-switcher";
import { ChatNavbar } from "@/app/(main)/components/chat-navbar";

interface ChatIdPageProps {
  params: Promise<{
    chatId: Id<"chats">;
  }>;
}

// A message in the conversation
interface ChatMessage {
  sender: "user" | "bot";
  text: string;
}

interface ChatContext {
  filename: string;
  fileId: string;
}

export default function Dashboard({ params }: ChatIdPageProps) {
  const skeletonData = [
    {
      sender: "user",
      text: "        ",
    },
    {
      sender: "bot",
      text: "              ",
    },
    {
      sender: "user",
      text: "                    ",
    },
    {
      sender: "bot",
      text: "        ",
    },
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

  const BASE_URL = "https://trainly-trainly.hypermode.app/graphql";
  // const BASE_URL = "http://localhost:8686/graphql";

  const uid = function (): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const { user } = useUser();

  if (user === undefined) {
    return (
      <div className="flex flex-col justify-between w-screen h-screen">
        <div className="flex flex-col gap-4 h-full w-1/6 dark:bg-[#090909] bg-white p-4">
          <Skeleton className="h-16 w-full dark:bg-[#121212] bg-[#EFEFEF]" />
          <div className="flex gap-2 flex-col mt-8">
            <Skeleton className="h-4 w-1/3 dark:bg-[#121212] bg-[#EFEFEF]" />
            <Skeleton className="h-8 w-full dark:bg-[#121212] bg-[#EFEFEF]" />
            <Skeleton className="h-8 w-full dark:bg-[#121212] bg-[#EFEFEF]" />
            <Skeleton className="h-8 w-full dark:bg-[#121212] bg-[#EFEFEF]" />
            <Skeleton className="h-8 w-full dark:bg-[#121212] bg-[#EFEFEF]" />
            <div className="flex justify-end w-full">
              <Skeleton className="h-8 w-3/4 dark:bg-[#121212] bg-[#EFEFEF]" />
            </div>
          </div>

          <div className="flex gap-2 flex-col mt-8">
            <Skeleton className="h-4 w-1/3 dark:bg-[#121212] bg-[#EFEFEF]" />
            <Skeleton className="h-8 w-full dark:bg-[#121212] bg-[#EFEFEF]" />
            <Skeleton className="h-8 w-full dark:bg-[#121212] bg-[#EFEFEF]" />
            <Skeleton className="h-8 w-full dark:bg-[#121212] bg-[#EFEFEF]" />
            <Skeleton className="h-8 w-full dark:bg-[#121212] bg-[#EFEFEF]" />
            <Skeleton className="h-8 w-full dark:bg-[#121212] bg-[#EFEFEF]" />
          </div>
        </div>
        <div className="flex flex-col gap-4 items-end justify-end dark:bg-[#090909] bg-white h-full w-1/6 p-4">
          <Skeleton className="h-16 w-full dark:bg-[#121212] bg-[#EFEFEF]" />
        </div>
      </div>
    );
  }
  if (!user) {
    return null;
  }

  // The user’s current input
  const [input, setInput] = useState("");
  const { theme } = useTheme();
  const unwrappedParams = React.use(params);
  const chatId = unwrappedParams.chatId;
  const router = useRouter();
  const writeContent = useMutation(api.chats.writeContent);
  const chatContent = useQuery(api.chats.getChatContent, {
    id: chatId,
  });
  const currentChat = useQuery(api.chats.getChatById, {
    id: chatId,
  });

  const scrollToBottom = useCallback(
    (node: any) => {
      if (node !== null) {
        node.scrollIntoView({ behavior: "smooth" });
      }
    },
    [chatContent],
  );

  const showContext = useQuery(api.chats.getContext, {
    id: chatId,
  });

  const onWrite = (sender: string, text: string) => {
    writeContent({
      id: chatId,
      chat: {
        sender: sender,
        text: text,
        user: user.id,
      },
    });
  };

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
  });

  useEffect(() => {
    setInput(editor?.getHTML() || "");
  }, [editor?.getHTML(), editor?.getText()]);

  if (
    currentChat?.visibility === "private" &&
    currentChat?.userId !== user.id
  ) {
    router.push("/");
  }

  if (!chatContent) {
    return (
      <div className="h-screen w-screen flex flex-col p-4 font-geist">
        <div className="flex h-full justify-center overflow-y-auto w-full scrollbar-none">
          <div className="w-full max-w-2xl mx-auto p-4 mt-4 text-white">
            {skeletonData?.map((msg, index) => (
              <div
                key={index}
                className={`flex mb-4 ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`${
                    msg.sender === "user"
                      ? "dark:bg-[#333333]/40 bg-[#DDDDDD]/40 dark:text-white/90 text-black/90 max-w-[70%]"
                      : ""
                  } rounded-lg px-3 py-2  whitespace-pre-wrap`}
                >
                  {msg.sender === "bot" ? (
                    <div className="max-w-[39rem]">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-[39rem]">
                      <div className="flex items-center space-x-4">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                        <Skeleton className="h-12 w-12 rounded-full" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full max-w-2xl h-36 mx-auto bg-black/5 dark:bg-white/5 p-4 mt-4 rounded-2xl text-white ">
          <div className="p-2"></div>
        </div>
      </div>
    );
  }

  async function answerQuestion(question: string) {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_HYPERMODE_API_KEY}`,
      },
      body: JSON.stringify({
        query: `
          query($question: String!, $chatId: String!) {
            answerQuestion(question: $question, chatId: $chatId) {
              answer
              context {
                chunkId
                chunkText
                score
              }
            }
          }
        `,
        variables: { question, chatId },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    if (json.errors && json.errors.length > 0) {
      throw new Error(json.errors[0].message);
    }

    return json.data.answerQuestion.answer;
  }

  async function fetchSayHello(name: string): Promise<string> {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_HYPERMODE_API_KEY}`,
      },
      body: JSON.stringify({
        query: `
          query SayHello($name: String!) {
            sayHello(name: $name)
          }
        `,
        variables: { name },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    if (json.errors && json.errors.length > 0) {
      throw new Error(json.errors[0].message);
    }

    return json.data.sayHello;
  }

  const handleSend = async () => {
    if (input === "<p></p>") {
      toast.error("Message cannot be empty.");
      return;
    }
    if (!input.trim()) {
      toast.error("Message cannot be empty.");
      return;
    }

    // 1) Add user’s message
    const userMsg: ChatMessage = {
      sender: "user",
      text: input.trim(),
    };
    onWrite("user", input.trim());
    setInput("");

    // 2) Make the API call
    try {
      const botReply = await answerQuestion(userMsg.text);

      // 3) Add the bot’s message
      const botMsg: ChatMessage = {
        sender: "bot",
        text: botReply,
      };
      onWrite("bot", botReply);
    } catch (err) {
      toast.error("API error");
    }
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      editor?.commands.clearContent();
    }
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      editor?.chain().focus().insertContent("<p>\n</p>").run();
    }

    // If shift+enter, allow newline
  };

  if (currentChat?.visibility === "public" && currentChat.userId !== user.id) {
    return (
      <div>
        <div className="h-screen w-screen dark:bg-darkmaincolor bg-white font-geist">
          <Toaster position="top-center" richColors />
          <div className="h-screen w-screen flex flex-col pb-8 dark:bg-darkmaincolor bg-white">
            <div className="flex h-full justify-center overflow-y-auto w-full scrollbar-none">
              <div className="absolute top-4 left-72 flex items-center gap-2"></div>
              <div className="w-full max-w-3xl mx-auto p-4 mt-12 rounded-2xl text-white">
                <ChatNavbar chatId={chatId} />
                <PublicNav />
                {chatContent?.length === 0 && (
                  <p className="text-center text-gray-500">
                    No messages yet. Ask something!
                  </p>
                )}
                {chatContent?.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex mb-4 gap-2 ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.sender === "bot" && (
                      <div>
                        {theme === "dark" ? (
                          <img
                            src="/trainly_white.png"
                            className="h-8 w-8 rounded-full mt-4"
                          />
                        ) : (
                          <img
                            src="/trainly.png"
                            className="h-8 w-8 rounded-full mt-1"
                          />
                        )}
                      </div>
                    )}
                    <div
                      className={`${
                        msg.sender === "user"
                          ? "dark:bg-[#333333]/40 bg-[#DEDEDE]/40 dark:text-white/90 text-black/90 max-w-[70%]"
                          : "bg-[#7A9CC6]/0 dark:text-[#DDDDDD] text-[#222222]"
                      } rounded-lg px-3 py-2 whitespace-pre-wrap text-sm leading-relaxed`}
                    >
                      {msg.sender === "bot" ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          className="max-w-[39rem]"
                          components={{
                            code({
                              node,
                              inline,
                              className,
                              children,
                              ...props
                            }) {
                              const match = /language-(\w+)/.exec(
                                className || "",
                              );
                              const language = match ? match[1] : "";
                              return !inline && language ? (
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
                      ) : (
                        <div className="flex gap-4 items-center">
                          <div
                            dangerouslySetInnerHTML={{
                              __html: sanitizeHTML(msg.text),
                            }}
                          />
                        </div>
                      )}
                    </div>
                    {msg.sender === "user" && (
                      <img
                        src={user.imageUrl}
                        className="h-8 w-8 rounded-full"
                      />
                    )}
                  </div>
                ))}
                <div ref={scrollToBottom} />
                <div className="relative h-4"></div>
              </div>
            </div>

            {/* Wrap Textarea and mention dropdown in a relative container */}

            <div
              className="w-full max-w-3xl mx-auto bg-white dark:bg-[#151515] border border-black/10 dark:border-white/20 shadow-md shadow-black/5
              rounded-2xl text-white relative"
            >
              <div className="p-2">
                <EditorContent
                  editor={editor}
                  className="shadow-none text-black text-sm dark:text-white p-2"
                  placeholder="h"
                  value={input}
                  onKeyDown={handleKeyDown}
                  data-placeholder="Type your message here..."
                />
                {editor?.getHTML() === "<p></p>" && (
                  <div className="relative text-muted-foreground text-sm bottom-[1.7rem] left-3 pointer-events-none">
                    Message Trainly...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="h-screen w-screen dark:bg-darkmaincolor bg-white font-geist">
      <Toaster position="top-center" richColors />

      <div className="h-screen w-screen flex flex-col pb-8">
        <div className="flex h-full justify-center overflow-y-auto w-full scrollbar-none">
          <div className="absolute top-4 left-72 flex items-center gap-2">
            {/* <Badge
              className=" dark:bg-transparent dark:text-white border dark:border-white/20
                bg-white text-black border-black/10 rounded-full shadow-none hover:bg-transparent"
            >
              <div className="flex gap-1 items-center">
                <Lock className="h-2.5 w-2.5" />
                <h1 className="text-xs font-medium">
                  {currentChat?.visibility === "private" ? (
                    <h1>Private</h1>
                  ) : (
                    <h1>Public</h1>
                  )}
                </h1>
              </div>
            </Badge> */}
          </div>
          <div className="w-full max-w-3xl mx-auto p-4 mt-12 rounded-2xl text-white">
            {chatContent?.length === 0 && (
              <p className="text-center text-gray-500">
                No messages yet. Ask something!
              </p>
            )}
            {chatContent?.map((msg, index) => (
              <div
                key={index}
                className={`flex mb-4 gap-2 ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "bot" && (
                  <div>
                    {theme === "dark" ? (
                      <img
                        src="/trainly_white.png"
                        className="h-8 w-8 rounded-full mt-1"
                      />
                    ) : (
                      <img
                        src="/trainly.png"
                        className="h-8 w-8 rounded-full mt-1"
                      />
                    )}
                  </div>
                )}
                <div
                  className={`${
                    msg.sender === "user"
                      ? "dark:bg-[#333333]/40 bg-[#DEDEDE]/40 dark:text-white/90 text-black/90 max-w-[70%]"
                      : "bg-[#7A9CC6]/0 dark:text-[#DDDDDD] text-[#222222]"
                  } rounded-lg px-3 py-2 whitespace-pre-wrap text-sm leading-relaxed`}
                >
                  {msg.sender === "bot" ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      className="max-w-[39rem]"
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
                          const language = match ? match[1] : "";
                          return !inline && language ? (
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
                  ) : (
                    <div className="flex gap-4 items-center">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHTML(msg.text),
                        }}
                      />
                    </div>
                  )}
                </div>
                {msg.sender === "user" && (
                  <img src={user.imageUrl} className="h-8 w-8 rounded-full" />
                )}
              </div>
            ))}
            <div ref={scrollToBottom} />
            <div className="relative h-4"></div>
          </div>
        </div>

        {/* Wrap Textarea and mention dropdown in a relative container */}

        <div
          className="w-full max-w-3xl mx-auto bg-white dark:bg-[#151515] border border-black/10 dark:border-white/20 shadow-md shadow-black/5
              rounded-2xl text-white relative"
        >
          {currentChat?.context?.length ? (
            <div className="p-2 transition-all flex gap-2 items-center dark:bg-[#121212] bg-[#fafafa] rounded-t-2xl overflow-x-scroll scrollbar-hide">
              <ContextList context={showContext} chatId={chatId} />
              {currentChat?.context.map((context) => (
                <div
                  key={context.fileId}
                  className="flex gap-1 items-center rounded-lg p-1 border border-black/20 dark:border-white/20
                    dark:bg-black/20 bg-white/20 pl-2"
                >
                  <div className="h-8 w-8 bg-muted-foreground/20 rounded-lg flex items-center justify-center">
                    <File className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col p-1 mr-2 max-w-[90px]">
                    <h1 className="text-black dark:text-white text-xs truncate">
                      {context.filename}
                    </h1>
                    <h1 className="text-muted-foreground text-xs">Context</h1>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className=" h-0 transition-all flex gap-2 items-center dark:bg-[#121212] bg-[#fafafa] rounded-t-2xl overflow-x-scroll"></div>
          )}
          <div className="p-2">
            <EditorContent
              editor={editor}
              className="shadow-none text-black text-sm dark:text-white p-2"
              placeholder="h"
              value={input}
              onKeyDown={handleKeyDown}
              data-placeholder="Type your message here..."
            />
            {editor?.getHTML() === "<p></p>" && (
              <div className="relative text-muted-foreground text-sm bottom-[1.7rem] left-3 pointer-events-none">
                Message Trainly...
              </div>
            )}

            <div className="flex items-center justify-between mt-2">
              <div
                className="flex gap-2 items-center justify-center bg-transparent text-white p-2
              rounded-lg transition-color duration-200 cursor-pointer"
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Paperclip className="text-muted-foreground h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center">
                      <h1>Disabled in public chats</h1>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex">
                <div
                  className="flex items-center justify-center  px-2
                text-black bg-transparent rounded-lg transition-color duration-200 cursor-pointer"
                  onClick={handleSend}
                >
                  <div
                    className={cn(
                      "p-2 border border-black/10 dark:border-white/10 rounded-lg\
                  transition-all duration-150",
                      input === "<p></p>"
                        ? "text-muted-foreground cursor-default"
                        : "text-black dark:text-white hover:bg-muted-foreground/10",
                    )}
                  >
                    {input === "<p></p>" ? (
                      <Send className="h-4 w-4 text-muted-foreground " />
                    ) : (
                      <Send className="h-4 w-4 text-black dark:text-white " />
                    )}
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
