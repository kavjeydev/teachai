"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Sparkles,
  Brain,
  X,
  FileText,
  BookOpen,
  Paperclip,
  FolderOpen,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInButton, useUser } from "@clerk/nextjs";
import { EditorContent, useEditor } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import HardBreak from "@tiptap/extension-hard-break";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/lib/utils";

interface HeroChatDemoProps {
  onSignupGate?: () => void;
}

export function HeroChatDemo({ onSignupGate }: HeroChatDemoProps) {
  const { user } = useUser();
  const [showSignupModal, setShowSignupModal] = useState(false);

  // If user is signed in, don't show the fake interface at all - return null
  if (user) {
    return null;
  }

  // Create an editor that allows typing but intercepts Enter
  const editor = useEditor(
    {
      extensions: [
        Document,
        Paragraph,
        Text,
        HardBreak.configure({
          keepMarks: false,
        }),
        Placeholder.configure({
          placeholder: "Ask anything about your documents...",
        }),
      ],
      editorProps: {
        handleKeyDown: (view, event) => {
          // Only intercept Enter key, allow all other typing
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleInteraction();
            return true;
          }
          // Allow all other keys to work normally
          return false;
        },
        attributes: {
          style:
            "outline: none !important; border: none !important; box-shadow: none !important;",
        },
      },
    },
    [],
  );

  const handleInteraction = () => {
    setShowSignupModal(true);
    onSignupGate?.();
  };

  const closeModal = () => {
    setShowSignupModal(false);
  };

  return (
    <div className="relative min-w-[700px] mx-auto">
      {/* Clean Dashboard Input Interface - Always Dark Mode */}
      <div className="bg-gradient-to-br from-zinc-800 via-zinc-800 to-zinc-900 backdrop-blur-xl rounded-xl overflow-hidden">
        {/* Enhanced Message Input */}
        <div className="p-1 relative">
          <div className="relative group">
            {/* Input Container */}
            <div
              className="relative bg-zinc-900/50 rounded-xl transition-all duration-300 cursor-text"
              onClick={() => editor?.commands.focus()}
            >
              <EditorContent
                editor={editor}
                className="text-white text-sm p-3 min-h-[80px] max-h-[200px] overflow-y-auto focus:outline-none bg-transparent resize-none cursor-text [&_.ProseMirror]:focus:outline-none [&_.ProseMirror]:focus:ring-0 [&_.ProseMirror]:focus:border-0"
              />

              {/* Enhanced Placeholder */}
              {editor?.getHTML() === "<p></p>" && (
                <div className="absolute top-3 left-3 pointer-events-none">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Sparkles className="w-3.5 h-3.5 opacity-50" />
                    <span className="text-sm">
                      Ask anything about your documents...
                    </span>
                  </div>
                </div>
              )}

              {/* Input Actions */}
              <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                {/* Model Selector Button */}
                <button
                  onClick={handleInteraction}
                  className="p-1.5 rounded-md hover:bg-zinc-700 transition-colors group/settings"
                  title="Model settings"
                >
                  <Settings className="w-3.5 h-3.5 text-zinc-400 group-hover/settings:text-amber-400 transition-colors" />
                </button>

                {/* File Upload Button */}
                <button
                  onClick={handleInteraction}
                  className="p-1.5 rounded-md hover:bg-zinc-700 transition-colors group/upload"
                  title="Upload documents"
                >
                  <Paperclip className="w-3.5 h-3.5 text-zinc-400 group-hover/upload:text-amber-400 transition-colors" />
                </button>

                {/* Folder Upload Button */}
                <button
                  onClick={handleInteraction}
                  className="p-1.5 rounded-md hover:bg-zinc-700 transition-colors group/folder"
                  title="Upload folder"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-zinc-400 group-hover/folder:text-amber-400 transition-colors" />
                </button>

                {/* Send Button */}
                <button
                  onClick={handleInteraction}
                  className="bg-amber-400 hover:bg-amber-400/90 text-white p-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signup Modal Overlay */}
      {showSignupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 relative">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </button>

            {/* Modal Content */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-3">
                Your conversation is ready
              </h3>

              <p className="text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                Create your free Trainly account to start building AI that
                understands your documents with visual debugging.
              </p>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <SignInButton mode="modal">
                  <Button className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white rounded-xl py-3 text-base font-medium shadow-lg shadow-amber-400/25">
                    Sign Up Free
                  </Button>
                </SignInButton>

                <Button
                  variant="outline"
                  className="w-full border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl py-3 text-base"
                  onClick={() =>
                    window.open("https://docs.trainlyai.com", "_blank")
                  }
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Docs
                </Button>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-4">
                Free forever • No credit card required • 2-minute setup
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
