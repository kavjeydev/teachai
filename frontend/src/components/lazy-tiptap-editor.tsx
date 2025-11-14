"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import TipTap editor only when needed
const TipTapEditor = dynamic(
  () => import("./tiptap-editor-wrapper").then((mod) => ({
    default: mod.TipTapEditorWrapper,
  })),
  {
    ssr: false,
    loading: () => (
      <div className="text-zinc-900 dark:text-white text-sm p-3 min-h-[80px] max-h-[200px] overflow-y-auto bg-transparent">
        Loading editor...
      </div>
    ),
  },
);

interface LazyTipTapEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
}

export function LazyTipTapEditor({
  value,
  onChange,
  onSend,
  placeholder = "Type your message here...",
}: LazyTipTapEditorProps) {
  const [shouldLoad, setShouldLoad] = useState(false);

  // Load editor when user focuses on input area or after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, 100); // Small delay to not block initial render

    return () => clearTimeout(timer);
  }, []);

  if (!shouldLoad) {
    return (
      <div
        className="text-zinc-900 dark:text-white text-sm p-3 min-h-[80px] max-h-[200px] overflow-y-auto bg-transparent cursor-text"
        onClick={() => setShouldLoad(true)}
        onFocus={() => setShouldLoad(true)}
        tabIndex={0}
      >
        <div className="text-zinc-400">{placeholder}</div>
      </div>
    );
  }

  return (
    <TipTapEditor
      value={value}
      onChange={onChange}
      onSend={onSend}
      placeholder={placeholder}
    />
  );
}

