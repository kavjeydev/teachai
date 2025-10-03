"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "@/app/(main)/components/code-block";

interface CitationMarkdownProps {
  content: string;
  reasoningContext?: any[];
  onCitationClick?: (chunkIndex: number) => void;
}

export const CitationMarkdown: React.FC<CitationMarkdownProps> = ({
  content,
  reasoningContext,
  onCitationClick,
}) => {
  // Process content to create clickable citations with improved formatting
  const processContent = () => {
    // First, fix citation placement by moving them after periods
    let processedContent = content;

    // Find citations that appear before periods and move them after
    processedContent = processedContent.replace(
      /(\[\^(\d+)\^*\])(\s*[.!?])/g,
      "$3$1",
    );

    const parts = [];
    let lastIndex = 0;
    // Updated regex to handle multiple citation formats: [^0], [^0^], [^0^^], etc.
    const citationRegex = /\[\^(\d+)\^*\]/g;
    let match;

    // Reset regex lastIndex to ensure we catch all matches
    citationRegex.lastIndex = 0;

    while ((match = citationRegex.exec(processedContent)) !== null) {
      // Add text before citation
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: processedContent.slice(lastIndex, match.index),
          key: `text-${lastIndex}-${match.index}`,
        });
      }

      // Add citation
      const chunkIndex = parseInt(match[1]);
      parts.push({
        type: "citation",
        content: match[0],
        chunkIndex,
        key: `citation-${match.index}-${chunkIndex}`,
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < processedContent.length) {
      parts.push({
        type: "text",
        content: processedContent.slice(lastIndex),
        key: `text-${lastIndex}-end`,
      });
    }

    return parts;
  };

  const contentParts = processContent();

  return (
    <div className="text-sm leading-relaxed text-zinc-900 dark:text-white">
      {contentParts.map((part) => {
        if (part.type === "citation") {
          const hasContext =
            reasoningContext &&
            part.chunkIndex !== undefined &&
            reasoningContext[part.chunkIndex];

          return (
            <sup
              key={part.key}
              className={`inline-flex items-center justify-center min-w-[18px] h-[18px] mx-0.5 text-[11px] font-medium rounded-sm transition-all duration-200 ${
                hasContext
                  ? "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-600 hover:shadow-sm border border-zinc-300/50 dark:border-zinc-600/50"
                  : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-300/50 dark:border-red-600/50"
              }`}
              onClick={
                hasContext
                  ? (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onCitationClick?.(part.chunkIndex);
                    }
                  : undefined
              }
              title={
                hasContext
                  ? `Source: ${reasoningContext[part.chunkIndex].chunk_text.substring(0, 100)}...`
                  : `Citation ${part.chunkIndex} not available (only ${reasoningContext?.length || 0} chunks)`
              }
            >
              {hasContext ? `${part.chunkIndex + 1}` : part.content}
            </sup>
          );
        }

        // Render text parts as markdown with improved styling
        return (
          <ReactMarkdown
            key={part.key}
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => (
                <p className="mb-2 last:mb-0 leading-relaxed first:mt-0">
                  {children}
                </p>
              ),
              h1: ({ children }) => (
                <h1 className="text-lg font-bold mb-3 text-zinc-900 dark:text-white font-sans">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-base font-bold mb-2 text-zinc-900 dark:text-white font-sans">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-bold mb-2 text-zinc-900 dark:text-white font-sans">
                  {children}
                </h3>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside mb-3 space-y-1 ml-2">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside mb-3 space-y-1 ml-2">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed">{children}</li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-3 border-amber-400/30 pl-4 py-2 mb-3 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-r-lg">
                  {children}
                </blockquote>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-zinc-900 dark:text-white">
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className="italic text-zinc-700 dark:text-zinc-300">
                  {children}
                </em>
              ),
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                const language = match ? match[1] : "";
                return language ? (
                  <CodeBlock
                    language={language}
                    value={String(children).replace(/\n$/, "")}
                    {...props}
                  />
                ) : (
                  <code
                    className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono text-zinc-800 dark:text-zinc-200"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {part.content}
          </ReactMarkdown>
        );
      })}
    </div>
  );
};
