"use client";

import { useState, useEffect, useRef } from "react";
import { Textarea } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "next-themes";
import { Paperclip, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { api } from "../../../../../../convex/_generated/api";
import { AppSidebar } from "@/app/(main)/components/sidebar";
import React from "react";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";

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

export default function Dashboard({ params }: ChatIdPageProps) {
  const { user } = useUser();
  if (user === undefined) {
    return <div></div>;
  }
  if (!user) {
    return null;
  }

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [showProgress, setShowProgress] = useState<boolean>(false);

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

  const chatContent = useQuery(api.chats.getChatContent, {
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

    toast.promise(promise, {
      success: "success",
    });
  };

  // 1) Ref to the bottom of the messages list
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 2) Whenever "messages" changes, scroll to the bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileChange = async (e: any) => {
    console.log("ENTER");
    const selectedFile = e.target.files[0];

    if (!selectedFile) {
      setError("No file selected.");
      return;
    }
    setShowProgress(true);

    // if (selectedFile.type !== "application/pdf") {
    //   setError("Please select a valid PDF file.");
    //   return;
    // }

    setLoading(true);
    setError("");
    setText("");

    const formData = new FormData();
    console.log(selectedFile);
    formData.append("file", selectedFile);
    console.log("HERE");
    try {
      const response = await fetch("http://0.0.0.0:8000/extract-pdf-text", {
        // Adjust the URL if necessary
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to extract text.");
      }
      setProgress(10);

      const data = await response.json();
      setText(data.text);

      console.log("EMBED", data.text);
      const modusResponse = await fetch("http://localhost:8686/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            mutation($pdfText: String!) {
              createNodesAndEmbeddings(pdfText: $pdfText)
            }
          `,
          variables: { pdfText: data.text },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to write nodes to neo4j.");
      }
      setProgress(100);
      setShowProgress(false);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }

    try {
    } catch (err) {
      console.log(err);
    }
  };

  if (user === undefined) {
    return <div></div>;
  }
  if (!user) {
    return null;
  }

  async function answerQuestion(question: string) {
    const response = await fetch("http://localhost:8686/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query($question: String!) {
            answerQuestion(question: $question) {
                answer
                context {
                chunkId
                chunkText
                score
                }
            }
        }
        `,
        variables: { question },
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
    // return json.data.answerQuestion.context.chunkText;
  }

  // Example GraphQL fetch function (replace with your actual endpoint)
  async function fetchSayHello(name: string): Promise<string> {
    const response = await fetch("http://localhost:8686/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    // setMessages((prev) => [...prev, userMsg]);
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
      //   setMessages((prev) => [...prev, botMsg]);
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

  return (
    <SidebarProvider>
      <SidebarTrigger />

      <AppSidebar />
      {showProgress && <div>{progress}</div>}
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
          <div className="w-full max-w-2xl mx-autop-4 mt-4 rounded-2xl text-white">
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
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Dummy div at the bottom for auto-scroll */}
            <div ref={messagesEndRef} />
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
        <div className="w-full max-w-2xl mx-auto bg-black/10 dark:bg-black/40 p-4 mt-4 rounded-2xl text-white ">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ color: cn(theme === "dark" ? "white" : "black") }}
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
              className="flex items-center justify-center bg-transparent text-white hover:bg-muted-foreground/10 p-2
              rounded-lg transition-color duration-200"
              onClick={triggerFileInput}
            >
              <Paperclip className="text-muted-foreground" />
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
                text-black bg-transparent rounded-lg transition-color duration-200"
                onClick={handleSend}
              >
                <Send className="h-5 w-5 text-muted-foreground" />
                {loading ? "" : ""}
              </div>
              {/* <Button
                variant="ghost"
                color="warning"
                onClick={handleClear}
                disabled={messages.length === 0}
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
