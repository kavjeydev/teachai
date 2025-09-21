"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { SimpleApiManager } from "@/components/simple-api-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Settings, Key, Zap, Shield, BookOpen, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiSettingsSlideoutProps {
  chatId: Id<"chats">;
  isOpen: boolean;
  onClose: () => void;
}

export function ApiSettingsSlideout({ chatId, isOpen, onClose }: ApiSettingsSlideoutProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  // Get chat data
  const currentChat = useQuery(api.chats.getChatById, { id: chatId });

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure smooth slide-in animation
      setTimeout(() => {
        setIsAnimating(true);
      }, 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 500); // Match slower animation duration
  }, [onClose]);

  // Handle escape key to close slideout
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 bg-white dark:bg-slate-900 shadow-2xl z-50 transition-transform duration-500 ease-in-out overflow-y-auto",
        isAnimating ? "translate-x-0" : "translate-x-full"
      )}
    >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  API Settings
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {currentChat?.title || "Loading..."}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {currentChat ? (
            <>
              {/* Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Common API management tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      variant="outline"
                      className="justify-start h-auto p-4"
                      asChild
                    >
                      <a href="/docs" target="_blank" className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <div className="text-left">
                          <div className="font-medium">View Documentation</div>
                          <div className="text-xs text-slate-500">Complete API reference and examples</div>
                        </div>
                        <ExternalLink className="w-4 h-4 ml-auto" />
                      </a>
                    </Button>

                    <Button
                      variant="outline"
                      className="justify-start h-auto p-4"
                      asChild
                    >
                      <a href="/api-docs" target="_blank" className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-green-600" />
                        <div className="text-left">
                          <div className="font-medium">Test API</div>
                          <div className="text-xs text-slate-500">Interactive API testing interface</div>
                        </div>
                        <ExternalLink className="w-4 h-4 ml-auto" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* API Manager */}
              <SimpleApiManager
                chatId={chatId}
                chatTitle={currentChat.title || "Untitled Chat"}
              />
            </>
          ) : (
            // Loading state
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Loading API settings...
                </p>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
