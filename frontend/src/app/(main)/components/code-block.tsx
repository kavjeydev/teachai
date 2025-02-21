// components/CodeBlock.tsx

import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  darcula,
  duotoneEarth,
} from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Copy, Check } from "lucide-react"; // Assuming you're using lucide-react for icons
import styles from "./CodeBlock.module.css"; // Optional: For custom styling

import { useTheme } from "next-themes";
import {
  duotoneDark,
  duotoneForest,
  duotoneLight,
  ghcolors,
  materialLight,
  oneDark,
  oneLight,
  solarizedDarkAtom,
  solarizedlight,
  vscDarkPlus,
  atomDark,
  xonokai,
  zTouch,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { github } from "react-syntax-highlighter/dist/cjs/styles/hljs";

interface CodeBlockProps {
  language: string;
  value: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  const [isCopied, setIsCopied] = useState(false);
  const { theme } = useTheme();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  const customVscLightPlus = {
    ...vscDarkPlus, // Start by copying the dark theme
    'pre[class*="language-"]': {
      ...vscDarkPlus['pre[class*="language-"]'],
      background: "#f5f5f5", // Light background
      color: "#333333", // Dark text color
      overflow: "auto",
    },
    'code[class*="language-"]': {
      ...vscDarkPlus['code[class*="language-"]'],
      color: "#333333", // Dark text color
    },
    // Customize specific token colors for light theme
    comment: {
      color: "#6a9955",
      fontStyle: "italic",
    },
    keyword: {
      color: "#0000ff",
    },
    string: {
      color: "#a31515",
    },
    function: {
      color: "#795e26",
    },
    number: {
      color: "#098658",
    },
    operator: {
      color: "#000000",
    },
    boolean: {
      color: "#0000ff",
    },
    punctuation: {
      color: "#000000",
    },
    tag: {
      color: "#800000",
    },
    "attr-name": {
      color: "#2b91af",
    },
    interpolation: {
      color: "red",
    },
    // Add more token customizations as needed
  };

  return (
    <div className="relative bg-red-400 rounded-full">
      <SyntaxHighlighter
        language={language}
        style={theme === "dark" ? vscDarkPlus : customVscLightPlus}
        PreTag="div"
      >
        {value}
      </SyntaxHighlighter>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 flex items-center justify-center bg-gray-700 bg-opacity-50 text-white rounded px-2 py-1 hover:bg-opacity-75 transition"
        aria-label="Copy code"
      >
        {isCopied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        <span className="ml-1 text-sm">{isCopied ? "Copied!" : "Copy"}</span>
      </button>
    </div>
  );
};

export default CodeBlock;
