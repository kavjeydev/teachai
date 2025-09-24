"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Users,
  Eye,
  EyeOff,
  Copy,
  Check,
  Lock,
  AlertTriangle,
  FileText,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

/**
 * 🔒 Privacy-First Developer Dashboard
 *
 * This dashboard shows developers how the privacy-first architecture works:
 * - Each user gets their own isolated sub-chat
 * - Developers can only access AI responses, never raw files
 * - Complete audit trail of all access attempts
 * - Capability-based permissions system
 */

interface App {
  _id: string;
  appId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: number;
  settings: {
    allowDirectUploads: boolean;
    maxUsersPerApp?: number;
    allowedCapabilities: string[];
  };
}

interface AppStats {
  totalUsers: number;
  activeUsers: number;
  totalApiCalls: number;
  successfulCalls: number;
  blockedCalls: number;
  topActions: Record<string, number>;
}

export default function DeveloperDashboard() {
  const { user } = useUser();
  const [apps, setApps] = useState<App[]>([]);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [appStats, setAppStats] = useState<AppStats | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [newAppSecret, setNewAppSecret] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      loadDeveloperApps();
    }
  }, [user]);

  const loadDeveloperApps = async () => {
    try {
      // This would call the Convex function to get developer apps
      // For now, we'll show a mock implementation
      setApps([
        {
          _id: "app1",
          appId: "app_demo_123",
          name: "My Privacy-First App",
          description: "A demo app showing privacy-first data handling",
          isActive: true,
          createdAt: Date.now() - 86400000,
          settings: {
            allowDirectUploads: true,
            maxUsersPerApp: 1000,
            allowedCapabilities: ["ask", "upload"],
          },
        },
      ]);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load apps:", error);
      setLoading(false);
    }
  };

  const createNewApp = async (name: string, description: string) => {
    try {
      // This would call the Convex createApp mutation
      const mockApp = {
        _id: `app_${Date.now()}`,
        appId: `app_${Date.now().toString(36)}`,
        name,
        description,
        isActive: true,
        createdAt: Date.now(),
        settings: {
          allowDirectUploads: true,
          maxUsersPerApp: 1000,
          allowedCapabilities: ["ask", "upload"],
        },
      };

      setApps([...apps, mockApp]);
      setNewAppSecret(
        `as_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 16)}`,
      );
      toast.success("App created successfully!");
    } catch (error) {
      toast.error("Failed to create app");
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Privacy-First Developer Dashboard
          </h1>
          <p className="text-zinc-600 mt-2">
            Build apps with complete user data isolation - you can't see user
            files or raw data
          </p>
        </div>
        <Button
          onClick={() => {
            const name = prompt("App name:");
            const description = prompt("App description:");
            if (name) createNewApp(name, description || "");
          }}
        >
          Create New App
        </Button>
      </div>

      {/* Privacy Guarantee Banner */}
      <Alert className="border-green-200 bg-green-50">
        <Shield className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Privacy Guarantee:</strong> With Trainly's privacy-first
          architecture, you can only access AI-generated responses from your
          users' data. You cannot list, download, or view their raw files. Each
          user's data is completely isolated in their own private sub-chat.
        </AlertDescription>
      </Alert>

      {/* Apps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app) => (
          <Card
            key={app._id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedApp(app)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{app.name}</CardTitle>
                <Badge variant={app.isActive ? "default" : "secondary"}>
                  {app.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              {app.description && (
                <p className="text-sm text-zinc-600">{app.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">App ID:</span>
                  <code className="text-xs bg-zinc-100 px-2 py-1 rounded">
                    {app.appId}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">
                    Max Users: {app.settings.maxUsersPerApp}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {app.settings.allowedCapabilities.map((cap) => (
                    <Badge key={cap} variant="outline" className="text-xs">
                      {cap}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* App Details Modal/Section */}
      {selectedApp && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {selectedApp.name} - Privacy-First Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="api">API Integration</TabsTrigger>
                <TabsTrigger value="privacy">Privacy Model</TabsTrigger>
                <TabsTrigger value="audit">Audit Logs</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Total Users</span>
                      </div>
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-sm text-zinc-600">
                        Each gets their own private chat
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-green-500" />
                        <span className="font-medium">API Calls</span>
                      </div>
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-sm text-zinc-600">
                        Only AI responses, no raw data
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-amber-500" />
                        <span className="font-medium">Blocked Attempts</span>
                      </div>
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-sm text-zinc-600">
                        Privacy violations prevented
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="api" className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Your app secret is shown only once. Store it securely.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      App Secret
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-zinc-100 p-2 rounded text-sm">
                        {showSecret
                          ? newAppSecret || "as_****_****"
                          : "as_****_****"}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSecret(!showSecret)}
                      >
                        {showSecret ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(newAppSecret || "as_demo_secret")
                        }
                      >
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Example Integration
                    </label>
                    <pre className="bg-zinc-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                      {`// 1. Provision a user (creates their private sub-chat)
const response = await fetch('/v1/privacy/apps/users/provision', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_app_secret',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    end_user_id: 'user_123',
    capabilities: ['ask', 'upload']
  })
});

const { scoped_token } = await response.json();

// 2. Query user's private data (you only get AI responses)
const queryResponse = await fetch('/v1/privacy/query', {
  method: 'POST',
  headers: {
    'x-scoped-token': scoped_token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    end_user_id: 'user_123',
    question: 'What files did I upload?'
  })
});

// You get AI response, never raw files!`}
                    </pre>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="privacy" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-green-200">
                    <CardHeader>
                      <CardTitle className="text-green-800 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        What You CAN Do
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Ask questions about user's data</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Get AI-generated responses</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Enable direct user uploads</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>View usage statistics</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>See audit logs (no content)</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-red-200">
                    <CardHeader>
                      <CardTitle className="text-red-800 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        What You CANNOT Do
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <EyeOff className="h-4 w-4 text-red-500" />
                          <span>List user's files</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <EyeOff className="h-4 w-4 text-red-500" />
                          <span>Download raw file content</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <EyeOff className="h-4 w-4 text-red-500" />
                          <span>Access other users' data</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <EyeOff className="h-4 w-4 text-red-500" />
                          <span>See raw user questions/content</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <EyeOff className="h-4 w-4 text-red-500" />
                          <span>Bypass privacy restrictions</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Data Flow:</strong> User uploads → Private sub-chat
                    → AI processing → You receive only AI responses. The raw
                    files never leave the user's private namespace.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="audit" className="space-y-4">
                <div className="text-center py-8 text-zinc-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No audit logs yet</p>
                  <p className="text-sm">
                    Logs will appear here when users interact with your app
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Privacy Architecture Explanation */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>
            🔒 How Privacy-First Architecture Protects User Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Per-User Sub-Chats</h3>
              <p className="text-sm text-zinc-600">
                Each end-user gets their own isolated chat under your app. No
                cross-user data access possible.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Capability Scoping</h3>
              <p className="text-sm text-zinc-600">
                Your tokens are limited to specific actions (ask, upload). No
                raw file access capabilities are ever granted.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="font-semibold mb-2">Comprehensive Auditing</h3>
              <p className="text-sm text-zinc-600">
                Every access attempt is logged. Users can see when and how their
                data was accessed by your app.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
