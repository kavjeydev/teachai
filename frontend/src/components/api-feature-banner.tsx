"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Code,
  Zap,
  ArrowRight,
  Sparkles
} from "lucide-react";

export function ApiFeatureBanner() {
  return (
    <Card className="bg-gradient-to-br from-trainlymainlight/5 via-purple-50/50 to-blue-50/50 dark:from-trainlymainlight/5 dark:via-purple-900/20 dark:to-blue-900/20 border-trainlymainlight/20">
      <CardContent className="p-8">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Turn Your Chats Into APIs
                  </h3>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    New
                  </Badge>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Each chat becomes a secure API endpoint that external applications can query
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Code className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-white text-sm">
                    Simple Integration
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    One API call to query your knowledge
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-white text-sm">
                    Real-time Streaming
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Perfect for chatbots and live apps
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-white text-sm">
                    Secure & Scoped
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Each API key works only for its chat
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 mb-4">
              <code className="text-sm text-green-400 font-mono">
                {`curl -X POST api.trainlyai.com/v1/{chatId}/answer_question \\
  -H "Authorization: Bearer tk_your_key" \\
  -d '{"question": "What is machine learning?"}'`}
              </code>
            </div>
          </div>

          <div className="flex flex-col gap-3 ml-8">
            <Button
              onClick={() => window.location.href = "/api-docs"}
              className="bg-trainlymainlight hover:bg-trainlymainlight/90 text-white"
            >
              View API Docs
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = "/dashboard"}
            >
              Create First Chat
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
