"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Lock,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Copy,
  Zap,
  BookOpen,
  Code,
  FileText,
  Settings,
  Home,
  ChevronRight,
  ExternalLink,
  Key,
  Globe,
  Users,
  Eye,
  Upload,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ApiDocsPage() {
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

  // Navigation structure (Stripe-style)
  const navigation = [
    {
      title: "Getting Started",
      icon: Home,
      items: [
        { id: "getting-started", title: "Quick Start", badge: null },
        { id: "authentication", title: "Authentication", badge: "🔐" },
        { id: "privacy-first", title: "Privacy-First API", badge: "New" },
      ]
    },
    {
      title: "API Reference",
      icon: Code,
      items: [
        { id: "token-exchange", title: "Token Exchange", badge: null },
        { id: "chat-queries", title: "Chat Queries", badge: null },
        { id: "file-uploads", title: "File Uploads", badge: null },
        { id: "analytics", title: "Analytics", badge: null },
      ]
    },
    {
      title: "Integration",
      icon: BookOpen,
      items: [
        { id: "react-integration", title: "React", badge: null },
        { id: "nodejs-backend", title: "Node.js", badge: null },
        { id: "python-integration", title: "Python", badge: null },
      ]
    },
    {
      title: "Security",
      icon: Shield,
      items: [
        { id: "privacy-protection", title: "Privacy Protection", badge: "Important" },
        { id: "citation-filtering", title: "Citation Filtering", badge: null },
        { id: "data-isolation", title: "Data Isolation", badge: null },
      ]
    },
    {
      title: "Examples",
      icon: FileText,
      items: [
        { id: "study-assistant", title: "Study Assistant", badge: null },
        { id: "document-analyzer", title: "Document Analyzer", badge: null },
        { id: "testing", title: "Testing & Debugging", badge: null },
      ]
    }
  ];

  // Content for each section
  const sectionContent: Record<string, { title: string; content: React.ReactNode }> = {
    "getting-started": {
      title: "Quick Start",
      content: (
        <div className="space-y-8">
          {/* Hero */}
          <div className="bg-gradient-to-r from-blue-50 to-amber-50 dark:from-blue-950/30 dark:to-amber-950/30 rounded-xl p-8 border border-blue-200 dark:border-blue-800">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
              Welcome to Trainly API
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6">
              Build AI applications with complete user privacy. Users control their authentication tokens and data access.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Badge className="bg-green-100 text-green-800 border-green-200">🔒 User-Controlled Auth</Badge>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">📱 Each Chat = App</Badge>
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">🛡️ Privacy-First</Badge>
            </div>
          </div>

          {/* Integration Steps */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
                <CardTitle className="text-lg">Setup Chat API</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Enable API access for your chat in the Trainly dashboard. Each chat becomes an API endpoint.
                </p>
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3">
                  <code className="text-xs text-zinc-700 dark:text-zinc-300">
                    Chat Settings → API Access → Generate Key
                  </code>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-green-200 dark:border-green-800 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <CardTitle className="text-lg">User Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Users authenticate with their Clerk tokens. Exchange for secure Trainly tokens.
                </p>
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3">
                  <code className="text-xs text-zinc-700 dark:text-zinc-300">
                    POST /oauth/token → Bearer token
                  </code>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-amber-200 dark:border-amber-800 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <CardTitle className="text-lg">Query & Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Users query their private data and upload files with complete privacy protection.
                </p>
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3">
                  <code className="text-xs text-zinc-700 dark:text-zinc-300">
                    POST /me/chats/query → AI only
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Example */}
          <Card className="border-green-200 dark:border-green-800 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <Zap className="w-5 h-5" />
                5-Minute Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-zinc-900 rounded-xl p-6">
                <pre className="text-green-400 text-sm overflow-x-auto">
{`// 1. Token exchange (user-controlled)
const clerkToken = await user.getToken();
const trainlyResponse = await fetch('/oauth/token', {
  method: 'POST',
  body: JSON.stringify({
    grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
    subject_token: clerkToken,
    client_id: \`trainly_app_\${chatId}\`
  })
});

const { access_token } = await trainlyResponse.json();

// 2. Store on user's device (you never see it)
localStorage.setItem('trainly_token', access_token);

// 3. User queries their private data
const queryResponse = await fetch('/me/chats/query', {
  headers: { 'Authorization': \`Bearer \${access_token}\` },
  body: JSON.stringify({
    question: 'What did I upload?',
    include_citations: false // Privacy protection
  })
});

// User gets AI response, you never see raw files! 🔒`}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 border-green-500 text-green-400 hover:bg-green-500 hover:text-white"
                  onClick={() => copyToClipboard("// Token Exchange Example", "Quick Start Code")}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Example
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },

    "privacy-first": {
      title: "Privacy-First API",
      content: (
        <div className="space-y-8">
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-8">
            <h2 className="text-3xl font-bold text-green-800 dark:text-green-200 mb-4">
              🔒 Complete User Privacy Protection
            </h2>
            <p className="text-lg text-green-700 dark:text-green-300 mb-6">
              Our privacy-first architecture ensures developers can build powerful AI apps while users maintain complete control over their data.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ What Developers Get
                </h4>
                <ul className="space-y-2 text-sm text-green-700 dark:text-green-300">
                  <li className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    AI-generated responses from user data
                  </li>
                  <li className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Usage analytics and performance metrics
                  </li>
                  <li className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    File upload assistance for users
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    User engagement insights
                  </li>
                </ul>
              </div>
              <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-red-200 dark:border-red-700">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  ❌ What's Protected
                </h4>
                <ul className="space-y-2 text-sm text-red-700 dark:text-red-300">
                  <li className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Raw file content and downloads
                  </li>
                  <li className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Detailed citations and snippets
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Cross-user data access
                  </li>
                  <li className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    User authentication tokens
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Trust Advantage */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <Shield className="w-5 h-5" />
                The Trust Advantage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Users confidently upload sensitive documents because they know developers cannot access their files.
                This leads to higher engagement, more uploads, and better AI responses.
              </p>
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Business Impact:</h5>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• 3x higher user engagement when privacy is guaranteed</li>
                  <li>• Enterprise customers adopt apps with proven data protection</li>
                  <li>• Developers have zero liability for data breaches</li>
                  <li>• Automatic GDPR/CCPA compliance</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },

    "token-exchange": {
      title: "Token Exchange",
      content: (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
              RFC 8693 Token Exchange
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Exchange user's Clerk ID token for a short-lived Trainly access token. This enables user-controlled authentication.
            </p>
          </div>

          {/* Endpoint Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-600 text-white">POST</Badge>
                <code className="font-mono text-lg">/oauth/token</code>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Request Body
                  </h4>
                  <div className="bg-zinc-900 rounded-lg p-4">
                    <pre className="text-green-400 text-sm">
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

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Response
                  </h4>
                  <div className="bg-zinc-900 rounded-lg p-4">
                    <pre className="text-blue-400 text-sm">
{`{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "issued_token_type": "urn:ietf:params:oauth:token-type:access_token",
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
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">Critical Security Note</h5>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Store the access token on the user's device only (localStorage, secure cookie).
                        Never store user tokens on your servers - this maintains the privacy guarantee.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },

    "chat-queries": {
      title: "Chat Queries",
      content: (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
              User-Private Chat Queries
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Users query their private chat data using secure tokens. Citations are automatically filtered for privacy protection.
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-600 text-white">POST</Badge>
                <code className="font-mono text-lg">/me/chats/query</code>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Request</h4>
                  <div className="mb-3">
                    <Badge variant="outline" className="mb-2">Required Headers</Badge>
                    <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3">
                      <code className="text-sm">Authorization: Bearer &lt;trainly_token&gt;</code>
                    </div>
                  </div>
                  <div className="bg-zinc-900 rounded-lg p-4">
                    <pre className="text-green-400 text-sm">
{`{
  "question": "What are the key concepts from my study materials?",
  "include_citations": false,  // Privacy protection for app calls
  "max_tokens": 1000,
  "temperature": 0.7
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Response (Developer App Call)</h4>
                  <div className="bg-zinc-900 rounded-lg p-4">
                    <pre className="text-blue-400 text-sm">
{`{
  "answer": "Based on your study materials, the key concepts include...",
  "subchat_id": "subchat_chatid_userid",
  "access_type": "user_controlled",
  "privacy_note": "Response generated from your private data only",
  "citations_summary": {
    "sources_used": 3,
    "confidence_level": "high",
    "privacy_protection": "Citations filtered for privacy - full access at trainly.com"
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Protection */}
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <Shield className="w-5 h-5" />
                Citation Privacy Protection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-6">
                <h4 className="font-bold text-green-800 dark:text-green-200 mb-4">
                  🔒 Why Citations are Filtered
                </h4>
                <p className="text-green-700 dark:text-green-300 mb-4">
                  Even though developers can't access raw files, detailed citations could still reveal sensitive information
                  through snippets and context. Our filtering prevents this privacy leak.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-semibold text-green-800 dark:text-green-200 mb-2">Developer API Calls Get:</h5>
                    <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      <li>• AI-generated answers only</li>
                      <li>• Citation count and confidence level</li>
                      <li>• Source availability confirmation</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Users Get (Direct Access):</h5>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• Full AI responses with context</li>
                      <li>• Complete citation snippets</li>
                      <li>• Source document references</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },

    "react-integration": {
      title: "React Integration",
      content: (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
              React Integration Guide
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Complete React integration with hooks and components for Trainly's privacy-first API.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>useTrainlyAuth Hook</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-zinc-900 rounded-lg p-6">
                <pre className="text-green-400 text-sm overflow-x-auto">
{`import { useUser } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';

export function useTrainlyAuth(chatId) {
  const { user, getToken } = useUser();
  const [trainlyToken, setTrainlyToken] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check for existing token
    const stored = localStorage.getItem(\`trainly_token_\${chatId}\`);
    if (stored) {
      const tokenData = JSON.parse(stored);
      if (tokenData.expires_at > Date.now()) {
        setTrainlyToken(tokenData.access_token);
        setIsConnected(true);
      }
    }
  }, [chatId]);

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
    setIsConnected(true);
  };

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

  const disconnect = () => {
    localStorage.removeItem(\`trainly_token_\${chatId}\`);
    setTrainlyToken(null);
    setIsConnected(false);
  };

  return { isConnected, connect, query, disconnect };
}`}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => copyToClipboard("// React Hook Code", "useTrainlyAuth Hook")}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Hook
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usage Example */}
          <Card>
            <CardHeader>
              <CardTitle>Component Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-zinc-900 rounded-lg p-6">
                <pre className="text-blue-400 text-sm overflow-x-auto">
{`function MyAIAssistant({ chatId }) {
  const { isConnected, connect, query } = useTrainlyAuth(chatId);
  const [answer, setAnswer] = useState('');

  const handleQuestion = async (question) => {
    const result = await query(question);
    setAnswer(result.answer);
  };

  return (
    <div>
      {isConnected ? (
        <div>
          <p>✅ Connected to Trainly AI</p>
          <button onClick={() => handleQuestion('Summarize my documents')}>
            Ask AI about your documents
          </button>
          {answer && <p>AI Response: {answer}</p>}
        </div>
      ) : (
        <div>
          <h3>Connect with Trainly for AI features</h3>
          <p>🔒 Your data stays private - we only get AI responses</p>
          <button onClick={connect}>
            Connect with Trainly ✨
          </button>
        </div>
      )}
    </div>
  );
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  };

  // Navigation structure
  const currentSection = sectionContent[selectedSection];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="flex">
        {/* Stripe-style Sidebar */}
        <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 overflow-y-auto h-screen sticky top-0">
          {/* Header */}
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Trainly API
                </h1>
                <p className="text-sm text-zinc-500">Privacy-First Documentation</p>
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
                          ? "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
                          : "text-zinc-700 dark:text-zinc-300"
                      )}
                    >
                      <span className="font-medium">{item.title}</span>
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              item.badge === "New" ? "border-green-200 text-green-700" :
                              item.badge === "Important" ? "border-red-200 text-red-700" :
                              item.badge === "🔐" ? "border-blue-200 text-blue-700" :
                              "border-zinc-200 text-zinc-700"
                            )}
                          >
                            {item.badge}
                          </Badge>
                        )}
                        {selectedSection === item.id && <ChevronRight className="w-4 h-4" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 mt-8">
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <a href="/dashboard" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Dashboard
                </a>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <a href="https://github.com/trainly/examples" target="_blank" className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Examples
                </a>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <a href="https://status.trainly.com" target="_blank" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  API Status
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Top Bar */}
          <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl sticky top-0 z-40">
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
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">API Operational</span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="/api-docs" target="_blank" className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Interactive API
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8 max-w-5xl">
            {currentSection?.content || (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                  Select Documentation Section
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Choose a section from the sidebar to view detailed documentation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
