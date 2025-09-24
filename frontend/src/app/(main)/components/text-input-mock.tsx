"use client";
import { Textarea } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import React, { useState } from "react";
import { sanitizeUserMessage } from "@/lib/sanitization";

// Placeholder icons
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

interface InputMockProps {
  // 1) Add a callback prop
  onFetchComplete?: (greeting: string) => void;
  onClear?: () => void;
  placeholder?: string;
  label?: string;
}

export default function InputMock({
  onFetchComplete,
  onClear,
  placeholder = "Type your message...",
  label = "",
}: InputMockProps) {
  const [result, setResult] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GraphQL query types
  interface SayHelloResponse {
    data: {
      sayHello: string;
    };
    errors?: { message: string }[];
  }

  interface SayHelloVariables {
    name: string;
  }

  async function fetchSayHello(variables: SayHelloVariables): Promise<string> {
    const query = `query SayHello($name: String!) {
      sayHello(name: $name)
    }`;

    const response = await fetch(process.env.NEXT_PUBLIC_BASE_URL as string, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_HYPERMODE_API_KEY}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = (await response.json()) as SayHelloResponse;

    // If the server returns GraphQL errors:
    if (json.errors && json.errors.length > 0) {
      throw new Error(json.errors[0].message);
    }

    return json.data.sayHello;
  }

  const fetchData = async (userName: string) => {
    setLoading(true);
    setError(null);
    setResult("");

    try {
      const greeting = await fetchSayHello({ name: userName });
      setResult(greeting);

      // 2) Notify the parent with the result
      onFetchComplete?.(greeting);
    } catch (err) {
      console.error("API error:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async () => {
    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    // Sanitize user input before processing
    const sanitizedName = sanitizeUserMessage(name.trim());
    if (!sanitizedName) {
      setError("Invalid input detected.");
      return;
    }

    await fetchData(sanitizedName);
  };

  const handleClear = () => {
    setName("");
    setResult("");
    setError(null);
  };

  return (
    <div className="w-[95vw] p-2 rounded-2xl flex flex-col justify-between bg-black/40 text-white shadow-lg">
      <div className="flex-grow mb-2 text-white">
        <Textarea
          value={name}
          onChange={(e) => setName(e.target.value)}
          onClear={onClear}
          style={{ color: "white" }}
          classNames={{
            label: "text-white/50 dark:text-white/90 mb-2",
            input:
              "bg-transparent placeholder:text-white/50 dark:placeholder:text-white/60",
            innerWrapper: "bg-transparent",
            inputWrapper:
              "shadow-xl bg-black/50 dark:bg-black/60 backdrop-blur-xl backdrop-saturate-200 hover:bg-default-200/70 dark:hover:bg-black/70 group-data-[focus=true]:bg-black/50 dark:group-data-[focus=true]:bg-black/60 !cursor-text",
          }}
          label={label}
          placeholder={placeholder}
          radius="lg"
          minRows={5}
        />
      </div>

      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="solid"
          color="primary"
          startContent={<UploadIcon />}
          className="bg-white text-black hover:bg-zinc-100"
        />
        <Button
          variant="solid"
          color="primary"
          startContent={<SendIcon />}
          className="bg-white text-black hover:bg-zinc-100"
          onClick={handleClick}
        >
          {loading ? "Loading..." : "Send"}
        </Button>
      </div>

      <div className="w-full max-w-sm mt-2">
        {error && <p className="text-red-500 mb-2">Error: {error}</p>}
        {result && <p className="text-green-500">Result: {result}</p>}
      </div>
    </div>
  );
}
