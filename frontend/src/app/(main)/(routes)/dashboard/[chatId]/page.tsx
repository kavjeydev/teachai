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
import CodeBlock from "@/app/(main)/components/code-block";
import { ContextList } from "@/app/(main)/components/context-list";
import { APISettings } from "@/app/(main)/components/api-settings";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import ProgressBar from "@/app/(main)/components/progress-bar";
import "../../../components/styles.scss";

import CharacterCount from "@tiptap/extension-character-count";
import Document from "@tiptap/extension-document";
import Mention from "@tiptap/extension-mention";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { EditorContent, useEditor } from "@tiptap/react";

import suggestion from "../../../components/suggestion";

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

  const [progress, setProgress] = useState<number>(0);
  const [showProgress, setShowProgress] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>("");

  // The user’s current input
  const [input, setInput] = useState("");
  // For loading / error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");

  const { theme } = useTheme();
  const unwrappedParams = React.use(params);
  const chatId = unwrappedParams.chatId;

  const writeContent = useMutation(api.chats.writeContent);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContent = useQuery(api.chats.getChatContent, {
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
      },
    });
  };

  const limit = 280;

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      CharacterCount.configure({
        limit,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: "mention",
        },
        suggestion,
      }),
    ],
    content: `
      <p>
        What do you all think about the new <span data-type="mention" data-id="Winona Ryder"></span> movie?
      </p>
    `,
  });

  const percentage = editor
    ? Math.round((100 / limit) * editor.storage.characterCount.characters())
    : 0;

  // Upload context
  const uploadContext = useMutation(api.chats.uploadContext);

  const onUploadContext = (chatContext: ChatContext) => {
    uploadContext({
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
      for (const file of files) {
        // Generate a unique ID per file
        const uniqueFileId = uid();

        // Prepare FormData per file
        const formData = new FormData();
        formData.append("file", file);

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

        //Text extracted from file
        setProgress(30);
        setProgressText("Text extracted from file...");

        // 2) Create embeddings
        const modusResponse = await fetch(BASE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_HYPERMODE_API_KEY}`,
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

        setProgress(70);
        setProgressText("Neo4j nodes created...");
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // When both API calls succeed, call onUploadContext
        onUploadContext({
          filename: file.name,
          fileId: uniqueFileId,
        });

        console.log("Finished processing", file.name, uniqueFileId);
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

  const mentionableItems = [
    { id: "john", display: "John Doe" },
    { id: "jane", display: "Jane Smith" },
    { id: "steve", display: "Steve Jobs" },
    { id: "bill", display: "Bill Gates" },
  ];

  const [isMentioning, setIsMentioning] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(
    null,
  );

  // Filter mentionable items
  const filteredMentionables = mentionableItems.filter((item) =>
    item.display.toLowerCase().includes(mentionQuery.toLowerCase()),
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

        <div className="h-screen w-screen flex flex-col p-4">
          <div className="flex h-full justify-center overflow-y-auto w-full">
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

              <div ref={scrollToBottom} />
            </div>
          </div>
          {error && (
            <div className="w-full max-w-2xl mx-auto text-center text-red-500 mt-2">
              Error: {error}
            </div>
          )}
          <ContextList context={showContext} chatId={chatId} />
          <div className="w-full max-w-2xl mx-auto bg-black/10 dark:bg-black/40 p-4 mt-4 rounded-2xl text-white ">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled
              style={{ color: theme === "dark" ? "white" : "black" }}
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
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  // Detect "@" in the input, track mention substring
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const currentValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    setInput(currentValue);

    // Find the most recent "@"
    const lastAtPosition = currentValue.lastIndexOf("@", cursorPosition - 1);
    if (lastAtPosition !== -1) {
      // Grab the substring after "@", up to the current cursor
      const mentionText = currentValue.slice(
        lastAtPosition + 1,
        cursorPosition,
      );

      // If mentionText has no spaces or punctuation, we might be in mention mode
      if (/^[^\s@]*$/.test(mentionText)) {
        setIsMentioning(true);
        setMentionStartIndex(lastAtPosition);
        setMentionQuery(mentionText);
      } else {
        // The user typed space/punctuation => end mention mode
        setIsMentioning(false);
        setMentionQuery("");
        setMentionStartIndex(null);
      }
    } else {
      // No "@" found
      setIsMentioning(false);
      setMentionQuery("");
      setMentionStartIndex(null);
    }
  };

  function highlightMentions(text: string): string {
    // This regex finds `@` followed by non-whitespace characters until the next space/punctuation.
    // Customize as needed if your mentions can contain spaces or punctuation.
    return text.replace(/@(\S+)/g, (match, p1) => {
      // Wrap in a <span> with a background color or any style you like
      return `<span style="background-color: yellow; color: black;">@${p1}</span>`;
    });
  }

  // Insert mention text (e.g., John Doe) into the input string
  const handleSelectMention = (selected: string) => {
    if (mentionStartIndex === null || !textareaRef.current) return;

    const before = input.slice(0, mentionStartIndex);
    // +1 to skip the "@"
    const after = input.slice(mentionStartIndex + 1 + mentionQuery.length);
    const newValue = `${before}@${selected} ${after}`;

    setInput(newValue);
    setIsMentioning(false);
    setMentionQuery("");
    setMentionStartIndex(null);

    // Place the cursor right after the inserted mention
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      const newCursorPosition = before.length + 1 + selected.length + 1;
      textareaRef.current?.setSelectionRange(
        newCursorPosition,
        newCursorPosition,
      );
    });
  };

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

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSend = async () => {
    if (!input.trim()) {
      setError("Message cannot be empty.");
      return;
    }

    setError(null);

    // 1) Add user’s message
    const userMsg: ChatMessage = {
      sender: "user",
      text: input.trim(),
    };
    onWrite("user", input.trim());
    setInput("");

    // 2) Make the API call
    setLoading(true);
    try {
      const botReply = await answerQuestion(userMsg.text);

      // 3) Add the bot’s message
      const botMsg: ChatMessage = {
        sender: "bot",
        text: botReply,
      };
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
      e.preventDefault();
      handleSend();
    }
    // If shift+enter, allow newline
  };

  return (
    <SidebarProvider>
      <SidebarTrigger />

      <AppSidebar
        chatId={chatId}
        fileProgress={progress}
        showProgress={showProgress}
        progressText={progressText}
      />

      <div className="h-screen w-screen flex flex-col p-4">
        <div className="flex h-full justify-center overflow-y-auto w-full">
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
                  } rounded-lg px-3 py-2 whitespace-pre-wrap`}
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
            <div ref={scrollToBottom} />
          </div>
        </div>

        {error && (
          <div className="w-full max-w-2xl mx-auto text-center text-red-500 mt-2">
            Error: {error}
          </div>
        )}

        <ContextList context={showContext} chatId={chatId} />

        {/* Wrap Textarea and mention dropdown in a relative container */}
        <div className="w-full max-w-2xl mx-auto bg-black/10 dark:bg-black/40 p-4 mt-4 rounded-2xl text-white relative">
          {/* <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e: any) => {
              handleInputChange(e);
            }}
            onKeyDown={handleKeyDown}
            style={{ color: theme === "dark" ? "white" : "black" }}
            classNames={{
              label: "text-white/50 dark:text-white/90 mb-2",
              input:
                "bg-transparent placeholder:text-black/50 dark:placeholder:text-white/60",
              innerWrapper: "bg-transparent",
              inputWrapper:
                "bg-white/80 dark:bg-white/5 backdrop-blur-xl backdrop-saturate-200 hover:bg-white/100 dark:hover:bg-white/10 group-data-[focus=true]:bg-white/50 dark:group-data-[focus=true]:bg-white/5 !cursor-text",
            }}
            placeholder="Type your message (use @ to mention)..."
            radius="lg"
            minRows={3}
          /> */}

          <EditorContent editor={editor} />

          {/* {editor && (
            <div
              className={`character-count ${editor.storage.characterCount.characters() === limit ? "character-count--warning" : ""}`}
            >
              <svg height="20" width="20" viewBox="0 0 20 20">
                <circle r="10" cx="10" cy="10" fill="#e9ecef" />
                <circle
                  r="5"
                  cx="10"
                  cy="10"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeDasharray={`calc(${percentage} * 31.4 / 100) 31.4`}
                  transform="rotate(-90) translate(-20)"
                />
                <circle r="6" cx="10" cy="10" fill="white" />
              </svg>
              {editor.storage.characterCount.characters()} / {limit} characters
            </div>
          )} */}
          {/* Mentions dropdown */}
          {isMentioning && filteredMentionables.length > 0 && (
            <div className="absolute left-0 bottom-[100%] mb-2 w-[80%] bg-white text-black border border-gray-200 rounded shadow-lg z-10">
              {filteredMentionables.map((item) => (
                <div
                  key={item.id}
                  className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelectMention(item.display)}
                >
                  {item.display}
                </div>
              ))}
            </div>
          )}

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
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
