"use client";

require("dotenv").config({ path: ".env.local" });
import { useState, useEffect, useRef, useCallback, FormEvent } from "react";
import { Textarea } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "next-themes";
import { File, Lock, Paperclip, Send, X } from "lucide-react";
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
import "../../../components/styles.scss";
import Document from "@tiptap/extension-document";
import Mention from "@tiptap/extension-mention";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { EditorContent, useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import suggestion from "../../../components/suggestion";
import { sanitizeHTML } from "@/app/(main)/components/sanitizeHtml";
import { Badge } from "@/components/ui/badge";
import { Toaster, toast } from "sonner";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const [progress, setProgress] = useState<number>(0);
  const [showProgress, setShowProgress] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>("");

  const [fileKey, setFileKey] = useState<Date>(new Date());
  const [editingTitle, setEditingTitle] = React.useState("");
  // The user’s current input
  const [input, setInput] = useState("");
  // For loading / error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const renameChat = useMutation(api.chats.rename);
  const { theme } = useTheme();
  const unwrappedParams = React.use(params);
  const chatId = unwrappedParams.chatId;
  const updateVisibility = useMutation(api.chats.changeChatVisibility);

  const writeContent = useMutation(api.chats.writeContent);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContent = useQuery(api.chats.getChatContent, {
    id: chatId,
  });
  const currentChat = useQuery(api.chats.getChatById, {
    id: chatId,
  });
  const [editingChatId, setEditingChatId] = React.useState<Id<"chats"> | null>(
    null,
  );
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
    console.log(editor?.getHTML());
    setInput(editor?.getHTML() || "");
  }, [editor?.getHTML()]);

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

    toast.success("Context uploaded successfully.");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("ENTER");
    setFileKey(new Date());
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
                <Paperclip className="text-black dark:text-white h-5 w-5" />
                <h1 className="text-black dark:text-white text-sm">
                  Embed Context
                </h1>
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
    if (input === "<p></p>") {
      toast.error("Message cannot be empty.");
      return;
    }
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

  const finishEditing = (chatId: Id<"chats">) => {
    renameChat({ id: chatId, title: editingTitle });
    setEditingChatId(null);
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      editor?.commands.clearContent();
    }
    if (e.key === "Enter" && e.shiftKey) {
      editor?.chain().focus().insertContent("\n").run();
    }

    // If shift+enter, allow newline
  };

  function handleVisibilityChange(selectedValue: string): void {
    updateVisibility({
      id: chatId,
      visibility: selectedValue,
    })
      .then(() => {
        toast.success("Visibility updated successfully!");
      })
      .catch((error) => {
        console.error("Failed to update visibility:", error);
        toast.error("Failed to update visibility.");
      });
  }
  return (
    <div className="h-screen w-screen bg-darkmaincolor font-geist">
      <Toaster position="top-center" richColors />
      <SidebarProvider className="h-full w-full dark:bg-[#0E0E0E] bg-white rounded-lg">
        <SidebarTrigger />

        <AppSidebar
          chatId={chatId}
          fileProgress={progress}
          showProgress={showProgress}
          progressText={progressText}
        />

        <div className="h-screen w-screen flex flex-col pb-8">
          <div className="flex h-full justify-center overflow-y-auto w-full">
            <div className="absolute top-4 left-72 flex items-center gap-2">
              <Dialog>
                <DialogTrigger>
                  <h1 className="hover:underline cursor-pointer">
                    {currentChat?.title}
                  </h1>
                </DialogTrigger>

                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Rename Chat</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Chat Name
                      </Label>
                      <Input
                        className="min-w-[180px]"
                        autoFocus
                        defaultValue={currentChat?.title}
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          console.log(e.key);
                          if (e.key === "Enter") {
                            console.log("entered");
                            finishEditing(chatId);
                            toast.success("Chat renamed successfully!");
                          }
                        }}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      size="sm"
                      onClick={() => {
                        finishEditing(chatId);
                        toast.success("Chat renamed successfully!");
                      }}
                    >
                      Save changes
                    </Button>
                    <DialogClose asChild>
                      <Button variant="bordered" size="sm">
                        Close
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger>
                  <Badge
                    className=" dark:bg-transparent dark:text-white border dark:border-white/20
                bg-white text-black border-black/10 rounded-full cursor-pointer shadow-none hover:bg-transparent"
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
                  </Badge>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit visibility</DialogTitle>
                    <DialogDescription>
                      Make changes to who can see you chat here
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Visibility
                      </Label>
                      <Select
                        defaultValue={currentChat?.visibility}
                        onValueChange={handleVisibilityChange}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select a visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="private">Private</SelectItem>
                            <SelectItem value="public">Public</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" size="sm">
                        Close
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                          className="h-8 w-8 rounded-full mt-4"
                        />
                      ) : (
                        <img
                          src="/trainly.png"
                          className="h-8 w-8 rounded-full mt-4"
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
              <div className="p-2 transition-all duration-500 flex gap-2 items-center dark:bg-[#121212] bg-[#fafafa] rounded-t-2xl overflow-x-scroll">
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
              <div className=" h-0 transition-all duration-500 flex gap-2 items-center dark:bg-[#121212] bg-[#fafafa] rounded-t-2xl overflow-x-scroll"></div>
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
                  className="flex gap-2 items-center justify-center bg-transparent text-white hover:bg-muted-foreground/10 p-2
              rounded-lg transition-color duration-200 cursor-pointer"
                  onClick={triggerFileInput}
                >
                  <Paperclip className="text-black dark:text-white h-4 w-4" />
                </div>
                {/* Hidden file input */}
                <input
                  key={fileKey.toString()}
                  multiple
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />

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
      </SidebarProvider>
    </div>
  );
}
