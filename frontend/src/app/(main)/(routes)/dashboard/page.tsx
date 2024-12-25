"use client";

import { useState, useEffect, useRef } from "react";
import { Textarea } from "@nextui-org/input";
import { Button } from "@nextui-org/button";

// Optional icons (swap with your own)

const PaperclipIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 10l4.553-4.553a2 2 0 012.828 0l1.414 1.414a2 2 0 010 2.828L17.414 17H6a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v8z"
    />
  </svg>
);

const UploadIcon = () => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const SendIcon = () => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

// A message in the conversation
interface ChatMessage {
  sender: "user" | "bot";
  text: string;
}

export default function Dashboard() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // The user’s current input
  const [input, setInput] = useState("");
  // For loading / error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");

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

  async function answerQuestion(question: string) {
    const response = await fetch("http://localhost:8686/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query($question: String!) {
            answerQuestion(question: $question)
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

    return json.data.answerQuestion;
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
    setMessages((prev) => [...prev, userMsg]);

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
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("API error:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Clear conversation (optional)
  const handleClear = () => {
    setMessages([]);
    setInput("");
    setError(null);
    setLoading(false);
  };

  return (
    <div className="h-screen w-screen flex flex-col p-4">
      {/*
        1) Scrollable conversation area
           "flex-1" => takes up remaining screen height
           "overflow-y-auto w-full" => wide as screen, scrollbar on far right
      */}
      <div className="flex-1 overflow-y-auto w-full">
        {/*
          2) Inner container for the chat content
             "max-w-2xl mx-auto" => centers the chat content
             but doesn't affect the scrollbar position.
        */}
        <div className="bg-transparent px-[24rem] rounded-md p-4 mt-2">
          {messages.length === 0 && (
            <p className="text-center text-gray-500">
              No messages yet. Ask something!
            </p>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex mb-2 ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`${
                  msg.sender === "user"
                    ? "bg-[#333333]/40 text-white"
                    : "bg-[#7A9CC6]/70 text-white"
                } rounded-lg px-3 py-2 max-w-[70%] whitespace-pre-wrap`}
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
      <div className="w-full max-w-2xl mx-auto bg-black/40 p-4 mt-4 rounded-2xl text-white shadow-lg">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ color: "white" }}
          classNames={{
            label: "text-white/50 dark:text-white/90 mb-2",
            input:
              "bg-transparent placeholder:text-white/50 dark:placeholder:text-white/60",
            innerWrapper: "bg-transparent",
            inputWrapper:
              "shadow-xl bg-black/50 dark:bg-black/20 backdrop-blur-xl backdrop-saturate-200 hover:bg-default-200/70 dark:hover:bg-default-900/70 group-data-[focus=true]:bg-black/50 dark:group-data-[focus=true]:bg-white/5 !cursor-text",
          }}
          placeholder="Type your message..."
          radius="lg"
          minRows={3}
        />

        <div className="flex items-center justify-between mt-2">
          <Button
            variant="ghost"
            color="primary"
            className="bg-transparent text-white hover:bg-gray-100 p-2"
            onClick={triggerFileInput}
            aria-label="Upload File"
          >
            <PaperclipIcon />
          </Button>
          {/* Hidden file input */}
          <input
            multiple
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex gap-2">
            <Button
              variant="solid"
              color="primary"
              className="bg-white text-black hover:bg-gray-100"
              onClick={handleSend}
              startContent={<SendIcon />}
            >
              {loading ? "Loading..." : "Send"}
            </Button>
            <Button
              variant="ghost"
              color="warning"
              onClick={handleClear}
              disabled={messages.length === 0}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
