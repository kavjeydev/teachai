"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  MessageSquare,
  CheckCircle,
  Copy,
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
  Upload,
  Zap,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
export default function ApiDocsPage() {
  const [selectedSection, setSelectedSection] = useState("getting-started");
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
        { id: "installation", title: "Installation", badge: null },
        { id: "react-setup", title: "React Setup", badge: "Popular" },
      ],
    },
    {
      title: "Integration",
      icon: Code,
      items: [
        { id: "api-reference", title: "API Reference", badge: null },
        { id: "examples", title: "Examples", badge: null },
      ],
    },
    {
      title: "Security",
      icon: Shield,
      items: [
        { id: "privacy-model", title: "Privacy Model", badge: "Important" },
      ],
    },
  ];
  // Content sections
  const sectionContent: Record<
    string,
    { title: string; content: React.ReactNode }
  > = {
    "getting-started": {
      title: "Quick Start",
      content: (
        <div className="space-y-8">
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-8 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-3xl font-semibold text-zinc-900 dark:text-white mb-4">
              Welcome to Trainly API
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6">
              Build AI applications with complete user privacy. Each chat
              becomes a secure API endpoint.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Badge
                variant="outline"
                className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
              >
                🔒 Privacy-First
              </Badge>
              <Badge
                variant="outline"
                className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
              >
                📱 Chat to API
              </Badge>
              <Badge
                variant="outline"
                className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30"
              >
                ⚡ React SDK
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-zinc-200 dark:border-zinc-800">
              <CardHeader className="pb-4">
                <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-900 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-zinc-700 dark:text-zinc-300 font-semibold">
                    1
                  </span>
                </div>
                <CardTitle className="text-lg text-zinc-900 dark:text-white">
                  Install SDK
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Add the Trainly React SDK to your project.
                </p>
                <div className="bg-zinc-900 dark:bg-zinc-950 rounded-md p-3">
                  <code className="text-sm text-zinc-300 font-mono">
                    npm install trainly-react-sdk
                  </code>
                </div>
              </CardContent>
            </Card>
            <Card className="border-zinc-200 dark:border-zinc-800">
              <CardHeader className="pb-4">
                <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-900 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-zinc-700 dark:text-zinc-300 font-semibold">
                    2
                  </span>
                </div>
                <CardTitle className="text-lg text-zinc-900 dark:text-white">
                  Configure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Setup TrainlyProvider in your app.
                </p>
                <div className="bg-zinc-900 dark:bg-zinc-950 rounded-md p-3">
                  <code className="text-sm text-zinc-300 font-mono">
                    &lt;TrainlyProvider&gt;
                  </code>
                </div>
              </CardContent>
            </Card>
            <Card className="border-zinc-200 dark:border-zinc-800">
              <CardHeader className="pb-4">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-950/50 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-amber-700 dark:text-amber-300 font-semibold">
                    3
                  </span>
                </div>
                <CardTitle className="text-lg text-zinc-900 dark:text-white">
                  Build
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Use useTrainly hook to connect and query.
                </p>
                <div className="bg-zinc-900 dark:bg-zinc-950 rounded-md p-3">
                  <code className="text-sm text-zinc-300 font-mono">
                    useTrainly(chatId)
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-900 dark:text-white">
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedSection("installation")}
                  className="w-full justify-start text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                >
                  <Code className="w-4 h-4 mr-3" />
                  View Installation Guide
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedSection("react-setup")}
                  className="w-full justify-start text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                >
                  <FileText className="w-4 h-4 mr-3" />
                  React Integration Guide
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    installation: {
      title: "Installation",
      content: (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-semibold text-zinc-900 dark:text-white mb-4">
              Installation
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Get started with the Trainly React SDK in your project.
            </p>
          </div>
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-900 dark:text-white">
                Install Package
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                    Using npm:
                  </div>
                  <div className="bg-zinc-900 dark:bg-zinc-950 rounded-lg p-4 relative border border-zinc-700">
                    <div className="font-mono text-sm">
                      <span className="text-zinc-500">
                        # Install the Trainly React SDK
                      </span>
                      <br />
                      <span className="text-amber-400">npm install</span>{" "}
                      <span className="text-zinc-300">trainly-react-sdk</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-200"
                      onClick={() =>
                        copyToClipboard(
                          "npm install trainly-react-sdk",
                          "npm command",
                        )
                      }
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                    Using yarn:
                  </div>
                  <div className="bg-zinc-900 dark:bg-zinc-950 rounded-lg p-4 relative border border-zinc-700">
                    <div className="font-mono text-sm">
                      <span className="text-zinc-500">
                        # Alternative: using yarn
                      </span>
                      <br />
                      <span className="text-amber-400">yarn add</span>{" "}
                      <span className="text-zinc-300">trainly-react-sdk</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-200"
                      onClick={() =>
                        copyToClipboard(
                          "yarn add trainly-react-sdk",
                          "yarn command",
                        )
                      }
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-900 dark:text-white">
                Environment Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Add your Trainly configuration to your environment file:
                </p>
                <div className="bg-zinc-900 dark:bg-zinc-950 rounded-lg p-4 relative border border-zinc-700">
                  <div className="font-mono text-sm">
                    <span className="text-zinc-500"># .env.local</span>
                    <br />
                    <span className="text-blue-400">
                      NEXT_PUBLIC_TRAINLY_API_URL
                    </span>
                    <span className="text-zinc-500">=</span>
                    <span className="text-green-400">
                      https://api.trainlyai.com
                    </span>
                    <br />
                    <span className="text-blue-400">TRAINLY_APP_SECRET</span>
                    <span className="text-zinc-500">=</span>
                    <span className="text-green-400">your_app_secret_here</span>
                    <br />
                    <span className="text-blue-400">TRAINLY_JWT_SECRET</span>
                    <span className="text-zinc-500">=</span>
                    <span className="text-green-400">your_jwt_secret_here</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-200"
                    onClick={() =>
                      copyToClipboard(
                        "NEXT_PUBLIC_TRAINLY_API_URL=https://api.trainlyai.com\nTRAINLY_APP_SECRET=your_app_secret_here\nTRAINLY_JWT_SECRET=your_jwt_secret_here",
                        "Environment variables",
                      )
                    }
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-amber-200 dark:bg-amber-900/50 rounded flex items-center justify-center mt-0.5">
                      <Key className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                    </div>
                    <div>
                      <div className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                        Get Your Secrets
                      </div>
                      <div className="text-sm text-amber-700 dark:text-amber-300">
                        Find your app secret and JWT secret in your chat's API
                        settings panel.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    "react-setup": {
      title: "React Setup",
      content: (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-semibold text-zinc-900 dark:text-white mb-4">
              React Integration
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Complete guide to integrating Trainly into your React application.
            </p>
          </div>
          {/* Provider Setup */}
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-900 dark:text-white">
                1. Setup TrainlyProvider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Wrap your application with the TrainlyProvider component:
              </p>
              <div className="bg-zinc-900 dark:bg-zinc-950 rounded-lg p-4 relative border border-zinc-700">
                <pre className="text-sm font-mono overflow-x-auto">
                  <code className="text-zinc-300">
                    {`// app/layout.tsx or _app.tsx
import { TrainlyProvider } from 'trainly-react-sdk';

export default function RootLayout({ children }) {
  return (
    <TrainlyProvider
      apiUrl={process.env.NEXT_PUBLIC_TRAINLY_API_URL}
      appSecret={process.env.TRAINLY_APP_SECRET}
    >
      {children}
    </TrainlyProvider>
  );
}`}
                  </code>
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-200"
                  onClick={() =>
                    copyToClipboard(
                      "import { TrainlyProvider } from 'trainly-react-sdk';\n\nexport default function RootLayout({ children }) {\n  return (\n    <TrainlyProvider\n      apiUrl={process.env.NEXT_PUBLIC_TRAINLY_API_URL}\n      appSecret={process.env.TRAINLY_APP_SECRET}\n    >\n      {children}\n    </TrainlyProvider>\n  );\n}",
                      "Provider setup",
                    )
                  }
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          {/* Hook Usage */}
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-900 dark:text-white">
                2. Use the Hook
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Create a component that uses the Trainly hook:
              </p>
              <div className="bg-zinc-900 dark:bg-zinc-950 rounded-lg p-4 relative border border-zinc-700">
                <pre className="text-sm font-mono overflow-x-auto">
                  <code className="text-zinc-300">
                    {`import { useTrainly } from 'trainly-react-sdk';
import { useState } from 'react';

export function ChatComponent({ chatId }) {
  const { connect, query, isConnected } = useTrainly(chatId);
  const [input, setInput] = useState('');
  const [response, setResponse] = useState(null);

  const handleSubmit = async () => {
    try {
      const result = await query(input);
      setResponse(result);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {!isConnected ? (
        <button onClick={connect}
          className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg">
          Connect to Trainly
        </button>
      ) : (
        <div className="space-y-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full p-3 border rounded-lg"
          />
          <button onClick={handleSubmit}
            className="bg-amber-600 text-white px-6 py-3 rounded-lg">
            Ask AI
          </button>
          {response && (
            <div className="mt-4 p-4 bg-zinc-50 rounded-lg">
              {response.answer}
                </div>
          )}
              </div>
      )}
    </div>
  );
}`}
                  </code>
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-200"
                  onClick={() =>
                    copyToClipboard(
                      'import { useTrainly } from \'trainly-react-sdk\';\nimport { useState } from \'react\';\n\nexport function ChatComponent({ chatId }) {\n  const { connect, query, isConnected } = useTrainly(chatId);\n  const [input, setInput] = useState(\'\');\n  const [response, setResponse] = useState(null);\n\n  const handleSubmit = async () => {\n    try {\n      const result = await query(input);\n      setResponse(result);\n    } catch (error) {\n      console.error(error);\n    }\n  };\n\n  return (\n    <div className="max-w-2xl mx-auto p-6">\n      {!isConnected ? (\n        <button onClick={connect}\n          className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg">\n          Connect to Trainly\n        </button>\n      ) : (\n        <div className="space-y-4">\n          <input value={input} onChange={(e) => setInput(e.target.value)} />\n          <button onClick={handleSubmit}\n            className="bg-amber-600 text-white px-6 py-3 rounded-lg">\n            Ask AI\n          </button>\n          {response && (\n            <div className="mt-4 p-4 bg-zinc-50 rounded-lg">\n              {response.answer}\n            </div>\n          )}\n        </div>\n      )}\n    </div>\n  );\n}',
                      "Complete component",
                    )
                  }
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          {/* API Methods */}
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-900 dark:text-white">
                Available Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 bg-amber-100 dark:bg-amber-950/50 rounded flex items-center justify-center">
                      <Key className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="font-medium text-zinc-900 dark:text-white">
                      connect()
                    </div>
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Establishes secure connection to Trainly API
                  </div>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 bg-amber-100 dark:bg-amber-950/50 rounded flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="font-medium text-zinc-900 dark:text-white">
                      query(question)
                    </div>
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Sends question to AI and returns response
                  </div>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-800 rounded flex items-center justify-center">
                      <Upload className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <div className="font-medium text-zinc-900 dark:text-white">
                      uploadFile(file)
                    </div>
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Uploads file to user's private workspace
                  </div>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-800 rounded flex items-center justify-center">
                      <Shield className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <div className="font-medium text-zinc-900 dark:text-white">
                      disconnect()
                    </div>
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Securely disconnects and cleans up tokens
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    "privacy-model": {
      title: "Privacy Model",
      content: (
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-semibold text-zinc-900 dark:text-white mb-4">
              Privacy-First Architecture
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Trainly is built with user privacy as the core principle. Here's
              how we protect your users' data.
            </p>
          </div>
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-900 dark:text-white">
                User-Controlled Authentication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-zinc-900 dark:text-white mb-3">
                    ✅ What You Can Access
                  </h4>
                  <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                    <li>• User activity statistics</li>
                    <li>• File count and storage usage</li>
                    <li>• API performance metrics</li>
                    <li>• Anonymous usage patterns</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-zinc-900 dark:text-white mb-3">
                    ❌ What You Cannot Access
                  </h4>
                  <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                    <li>• Raw file content</li>
                    <li>• User questions or messages</li>
                    <li>• Personal information</li>
                    <li>• Cross-user data</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-900 dark:text-white">
                Data Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded flex items-center justify-center">
                    <Users className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-white">
                      User
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      Controls data
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-400" />
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-950/50 rounded flex items-center justify-center">
                    <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-white">
                      Trainly
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      Processes securely
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-400" />
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded flex items-center justify-center">
                    <Globe className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-white">
                      Your App
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      Gets AI response
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
  };
  const currentSection = sectionContent[selectedSection];
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 overflow-y-auto h-screen sticky top-0">
          {/* Header */}
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-900 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
                  Trainly API
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Documentation
                </p>
              </div>
            </div>
          </div>
          {/* Navigation */}
          <nav className="p-4 space-y-6">
            {navigation.map((section) => (
              <div key={section.title}>
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
                  <section.icon className="w-4 h-4" />
                  {section.title}
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedSection(item.id)}
                      className={cn(
                        "w-full text-left flex items-center justify-between p-3 rounded-lg transition-all",
                        selectedSection === item.id
                          ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white"
                          : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                      )}
                    >
                      <span className="font-medium">{item.title}</span>
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              item.badge === "Popular" ||
                                item.badge === "Important"
                                ? "border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30"
                                : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400",
                            )}
                          >
                            {item.badge}
                          </Badge>
                        )}
                        {selectedSection === item.id && (
                          <ChevronRight className="w-4 h-4 text-zinc-400" />
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
                variant="ghost"
                size="sm"
                className="w-full justify-start text-zinc-600 dark:text-zinc-400"
                asChild
              >
                <a href="/dashboard" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Back to Dashboard
                </a>
              </Button>
            </div>
          </div>
        </div>
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            {currentSection ? (
              <div>
                <div className="mb-8">
                  <h1 className="text-4xl font-semibold text-zinc-900 dark:text-white mb-2">
                    {currentSection.title}
                  </h1>
                </div>
                <div className="prose prose-zinc dark:prose-invert max-w-none">
                  {currentSection.content}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                  Select Documentation Section
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Choose a section from the sidebar to view detailed
                  documentation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
