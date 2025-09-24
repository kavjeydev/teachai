"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Lock,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Copy,
  Zap,
  Users,
  ArrowRight,
  ExternalLink,
  Key,
  Globe,
  BookOpen,
  Code,
  FileText,
  Settings,
  BarChart3,
  Search,
  ChevronRight,
  Home,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ApiDocsRedesigned() {
  const [selectedSection, setSelectedSection] = useState("getting-started");
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error(`Failed to copy ${label}`);
    }
  };

  // Navigation structure
  const navigation = [
    {
      title: "Getting Started",
      icon: Home,
      items: [
        { id: "getting-started", title: "Quick Start", badge: null },
        { id: "authentication", title: "Authentication", badge: "🔐" },
        { id: "privacy-first", title: "Privacy-First API", badge: "New" },
      ],
    },
    {
      title: "API Reference",
      icon: Code,
      items: [
        { id: "token-exchange", title: "Token Exchange", badge: null },
        { id: "chat-queries", title: "Chat Queries", badge: null },
        { id: "file-uploads", title: "File Uploads", badge: null },
        { id: "analytics", title: "Analytics", badge: null },
      ],
    },
    {
      title: "Integration Guides",
      icon: BookOpen,
      items: [
        { id: "react-integration", title: "React Integration", badge: null },
        { id: "nodejs-backend", title: "Node.js Backend", badge: null },
        { id: "python-integration", title: "Python Integration", badge: null },
      ],
    },
    {
      title: "Security & Privacy",
      icon: Shield,
      items: [
        {
          id: "privacy-protection",
          title: "Privacy Protection",
          badge: "Important",
        },
        { id: "citation-filtering", title: "Citation Filtering", badge: null },
        { id: "data-isolation", title: "Data Isolation", badge: null },
      ],
    },
    {
      title: "Examples",
      icon: FileText,
      items: [
        { id: "study-assistant", title: "Study Assistant App", badge: null },
        { id: "document-analyzer", title: "Document Analyzer", badge: null },
        { id: "legal-helper", title: "Legal Document Helper", badge: null },
      ],
    },
  ];

  // Content for each section
  const sectionContent = {
    "getting-started": {
      title: "Quick Start",
      content: (
        <div className="space-y-8">
          {/* Hero */}
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-8 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
              Welcome to Trainly API
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6">
              Build AI applications with complete user privacy. Users control
              their authentication tokens and data access.
            </p>
            <div className="flex gap-3">
              <Badge
                variant="outline"
                className="border-zinc-300 text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"
              >
                🔒 User-Controlled Auth
              </Badge>
              <Badge
                variant="outline"
                className="border-zinc-300 text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"
              >
                📱 Each Chat = App
              </Badge>
              <Badge
                variant="outline"
                className="border-zinc-300 text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"
              >
                🛡️ Privacy-First
              </Badge>
            </div>
          </div>

          {/* Quick Steps */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <div className="w-10 h-10 bg-zinc-800 dark:bg-zinc-700 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-white font-bold">1</span>
                </div>
                <CardTitle className="text-lg">Get Chat API Key</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                  Enable API access for your chat in the Trainly dashboard
                </p>
                <code className="text-xs bg-zinc-100 dark:bg-zinc-800 p-2 rounded block">
                  Chat Settings → API Access → Generate Key
                </code>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <div className="w-10 h-10 bg-zinc-800 dark:bg-zinc-700 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-white font-bold">2</span>
                </div>
                <CardTitle className="text-lg">Token Exchange</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                  Exchange user's Clerk token for secure Trainly token
                </p>
                <code className="text-xs bg-zinc-100 dark:bg-zinc-800 p-2 rounded block">
                  POST /oauth/token → Bearer token
                </code>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <div className="w-10 h-10 bg-zinc-800 dark:bg-zinc-700 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-white font-bold">3</span>
                </div>
                <CardTitle className="text-lg">Query User Data</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                  Users query their private data with complete privacy
                  protection
                </p>
                <code className="text-xs bg-zinc-100 dark:bg-zinc-800 p-2 rounded block">
                  POST /me/chats/query → AI responses only
                </code>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    "privacy-first": {
      title: "Privacy-First API",
      content: (
        <div className="space-y-8">
          <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
              🔒 Complete User Privacy Protection
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Our privacy-first architecture ensures developers can build
              powerful AI apps while users maintain complete control over their
              data.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-white mb-3">
                  ✅ What Developers Get:
                </h4>
                <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-zinc-500" />
                    AI-generated responses from user data
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-zinc-500" />
                    Usage analytics and performance metrics
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-zinc-500" />
                    File upload assistance for users
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-white mb-3">
                  ❌ What's Protected:
                </h4>
                <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <li className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-zinc-500" />
                    Raw file content and downloads
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-zinc-500" />
                    Detailed citations and snippets
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-zinc-500" />
                    Cross-user data access
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    "token-exchange": {
      title: "Token Exchange",
      content: (
        <div className="space-y-8">
          <div>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
              RFC 8693 Token Exchange
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Exchange user's Clerk ID token for a short-lived Trainly access
              token. This enables user-controlled authentication without OAuth
              complexity.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Request</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-zinc-800 text-white">POST</Badge>
                  <code className="font-mono">/oauth/token</code>
                </div>

                <div className="bg-zinc-900 rounded-lg p-4">
                  <pre className="text-zinc-300 text-sm">
                    {`{
  "grant_type": "urn:ietf:params:oauth:grant-type:token-exchange",
  "subject_token_type": "urn:ietf:params:oauth:token-type:id_token",
  "subject_token": "<CLERK_ID_TOKEN>",
  "client_id": "trainly_app_<CHAT_ID>",
  "scope": "chat.query chat.upload"
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-zinc-900 rounded-lg p-4">
                <pre className="text-zinc-300 text-sm">
                  {`{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "chat.query chat.upload",
  "chat_id": "your_chat_id",
  "privacy_guarantee": {
    "user_controlled": true,
    "citations_filtered_for_apps": true,
    "no_raw_file_access": true
  }
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    "react-integration": {
      title: "React Integration",
      content: (
        <div className="space-y-8">
          <div>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
              React Integration Guide
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Complete React component for Trainly integration with
              user-controlled authentication.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>TrainlyAuth Component</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-zinc-900 rounded-lg p-6">
                <pre className="text-zinc-300 text-sm overflow-x-auto">
                  {`import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

function TrainlyAuth({ chatId, onConnected }) {
  const { user, getToken } = useUser();
  const [trainlyToken, setTrainlyToken] = useState(null);
  const [connected, setConnected] = useState(false);

  // Check for existing token
  useEffect(() => {
    const stored = localStorage.getItem(\`trainly_token_\${chatId}\`);
    if (stored) {
      const tokenData = JSON.parse(stored);
      if (tokenData.expires_at > Date.now()) {
        setTrainlyToken(tokenData.access_token);
        setConnected(true);
      }
    }
  }, [chatId]);

  // Simple token exchange
  const connect = async () => {
    const clerkToken = await getToken();

    const response = await fetch('/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
        subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
        subject_token: clerkToken,
        client_id: \`trainly_app_\${chatId}\`,
        scope: "chat.query chat.upload"
      })
    });

    const tokenData = await response.json();

    // Store on user's device
    localStorage.setItem(\`trainly_token_\${chatId}\`, JSON.stringify({
      access_token: tokenData.access_token,
      expires_at: Date.now() + (tokenData.expires_in * 1000)
    }));

    setTrainlyToken(tokenData.access_token);
    setConnected(true);
    onConnected?.(tokenData.access_token);
  };

  // Query user's private data
  const query = async (question) => {
    const response = await fetch('/me/chats/query', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${trainlyToken}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question: question,
        include_citations: false // Privacy protection
      })
    });

    return response.json();
  };

  return (
    <div>
      {connected ? (
        <div>
          <p>✅ Connected to Trainly AI</p>
          <button onClick={() => query('What did I upload?')}>
            Ask AI about your documents
          </button>
        </div>
      ) : (
        <button onClick={connect}>
          Connect with Trainly AI ✨
        </button>
      )}
    </div>
  );
}`}
                </pre>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() =>
                  copyToClipboard(
                    `// React Trainly Integration`,
                    "React Component",
                  )
                }
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Component
              </Button>
            </CardContent>
          </Card>
        </div>
      ),
    },
  };

  const currentSection =
    sectionContent[selectedSection as keyof typeof sectionContent];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 overflow-y-auto h-screen sticky top-0">
          {/* Header */}
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-800 dark:bg-zinc-700 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Trainly API
                </h1>
                <p className="text-sm text-zinc-500">
                  Privacy-First Documentation
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-6">
            {navigation.map((section) => (
              <div key={section.title}>
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
                  <section.icon className="w-4 h-4" />
                  {section.title}
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedSection(item.id)}
                      className={cn(
                        "w-full text-left flex items-center justify-between p-3 rounded-lg transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        selectedSection === item.id
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700"
                          : "text-zinc-700 dark:text-zinc-300",
                      )}
                    >
                      <span className="font-medium">{item.title}</span>
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <Badge
                            variant="outline"
                            className="text-xs border-zinc-300 text-zinc-600 dark:border-zinc-600 dark:text-zinc-400"
                          >
                            {item.badge}
                          </Badge>
                        )}
                        {selectedSection === item.id && (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 mt-8">
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                asChild
              >
                <a href="/dashboard" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Dashboard
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                asChild
              >
                <a
                  href="https://github.com/trainly/examples"
                  target="_blank"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Examples
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Top Bar */}
          <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40">
            <div className="flex items-center justify-between p-6">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {currentSection?.title || "Documentation"}
                </h2>
                <p className="text-sm text-zinc-500">
                  Privacy-first API with user-controlled authentication
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-zinc-400 rounded-full"></div>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    API Operational
                  </span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://status.trainly.com" target="_blank">
                    Status
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8 max-w-4xl">
            {currentSection?.content || (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                  Documentation Section
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Select a section from the sidebar to view documentation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
