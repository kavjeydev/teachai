"use client";

import React from "react";

export function EmptyChatState() {
  return (
    <div className="text-center py-12">
      {/* Visual: Knowledge Graph Representation */}
      <div className="w-32 h-32 mx-auto mb-6 relative">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="url(#gradient1)"
            opacity="0.1"
          />

          {/* Central node */}
          <circle
            cx="100"
            cy="100"
            r="20"
            fill="url(#gradient2)"
            className="drop-shadow-lg"
          />

          {/* Document nodes */}
          <circle cx="60" cy="60" r="12" fill="#fbbf24" opacity="0.8" />
          <circle cx="140" cy="60" r="12" fill="#fbbf24" opacity="0.8" />
          <circle cx="60" cy="140" r="12" fill="#fbbf24" opacity="0.8" />
          <circle cx="140" cy="140" r="12" fill="#fbbf24" opacity="0.8" />
          <circle cx="50" cy="100" r="12" fill="#fbbf24" opacity="0.8" />
          <circle cx="150" cy="100" r="12" fill="#fbbf24" opacity="0.8" />

          {/* Connection lines */}
          <line
            x1="100"
            y1="100"
            x2="60"
            y2="60"
            stroke="#fbbf24"
            strokeWidth="2"
            opacity="0.4"
          />
          <line
            x1="100"
            y1="100"
            x2="140"
            y2="60"
            stroke="#fbbf24"
            strokeWidth="2"
            opacity="0.4"
          />
          <line
            x1="100"
            y1="100"
            x2="60"
            y2="140"
            stroke="#fbbf24"
            strokeWidth="2"
            opacity="0.4"
          />
          <line
            x1="100"
            y1="100"
            x2="140"
            y2="140"
            stroke="#fbbf24"
            strokeWidth="2"
            opacity="0.4"
          />
          <line
            x1="100"
            y1="100"
            x2="50"
            y2="100"
            stroke="#fbbf24"
            strokeWidth="2"
            opacity="0.4"
          />
          <line
            x1="100"
            y1="100"
            x2="150"
            y2="100"
            stroke="#fbbf24"
            strokeWidth="2"
            opacity="0.4"
          />

          {/* Document icons */}
          <rect
            x="52"
            y="52"
            width="16"
            height="20"
            rx="2"
            fill="white"
            opacity="0.9"
          />
          <line
            x1="56"
            y1="58"
            x2="64"
            y2="58"
            stroke="#fbbf24"
            strokeWidth="1.5"
          />
          <line
            x1="56"
            y1="64"
            x2="64"
            y2="64"
            stroke="#fbbf24"
            strokeWidth="1.5"
          />

          <rect
            x="132"
            y="52"
            width="16"
            height="20"
            rx="2"
            fill="white"
            opacity="0.9"
          />
          <line
            x1="136"
            y1="58"
            x2="144"
            y2="58"
            stroke="#fbbf24"
            strokeWidth="1.5"
          />
          <line
            x1="136"
            y1="64"
            x2="144"
            y2="64"
            stroke="#fbbf24"
            strokeWidth="1.5"
          />

          <rect
            x="52"
            y="132"
            width="16"
            height="20"
            rx="2"
            fill="white"
            opacity="0.9"
          />
          <line
            x1="56"
            y1="138"
            x2="64"
            y2="138"
            stroke="#fbbf24"
            strokeWidth="1.5"
          />
          <line
            x1="56"
            y1="144"
            x2="64"
            y2="144"
            stroke="#fbbf24"
            strokeWidth="1.5"
          />

          {/* Gradients */}
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <h3 className="text-2xl font-sans font-bold tracking-tighter text-zinc-900 dark:text-white mb-3">
        Start Your GraphRAG Chat
      </h3>
      <p className="text-base text-zinc-600 dark:text-zinc-400 mb-6 max-w-md mx-auto leading-relaxed font-sans">
        Upload documents to build your knowledge graph and ask intelligent questions.
      </p>
    </div>
  );
}

