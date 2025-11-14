"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { captureEvent } from "@/lib/posthog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Key,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Globe,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  BookOpen,
  Power,
  PowerOff,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SimpleApiManagerProps {
  chatId: Id<"chats">;
  chatTitle: string;
}

interface AppSecretDisplayProps {
  appId: string;
  onCopy: (text: string, label: string) => void;
}

interface JwtSecretDisplayProps {
  appId: string;
  onCopy: (text: string, label: string) => void;
}

function AppSecretDisplay({ appId, onCopy }: AppSecretDisplayProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const appSecretQuery = useQuery(
    api.app_management.getAppSecret,
    showSecret ? { appId } : "skip",
  );

  const regenerateAppSecret = useMutation(
    api.app_management.regenerateAppSecret,
  );

  const toggleSecret = () => setShowSecret(!showSecret);

  const handleRotateSecret = async () => {
    if (
      !confirm(
        "Are you sure you want to rotate this app secret? This will invalidate the current secret and break any existing integrations using it.",
      )
    ) {
      return;
    }

    setIsRotating(true);
    try {
      const result = await regenerateAppSecret({ appId });
      toast.success(
        "App secret rotated successfully! The new secret is now displayed.",
      );
      // The query will automatically refetch and show the new secret
    } catch (error: any) {
      toast.error(error.message || "Failed to rotate app secret");
    } finally {
      setIsRotating(false);
    }
  };

  const secretValue =
    showSecret && appSecretQuery
      ? appSecretQuery.appSecret
      : "as_" + "•".repeat(32);

  return (
    <div>
      <div className="flex items-center justify-between">
        <Label className="text-xs text-zinc-700 dark:text-zinc-300">
          App Secret
        </Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRotateSecret}
          disabled={isRotating}
          className="h-6 px-2 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
          title="Rotate app secret (generates a new secret)"
        >
          <RefreshCw
            className={`w-3 h-3 mr-1 ${isRotating ? "animate-spin" : ""}`}
          />
          {isRotating ? "Rotating..." : "Rotate"}
        </Button>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <Input
          value={secretValue}
          readOnly
          className="font-mono text-sm bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSecret}
          className="border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          {showSecret ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            showSecret && appSecretQuery
              ? onCopy(appSecretQuery.appSecret, "App Secret")
              : toast.error("Please reveal the secret first")
          }
          className="border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          disabled={!showSecret || !appSecretQuery}
        >
          <Copy className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function JwtSecretDisplay({ appId, onCopy }: JwtSecretDisplayProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [jwtSecret, setJwtSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getJwtSecret = useMutation(api.app_management.getJwtSecret);
  const regenerateJwtSecret = useMutation(
    api.app_management.regenerateJwtSecret,
  );

  const toggleSecret = async () => {
    if (!showSecret && !jwtSecret) {
      // Fetch the JWT secret if we don't have it yet
      setIsLoading(true);
      try {
        const result = await getJwtSecret({ appId });
        setJwtSecret(result.jwtSecret);
      } catch (error) {
        toast.error("Failed to fetch JWT secret");
        return;
      } finally {
        setIsLoading(false);
      }
    }
    setShowSecret(!showSecret);
  };

  const handleRotateSecret = async () => {
    if (
      !confirm(
        "Are you sure you want to rotate this JWT secret? This will invalidate all existing user tokens and require users to re-authenticate.",
      )
    ) {
      return;
    }

    setIsRotating(true);
    try {
      const result = await regenerateJwtSecret({ appId });
      setJwtSecret(result.jwtSecret);
      toast.success(
        "JWT secret rotated successfully! All user tokens are now invalid and users will need to re-authenticate.",
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to rotate JWT secret");
    } finally {
      setIsRotating(false);
    }
  };

  const secretValue =
    showSecret && jwtSecret ? jwtSecret : "jwt_" + "•".repeat(60);

  return (
    <div>
      <div className="flex items-center justify-between">
        <Label className="text-xs text-zinc-700 dark:text-zinc-300">
          JWT Secret
        </Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRotateSecret}
          disabled={isRotating}
          className="h-6 px-2 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
          title="Rotate JWT secret (invalidates all user tokens)"
        >
          <RefreshCw
            className={`w-3 h-3 mr-1 ${isRotating ? "animate-spin" : ""}`}
          />
          {isRotating ? "Rotating..." : "Rotate"}
        </Button>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <Input
          value={secretValue}
          readOnly
          className="font-mono text-sm bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSecret}
          disabled={isLoading}
          className="border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : showSecret ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            showSecret && jwtSecret
              ? onCopy(jwtSecret, "JWT Secret")
              : toast.error("Please reveal the secret first")
          }
          className="border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          disabled={!showSecret || !jwtSecret}
        >
          <Copy className="w-4 h-4" />
        </Button>
      </div>
      <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">
        <p>🔐 Used to sign JWT tokens for end-user authentication</p>
      </div>
    </div>
  );
}

export function SimpleApiManager({ chatId, chatTitle }: SimpleApiManagerProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showAppSecret, setShowAppSecret] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingApp, setIsCreatingApp] = useState(false);
  const [createdAppSecret, setCreatedAppSecret] = useState<string | null>(null);
  const [createdJwtSecret, setCreatedJwtSecret] = useState<string | null>(null);

  // Convex hooks
  const apiKeyStatus = useQuery(api.simple_api.getApiKeyStatus, { chatId });
  const userApps = useQuery(api.app_management.getAppsForChat, { chatId });
  const generateApiKey = useMutation(api.simple_api.generateApiKey);
  const regenerateApiKey = useMutation(api.simple_api.regenerateApiKey);
  const enableApiAccess = useMutation(api.simple_api.enableApiAccess);
  const disableApiAccess = useMutation(api.simple_api.disableApiAccess);
  const createApp = useMutation(api.app_management.createApp);
  const toggleApiAccess = useMutation(api.app_management.toggleApiAccess);

  const handleGenerateKey = async () => {
    setIsGenerating(true);
    try {
      const result = await generateApiKey({ chatId });

      // Track API key generation in PostHog
      captureEvent("api_key_generated", {
        chatId: chatId,
        keyType: "simple_api_key",
      });

      toast.success("API key generated successfully!");
      setShowApiKey(true);
    } catch (error) {
      console.error("Failed to generate API key:", error);
      toast.error("Failed to generate API key");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (
      !confirm(
        "Are you sure? This will invalidate the current API key and break existing integrations.",
      )
    ) {
      return;
    }

    setIsGenerating(true);
    try {
      const result = await regenerateApiKey({ chatId });

      // Track API key regeneration in PostHog
      captureEvent("api_key_regenerated", {
        chatId: chatId,
        keyType: "simple_api_key",
      });

      toast.success("API key regenerated successfully!");
      setShowApiKey(true);
    } catch (error) {
      console.error("Failed to regenerate API key:", error);
      toast.error("Failed to regenerate API key");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleAccess = async () => {
    try {
      if (apiKeyStatus?.isEnabled) {
        await disableApiAccess({ chatId });
        toast.success("API access disabled");
      } else {
        await enableApiAccess({ chatId });
        toast.success("API access enabled");
      }
    } catch (error) {
      console.error("Failed to toggle API access:", error);
      toast.error("Failed to update API access");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleCreateApp = async () => {
    setIsCreatingApp(true);
    try {
      const result = await createApp({
        name: `${chatTitle} App`,
        description: `Multi-user app based on ${chatTitle} with hybrid privacy`,
        parentChatId: chatId, // Link to source chat for settings inheritance
        websiteUrl: "http://localhost:3000",
      });

      // Track app creation in PostHog
      captureEvent("app_created", {
        chatId: chatId,
        appId: result.appId,
        appName: `${chatTitle} App`,
        hasParentChat: true,
      });

      setCreatedAppSecret(result.appSecret);
      setCreatedJwtSecret(result.jwtSecret);
      setShowAppSecret(true);
      toast.success(
        "App created and published! Chat settings auto-published and app is live.",
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to create app");
    } finally {
      setIsCreatingApp(false);
    }
  };

  const handleToggleApiAccess = async (
    appId: string,
    currentlyDisabled: boolean,
  ) => {
    try {
      const result = await toggleApiAccess({
        appId,
        disable: !currentlyDisabled, // Toggle the current state
      });

      toast.success(result.message);
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle API access");
    }
  };

  const getStatusColor = () => {
    if (!apiKeyStatus?.hasApiKey)
      return "text-zinc-500 border-zinc-300 dark:border-zinc-700";
    if (apiKeyStatus.isEnabled)
      return "text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30";
    return "text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50";
  };

  const getStatusIcon = () => {
    if (!apiKeyStatus?.hasApiKey) return <Key className="w-4 h-4" />;
    if (apiKeyStatus.isEnabled) return <CheckCircle className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (!apiKeyStatus?.hasApiKey) return "No API Key";
    if (apiKeyStatus.isEnabled) return "API Enabled";
    return "API Disabled";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-900 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </div>
            API Access
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Enable external API access for <strong>{chatTitle}</strong>
          </p>
        </div>

        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium border",
            getStatusColor(),
          )}
        >
          {getStatusIcon()}
          {getStatusText()}
        </div>
      </div>

      {/* Main API Card */}
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-zinc-900 dark:text-white">
            <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
              <Shield className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
            </div>
            Chat API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Key Section */}
          {apiKeyStatus?.hasApiKey ? (
            <div className="space-y-4">
              <div>
                <Label>API Key</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={
                      showApiKey
                        ? apiKeyStatus.apiKey || ""
                        : "tk_" + "•".repeat(32)
                    }
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(apiKeyStatus.apiKey || "", "API key")
                    }
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* API Status Toggle */}
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div>
                  <div className="font-medium text-zinc-900 dark:text-white">
                    API Access
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    {apiKeyStatus.isEnabled
                      ? "External applications can access this chat"
                      : "API access is currently disabled"}
                  </div>
                </div>
                <Button
                  onClick={handleToggleAccess}
                  variant={apiKeyStatus.isEnabled ? "destructive" : "default"}
                  className={
                    apiKeyStatus.isEnabled
                      ? ""
                      : "bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white"
                  }
                >
                  {apiKeyStatus.isEnabled ? "Disable API" : "Enable API"}
                </Button>
              </div>

              {/* Regenerate Key */}
              <div className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center mt-0.5">
                    <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-white">
                      Regenerate API Key
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      This will invalidate the current key and break existing
                      integrations
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleRegenerateKey}
                  disabled={isGenerating}
                  variant="outline"
                  className="border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {isGenerating ? (
                    <div className="w-4 h-4 border-2 border-zinc-400/30 border-t-zinc-600 rounded-full animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Regenerate
                </Button>
              </div>
            </div>
          ) : (
            /* No API Key Yet */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                No API Key Generated
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6 max-w-md mx-auto">
                Generate an API key to allow external applications to access
                this chat's knowledge base.
              </p>
              <Button
                onClick={handleGenerateKey}
                disabled={isGenerating}
                className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Generate API Key
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Quick Link to Documentation */}
          {apiKeyStatus?.hasApiKey && apiKeyStatus.isEnabled && (
            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-5 h-5 bg-amber-100 dark:bg-amber-950/50 rounded flex items-center justify-center">
                  <BookOpen className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="font-medium text-zinc-900 dark:text-white">
                  Ready to integrate?
                </div>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                Check out our comprehensive documentation with installation
                guides, code examples, and best practices.
              </p>
              <Button
                onClick={() => window.open("https://docs.trainlyai.com", "_blank")}
                className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                View Documentation
              </Button>
            </div>
          )}

          {/* API Information */}
          {apiKeyStatus?.isEnabled && (
            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-amber-100 dark:bg-amber-950/50 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Globe className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <div className="font-medium text-zinc-900 dark:text-white mb-1">
                    API Endpoint Ready
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                    Your chat is now accessible via API at:
                  </div>
                  <code className="text-xs bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 px-2 py-1 rounded font-mono">
                    https://api.trainlyai.com/v1/{chatId}/answer_question
                  </code>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                    Rate limit: 60 requests/minute • Supports streaming
                    responses
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-amber-100 dark:bg-amber-900/50 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                  Security Best Practices
                </div>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  <li>
                    • Keep your API key secure and never expose it in
                    client-side code
                  </li>
                  <li>• Use environment variables to store the API key</li>
                  <li>
                    • Monitor API usage and regenerate keys if compromised
                  </li>
                  <li>• Only enable API access when needed</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Secret Section for Multi-User Apps */}
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-zinc-900 dark:text-white">
            <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
              <Users className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
            </div>
            App Secret - For Multi-User OAuth Apps
          </CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            Create apps that support multiple users with private workspaces +
            shared knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <h4 className="font-semibold text-zinc-900 dark:text-white mb-2">
              🔒 Hybrid Privacy Model
            </h4>
            <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
              <li>• Each user gets their own private workspace</li>
              <li>
                • Users can access shared knowledge base (this chat's documents)
              </li>
              <li>• Complete privacy between users' personal files</li>
              <li>• Perfect for education, legal, or business SaaS apps</li>
            </ul>
          </div>

          <div>
            <Label>App Secret for Multi-User Apps</Label>
            {userApps && userApps.length > 0 ? (
              <div className="space-y-3 mt-2">
                {userApps.map((app) => (
                  <div
                    key={app._id}
                    className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-zinc-50 dark:bg-zinc-900/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-zinc-900 dark:text-white">
                          {app.name}
                        </h4>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {app.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`${
                            app.status === "live"
                              ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700"
                              : app.status === "draft"
                                ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700"
                                : "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-200 dark:border-gray-700"
                          }`}
                        >
                          {app.status === "live"
                            ? "Live"
                            : app.status === "draft"
                              ? "Draft"
                              : "Stale"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                        >
                          {app.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>

                    {/* API Access Toggle */}
                    <div className="flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg mb-3">
                      <div className="flex items-center gap-2">
                        {app.isApiDisabled ? (
                          <PowerOff className="w-4 h-4 text-red-500" />
                        ) : (
                          <Power className="w-4 h-4 text-green-500" />
                        )}
                        <div>
                          <div className="font-medium text-zinc-900 dark:text-white text-sm">
                            API Access
                          </div>
                          <div className="text-xs text-zinc-600 dark:text-zinc-400">
                            {app.isApiDisabled
                              ? "API requests are blocked"
                              : "API requests are allowed"}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant={app.isApiDisabled ? "default" : "destructive"}
                        size="sm"
                        onClick={() =>
                          handleToggleApiAccess(
                            app.appId,
                            app.isApiDisabled || false,
                          )
                        }
                        className="text-xs"
                      >
                        {app.isApiDisabled ? "Enable API" : "Disable API"}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <AppSecretDisplay
                        appId={app.appId}
                        onCopy={copyToClipboard}
                      />

                      <JwtSecretDisplay
                        appId={app.appId}
                        onCopy={copyToClipboard}
                      />

                      <div className="text-xs text-green-600">
                        <strong>App ID:</strong> {app.appId}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-auto p-1 text-green-600 hover:text-green-800"
                          onClick={() => copyToClipboard(app.appId, "App ID")}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : createdAppSecret ? (
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-zinc-50 dark:bg-zinc-900/50 mt-2">
                <div className="mb-3">
                  <h4 className="font-medium text-zinc-900 dark:text-white">
                    {chatTitle} App
                  </h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Multi-user app with hybrid privacy
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-zinc-700 dark:text-zinc-300">
                    Your App Secret
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={
                        showAppSecret
                          ? createdAppSecret
                          : "as_" + "•".repeat(32)
                      }
                      readOnly
                      className="font-mono text-sm bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAppSecret(!showAppSecret)}
                      className="border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
                        copyToClipboard(createdAppSecret, "App Secret")
                      }
                      className="border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    ⚠️ Save this secret securely - it won't be shown again after
                    you refresh!
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <Button
                  onClick={handleCreateApp}
                  disabled={isCreatingApp}
                  className="w-full bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white"
                >
                  {isCreatingApp
                    ? "Creating App..."
                    : `Create App for "${chatTitle}"`}
                </Button>
                <p className="text-xs text-zinc-500 mt-2 text-center">
                  This will create a multi-user app that uses this chat as the
                  shared knowledge base
                </p>
              </div>
            )}
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <h4 className="font-semibold text-zinc-900 dark:text-white mb-2">
              🎯 Key Differences
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-zinc-900 dark:text-white mb-1">
                  Chat API Key (Above)
                </h5>
                <ul className="text-zinc-600 dark:text-zinc-400 space-y-1">
                  <li>• Direct access to this chat only</li>
                  <li>• All users share same documents</li>
                  <li>• Simple API key authentication</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-amber-700 dark:text-amber-300 mb-1">
                  App Secret
                </h5>
                <ul className="text-amber-600 dark:text-amber-400 space-y-1">
                  <li>• Each user gets private workspace</li>
                  <li>• Access to shared knowledge + private docs</li>
                  <li>• OAuth with user-controlled tokens</li>
                </ul>
              </div>
            </div>
          </div>

          {(userApps && userApps.length > 0) || createdAppSecret ? (
            <div>
              <h4 className="font-semibold mb-2">
                Environment Setup for Your Next.js App
              </h4>
              <div className="bg-zinc-900 rounded-lg p-3">
                <pre className="text-zinc-300 text-xs">
                  {`# .env.local
TRAINLY_APP_SECRET=${createdAppSecret || "as_your_app_secret_here"}
JWT_SECRET=${createdJwtSecret || "jwt_your_jwt_secret_here"}
NEXT_PUBLIC_TRAINLY_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000`}
                </pre>
              </div>
              <div className="mt-2 text-xs text-zinc-600">
                <p>
                  💡 <strong>Tip:</strong> Copy your actual secrets from the
                  "App Secret" and "JWT Secret" fields above to replace the
                  placeholder values
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() =>
                  copyToClipboard(
                    `TRAINLY_APP_SECRET=${createdAppSecret || "as_your_app_secret_here"}\nJWT_SECRET=${createdJwtSecret || "jwt_your_jwt_secret_here"}\nNEXT_PUBLIC_TRAINLY_API_URL=http://localhost:8000\nNEXT_PUBLIC_APP_URL=http://localhost:3000`,
                    "Environment variables",
                  )
                }
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Complete Environment Setup
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
