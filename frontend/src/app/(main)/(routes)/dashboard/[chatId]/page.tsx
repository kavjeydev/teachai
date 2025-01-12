"use client";
require("dotenv").config({ path: ".env.local" });
import { useState, useEffect, useRef, useCallback } from "react";
import { Textarea } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "next-themes";
import { Paperclip, Send, X } from "lucide-react";
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
// Optional: For syntax highlighting
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { darcula } from "react-syntax-highlighter/dist/cjs/styles/prism";
import {
  coy,
  duotoneDark,
  duotoneSpace,
  materialDark,
  materialLight,
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import CodeBlock from "@/app/(main)/components/code-block";
import { ContextList } from "@/app/(main)/components/context-list";
import { APISettings } from "@/app/(main)/components/api-settings";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import ProgressBar from "@/app/(main)/components/progress-bar";

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
  ];
  const BASE_URL = "https://trainly-trainly.hypermode.app/graphql";
  // const BASE_URL = "http://localhost:8686/graphql";
  const uid = function (): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const { user } = useUser();
  if (user === undefined) {
    return (
      <div className="flex items-center justify-center w-screen h-screen">
        <Spinner />
      </div>
    );
  }
  if (!user) {
    return null;
  }
  const { toast } = useToast();

  // Removed the unused `messages` state
  const [progress, setProgress] = useState<number>(0);
  const [showProgress, setShowProgress] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>("");

  // The user’s current input
  const [input, setInput] = useState("");
  // For loading / error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");

  const { theme } = useTheme();
  const unwrappedParams = React.use(params);
  const chatId = unwrappedParams.chatId;

  const writeContent = useMutation(api.chats.writeContent);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContent = useQuery(api.chats.getChatContent, {
    id: chatId,
  });

  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [chatContent]);
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
    const promise = writeContent({
      id: chatId,
      chat: {
        sender: sender,
        text: text,
      },
    });
  };

  // 1) Ref to the bottom of the messages list

  const uploadContext = useMutation(api.chats.uploadContext);

  const onUploadContext = (chatContext: ChatContext) => {
    const promise = uploadContext({
      id: chatId,
      context: {
        filename: chatContext.filename,
        fileId: chatContext.fileId,
      },
    });

    toast({
      title: "File uploaded successfully!",
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("ENTER");

    // Retrieve the FileList from input
    const files = e.target.files;
    if (!files || files.length === 0) {
      setError("No files selected.");
      return;
    }

    // Show the user some loading/progress feedback
    setShowProgress(true);
    setLoading(true);
    setError("");
    setText("");

    //File received
    setProgress(10);
    setProgressText("File received...");

    try {
      /**
       * Iterate over each file in the folder (or multi-select).
       * In each iteration:
       *  1. Extract text via your PDF-extraction API.
       *  2. Create embeddings via your GraphQL endpoint.
       */
      for (const file of files) {
        // Generate a unique ID per file
        const uniqueFileId = uid();

        // Prepare FormData per file
        const formData = new FormData();
        formData.append("file", file);

        console.log("Uploading file:", file.name);

        // 1) Extract PDF text
        const response = await fetch(
          "https://api.trainlyai.com/extract-pdf-text",
          {
            method: "POST",
            body: formData,
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to extract text.");
        }

        const data = await response.json();
        console.log("Extracted text:", data.text);

        //Text extracted from file
        setProgress(30);
        setProgressText("Text extracted from file...");

        // 2) Create embeddings in your GraphQL / Neo4j
        const modusResponse = await fetch(BASE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Authorization: `Bearer ${process.env.NEXT_PUBLIC_HYPERMODE_API_KEY}`,
          },
          body: JSON.stringify({
            query: `
              mutation($pdfText: String!, $pdfId: String!, $chatId: String!, $filename: String!) {
                createNodesAndEmbeddings(pdfText: $pdfText, pdfId: $pdfId, chatId: $chatId, filename: $filename)
              }
            `,
            variables: {
              pdfText: data.text,
              pdfId: uniqueFileId,
              chatId,
              filename: file.name,
            },
          }),
        });

        if (!modusResponse.ok) {
          const errorData = await modusResponse.json();
          throw new Error(
            errorData.detail || "Failed to write nodes to neo4j.",
          );
        }

        //Nodes created from file
        setProgress(70);
        setProgressText("Neo4j nodes created...");
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // When both API calls succeed, call onUploadContext
        onUploadContext({
          filename: file.name,
          fileId: uniqueFileId,
        });

        console.log("Finished processing", file.name, uniqueFileId);
        // If you want a progress bar, you can increment it after each file or track partial progress
      }

      // All files done
      setProgress(100);
      setProgressText("Uploaded!");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
      setShowProgress(false);
    }
  };

  if (!chatContent) {
    return (
      <SidebarProvider>
        <SidebarTrigger />

        <AppSidebar
          chatId={chatId}
          fileProgress={progress}
          showProgress={showProgress}
          progressText={progressText}
        />

        {/* {showContext &&
        showContext.map((item) => (
          <div className="z-[999999] flex flex-col h-screen w-fit px-2 items-center justify-center bg-red-300">
            <div className="flex justify-between">
              {item.filename}
              <X
                className="h-4 w-4"
                onClick={() => {
                  handleErase(chatId, item.fileId);
                }}
              />
            </div>
          </div>
        ))} */}
        <div className="h-screen w-screen flex flex-col p-4">
          {/*
        1) Scrollable conversation area
           "flex-1" => takes up remaining screen height
           "overflow-y-auto w-full" => wide as screen, scrollbar on far right
      */}
          <div className="flex h-full justify-center overflow-y-auto w-full">
            {/*
          2) Inner container for the chat content
             "max-w-2xl mx-auto" => centers the chat content
             but doesn't affect the scrollbar position.
        */}

            <div className="w-full max-w-2xl mx-auto p-4 mt-4 rounded-2xl text-white">
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
                        : "bg-[#7A9CC6]/10 dark:text-[#DDDDDD] text-[#222222]"
                    } rounded-lg px-3 py-2  whitespace-pre-wrap`}
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
                      msg.text
                    )}
                  </div>
                </div>
              ))}

              {/* Dummy div at the bottom for auto-scroll */}
              <div ref={scrollToBottom} />
            </div>
          </div>

          {/* Error message (if any) */}
          {error && (
            <div className="w-full max-w-2xl mx-auto text-center text-red-500 mt-2">
              Error: {error}
            </div>
          )}

          {/*
        3) Input area pinned at the bottom (outside scrollable div).
           "max-w-2xl mx-auto" => still centered.
      */}
          <ContextList context={showContext} chatId={chatId} />

          <div className="w-full max-w-2xl mx-auto bg-black/10 dark:bg-black/40 p-4 mt-4 rounded-2xl text-white ">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled
              style={{ color: theme === "dark" ? "white" : "black" }}
              className=""
              classNames={{
                label: "text-white/50 dark:text-white/90 mb-2",
                input:
                  "bg-transparent placeholder:text-black/50 dark:placeholder:text-white/60",
                innerWrapper: "bg-transparent",
                inputWrapper:
                  "bg-white/80 dark:bg-white/5 backdrop-blur-xl backdrop-saturate-200 hover:bg-white/100 dark:hover:bg-white/10 group-data-[focus=true]:bg-white/50 dark:group-data-[focus=true]:bg-white/5 !cursor-text",
              }}
              radius="lg"
              minRows={3}
            />

            <div className="flex items-center justify-between mt-2">
              <div
                className="flex gap-2 items-center justify-center bg-transparent text-white hover:bg-muted-foreground/10 p-2
              rounded-lg transition-color duration-200 cursor-pointer"
              >
                <Paperclip className="text-muted-foreground h-5 w-5" />
                <h1 className="text-muted-foreground text-sm">Embed Context</h1>
              </div>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                multiple
              />

              <div className="flex">
                <div
                  className="flex items-center justify-center hover:bg-muted-foreground/10 py-2 px-2
                text-black bg-transparent rounded-lg transition-color duration-200 cursor-pointer"
                >
                  <Send className="h-5 w-5 text-muted-foreground" />
                  {loading && (
                    <span className="ml-2 text-sm text-gray-500">
                      Sending...
                    </span>
                  )}
                </div>
                {/* <Button
                variant="ghost"
                color="warning"
                onClick={handleClear}
                disabled={chatContent.length === 0}
              >
                Clear
              </Button> */}
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
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

    console.log(
      "RESPONSE",
      question,
      chatId,
      process.env.NEXT_PUBLIC_HYPERMODE_API_KEY,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();

    if (json.errors && json.errors.length > 0) {
      throw new Error(json.errors[0].message);
    }
    // console.log(json.data.answerQuestion.answer);
    return json.data.answerQuestion.answer;
    // return json.data.answerQuestion.context.chunkText;
  }

  // Example GraphQL fetch function (replace with your actual endpoint)
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

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Handle “Send” button
  const handleSend = async () => {
    if (!input.trim()) {
      setError("Message cannot be empty.");
      return;
    }

    // Clear previous error
    setError(null);

    // 1) Add the user’s message
    const userMsg: ChatMessage = {
      sender: "user",
      text: input.trim(),
    };
    // Use mutation to write the message
    onWrite("user", input.trim());
    // Clear the input box
    setInput("");

    // 2) Make the API call
    setLoading(true);
    try {
      const botReply = await answerQuestion(userMsg.text);

      // 3) Once the fetch is done, add the bot’s message
      const botMsg: ChatMessage = {
        sender: "bot",
        text: botReply,
      };
      // Use mutation to write the bot's reply
      onWrite("bot", botReply);
    } catch (err) {
      console.error("API error:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevents the default newline insertion
      handleSend(); // Trigger the submit action
    }
    // If Shift + Enter, do nothing and allow the default behavior
  };

  console.log("showcontext", showContext);

  return (
    <SidebarProvider>
      <SidebarTrigger />

      <AppSidebar
        chatId={chatId}
        fileProgress={progress}
        showProgress={showProgress}
        progressText={progressText}
      />
      {/* {showContext &&
        showContext.map((item) => (
          <div className="z-[999999] flex flex-col h-screen w-fit px-2 items-center justify-center bg-red-300">
            <div className="flex justify-between">
              {item.filename}
              <X
                className="h-4 w-4"
                onClick={() => {
                  handleErase(chatId, item.fileId);
                }}
              />
            </div>
          </div>
        ))} */}
      {/* {showProgress && <div>{progress}%</div>} */}
      <div className="h-screen w-screen flex flex-col p-4">
        {/*
        1) Scrollable conversation area
           "flex-1" => takes up remaining screen height
           "overflow-y-auto w-full" => wide as screen, scrollbar on far right
      */}
        <div className="flex h-full justify-center overflow-y-auto w-full">
          {/*
          2) Inner container for the chat content
             "max-w-2xl mx-auto" => centers the chat content
             but doesn't affect the scrollbar position.
        */}
          <div className="w-full max-w-2xl mx-auto p-4 mt-4 rounded-2xl text-white">
            {chatContent?.length === 0 && (
              <p className="text-center text-gray-500">
                No messages yet. Ask something!
              </p>
            )}

            {chatContent?.map((msg, index) => (
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
                      : "bg-[#7A9CC6]/0 dark:text-[#DDDDDD] text-[#222222]"
                  } rounded-lg px-3 py-2  whitespace-pre-wrap`}
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
                    msg.text
                  )}
                </div>
              </div>
            ))}

            {/* Dummy div at the bottom for auto-scroll */}
            <div ref={scrollToBottom} />
          </div>
        </div>

        {/* Error message (if any) */}
        {error && (
          <div className="w-full max-w-2xl mx-auto text-center text-red-500 mt-2">
            Error: {error}
          </div>
        )}

        {/*
        3) Input area pinned at the bottom (outside scrollable div).
           "max-w-2xl mx-auto" => still centered.
      */}
        <ContextList context={showContext} chatId={chatId} />

        <div className="w-full max-w-2xl mx-auto bg-black/10 dark:bg-black/40 p-4 mt-4 rounded-2xl text-white ">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ color: theme === "dark" ? "white" : "black" }}
            className=""
            classNames={{
              label: "text-white/50 dark:text-white/90 mb-2",
              input:
                "bg-transparent placeholder:text-black/50 dark:placeholder:text-white/60",
              innerWrapper: "bg-transparent",
              inputWrapper:
                "bg-white/80 dark:bg-white/5 backdrop-blur-xl backdrop-saturate-200 hover:bg-white/100 dark:hover:bg-white/10 group-data-[focus=true]:bg-white/50 dark:group-data-[focus=true]:bg-white/5 !cursor-text",
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            radius="lg"
            minRows={3}
          />

          <div className="flex items-center justify-between mt-2">
            <div
              className="flex gap-2 items-center justify-center bg-transparent text-white hover:bg-muted-foreground/10 p-2
              rounded-lg transition-color duration-200 cursor-pointer"
              onClick={triggerFileInput}
            >
              <Paperclip className="text-muted-foreground h-5 w-5" />
              <h1 className="text-muted-foreground text-sm">Embed Context</h1>
            </div>
            {/* Hidden file input */}
            <input
              multiple
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex">
              <div
                className="flex items-center justify-center hover:bg-muted-foreground/10 py-2 px-2
                text-black bg-transparent rounded-lg transition-color duration-200 cursor-pointer"
                onClick={handleSend}
              >
                <Send className="h-5 w-5 text-muted-foreground" />
                {loading && (
                  <span className="ml-2 text-sm text-gray-500">Sending...</span>
                )}
              </div>
              {/* <Button
                variant="ghost"
                color="warning"
                onClick={handleClear}
                disabled={chatContent.length === 0}
              >
                Clear
              </Button> */}
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
