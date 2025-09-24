"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Key,
  Shield,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Users,
  User,
  BookOpen,
  Lock,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface ApiKeysComparisonProps {
  chatId: Id<"chats">;
  chatTitle: string;
}

export function ApiKeysComparison({
  chatId,
  chatTitle,
}: ApiKeysComparisonProps) {
  const [showChatApiKey, setShowChatApiKey] = useState(false);
  const [showAppSecret, setShowAppSecret] = useState(false);
  const [isGeneratingChatKey, setIsGeneratingChatKey] = useState(false);
  const [isCreatingApp, setIsCreatingApp] = useState(false);
  const [showCreateAppForm, setShowCreateAppForm] = useState(false);

  // App creation form
  const [appName, setAppName] = useState("");
  const [appDescription, setAppDescription] = useState("");

  // Convex hooks
  const chatApiStatus = useQuery(api.simple_api.getApiKeyStatus, { chatId });
  const userApps = useQuery(api.app_management.getAppsForChat, { chatId });
  const generateChatApiKey = useMutation(api.simple_api.generateApiKey);
  const createApp = useMutation(api.app_management.createApp);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error(`Failed to copy ${label}`);
    }
  };

  const handleGenerateChatApiKey = async () => {
    setIsGeneratingChatKey(true);
    try {
      await generateChatApiKey({ chatId });
      toast.success("Chat API key generated successfully!");
      setShowChatApiKey(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to generate API key");
    } finally {
      setIsGeneratingChatKey(false);
    }
  };

  const handleCreateApp = async () => {
    if (!appName.trim()) {
      toast.error("App name is required");
      return;
    }

    setIsCreatingApp(true);
    try {
      const result = await createApp({
        name: appName.trim(),
        description: appDescription.trim() || undefined,
        parentChatId: chatId, // Link to source chat for settings inheritance
        websiteUrl: "http://localhost:3000",
      });

      toast.success("App created successfully! Save your app secret securely.");
      setShowCreateAppForm(false);
      setAppName("");
      setAppDescription("");

      // Show the new app secret
      setShowAppSecret(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to create app");
    } finally {
      setIsCreatingApp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">
          API Access Management
        </h2>
        <p className="text-zinc-600">
          Choose the right API approach for your application. Each serves
          different use cases.
        </p>
      </div>

      {/* Comparison Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Chat API Key - Direct Access */}
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <User className="w-5 h-5" />
              Chat API Key
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                Single-User / Direct Access
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                What This Does
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>
                  • Direct access to <strong>this specific chat</strong>
                </li>
                <li>• Query the documents in this chat</li>
                <li>• Simple API key authentication</li>
                <li>• Perfect for personal apps or shared team tools</li>
              </ul>
            </div>

            <div>
              <Label>API Key for Chat: {chatTitle}</Label>
              {chatApiStatus?.hasApiKey ? (
                <div className="space-y-3 mt-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={
                        showChatApiKey
                          ? chatApiStatus.apiKey || ""
                          : "tk_" + "•".repeat(32)
                      }
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowChatApiKey(!showChatApiKey)}
                    >
                      {showChatApiKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          chatApiStatus.apiKey || "",
                          "Chat API Key",
                        )
                      }
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="text-xs text-zinc-600">
                    <strong>Chat ID:</strong> {chatId}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-auto p-1"
                      onClick={() => copyToClipboard(chatId, "Chat ID")}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  <Button
                    onClick={handleGenerateChatApiKey}
                    disabled={isGeneratingChatKey}
                    className="w-full"
                  >
                    {isGeneratingChatKey
                      ? "Generating..."
                      : "Generate Chat API Key"}
                  </Button>
                </div>
              )}
            </div>

            {/* Usage Example */}
            <div>
              <Label className="text-sm font-medium">Usage Example</Label>
              <div className="bg-zinc-900 rounded-lg p-3 mt-1">
                <pre className="text-zinc-300 text-xs overflow-x-auto">
                  {`fetch('http://localhost:8000/v1/${chatId}/answer_question', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${chatApiStatus?.apiKey || "tk_your_api_key"}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    question: 'What is in this chat?'
  })
})`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Secret - Multi-User OAuth */}
        <Card className="border-2 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Users className="w-5 h-5" />
              App Secret
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                Multi-User / OAuth Apps
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                What This Does
              </h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>
                  • Provision <strong>multiple users</strong> with private
                  workspaces
                </li>
                <li>
                  • Each user gets hybrid access: shared knowledge + private
                  docs
                </li>
                <li>• Complete privacy protection between users</li>
                <li>
                  • Perfect for SaaS apps, education platforms, business tools
                </li>
              </ul>
            </div>

            <div>
              <Label>Your Apps</Label>
              {userApps && userApps.length > 0 ? (
                <div className="space-y-3 mt-2">
                  {userApps.map((app) => (
                    <div key={app._id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{app.name}</h4>
                        <Badge variant="outline">
                          {app.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-600 mb-2">
                        {app.description}
                      </p>

                      <div className="flex items-center gap-2">
                        <Input
                          value={
                            showAppSecret
                              ? `as_${app.appId}_secret_here`
                              : "as_" + "•".repeat(32)
                          }
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAppSecret(!showAppSecret)}
                        >
                          {showAppSecret ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              `as_${app.appId}_secret`,
                              "App Secret",
                            )
                          }
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="text-xs text-zinc-600 mt-1">
                        <strong>App ID:</strong> {app.appId}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-2">
                  {!showCreateAppForm ? (
                    <Button
                      onClick={() => setShowCreateAppForm(true)}
                      className="w-full"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create App for Multi-User OAuth
                    </Button>
                  ) : (
                    <div className="space-y-3 p-4 border rounded-lg">
                      <div>
                        <Label>App Name</Label>
                        <Input
                          value={appName}
                          onChange={(e) => setAppName(e.target.value)}
                          placeholder="My Document Assistant"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={appDescription}
                          onChange={(e) => setAppDescription(e.target.value)}
                          placeholder="AI-powered document analysis with shared knowledge"
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCreateApp}
                          disabled={isCreatingApp}
                          className="flex-1"
                        >
                          {isCreatingApp ? "Creating..." : "Create App"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowCreateAppForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Usage Example */}
            <div>
              <Label className="text-sm font-medium">Usage Example</Label>
              <div className="bg-zinc-900 rounded-lg p-3 mt-1">
                <pre className="text-zinc-300 text-xs overflow-x-auto">
                  {`// 1. Provision user (creates private workspace)
fetch('http://localhost:8000/v1/privacy/apps/users/provision', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${userApps?.[0]?.appId ? `as_${userApps[0].appId}_secret` : "as_your_app_secret"}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    end_user_id: 'user_123',
    capabilities: ['ask', 'upload']
  })
})

// 2. User queries with scoped token
fetch('http://localhost:8000/v1/privacy/query', {
  method: 'POST',
  headers: {
    'x-scoped-token': 'user_scoped_token'
  },
  body: JSON.stringify({
    end_user_id: 'user_123',
    question: 'What did I upload?'
  })
})`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Key Differences Explained
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Feature</th>
                  <th className="text-left p-3 font-semibold text-blue-800">
                    <User className="w-4 h-4 inline mr-1" />
                    Chat API Key
                  </th>
                  <th className="text-left p-3 font-semibold text-green-800">
                    <Users className="w-4 h-4 inline mr-1" />
                    App Secret
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3 font-medium">Use Case</td>
                  <td className="p-3 text-blue-700">
                    Single-user or shared team tool
                  </td>
                  <td className="p-3 text-green-700">
                    Multi-user SaaS application
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">Data Access</td>
                  <td className="p-3 text-blue-700">
                    One specific chat's documents
                  </td>
                  <td className="p-3 text-green-700">
                    Shared knowledge + user private docs
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">User Privacy</td>
                  <td className="p-3 text-blue-700">
                    All users share same chat
                  </td>
                  <td className="p-3 text-green-700">
                    Complete isolation between users
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">Authentication</td>
                  <td className="p-3 text-blue-700">Simple API key</td>
                  <td className="p-3 text-green-700">
                    OAuth with user-controlled tokens
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">Scaling</td>
                  <td className="p-3 text-blue-700">Limited to one chat</td>
                  <td className="p-3 text-green-700">
                    Unlimited users, each with private workspace
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Setup Complexity</td>
                  <td className="p-3 text-blue-700">Simple - just API key</td>
                  <td className="p-3 text-green-700">
                    Advanced - OAuth flow required
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Security Warnings */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Chat API Key Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Simple to implement and test</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                <span>All users with the key share the same data</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                <span>No user privacy protection</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 text-sm flex items-center gap-2">
              <Lock className="w-4 h-4" />
              App Secret Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Complete user data isolation</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Users control their own tokens</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>GDPR/CCPA compliant by design</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Shared knowledge + private workspaces</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Integration Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-blue-800 mb-3">
                Using Chat API Key
              </h4>
              <div className="bg-zinc-900 rounded-lg p-3">
                <pre className="text-zinc-300 text-xs">
                  {`# Environment
TRAINLY_API_KEY=${chatApiStatus?.apiKey || "tk_your_api_key"}
NEXT_PUBLIC_TRAINLY_CHAT_ID=${chatId}

# Simple integration
const response = await queryChat(
  chatId,
  apiKey,
  question
);`}
                </pre>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-green-800 mb-3">
                Using App Secret
              </h4>
              <div className="bg-zinc-900 rounded-lg p-3">
                <pre className="text-zinc-300 text-xs">
                  {`# Environment
TRAINLY_APP_SECRET=as_your_app_secret_here

# Multi-user integration
const { scoped_token } = await provisionUser(
  appSecret,
  userId,
  ['ask', 'upload']
);`}
                </pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
