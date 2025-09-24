// components/CodeBlock.tsx
import { Check, Clipboard } from "lucide-react";
import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeBlockProps {
  code: string;
  language?: string;
}

const APICodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = "typescript",
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <div className="relative h-[21rem] bg-zinc-800 rounded-md overflow-scroll">
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        showLineNumbers
        className="!bg-transparent !p-4"
      >
        {code}
      </SyntaxHighlighter>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-md p-2 focus:outline-none transition"
        aria-label="Copy code"
      >
        {isCopied ? <Check /> : <Clipboard />}
      </button>
    </div>
  );
};

export default APICodeBlock;
