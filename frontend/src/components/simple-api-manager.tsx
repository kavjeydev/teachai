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
  CheckCircle,
  XCircle,
  Power,
  PowerOff,
  Plus,
  Search,
  MoreVertical,
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
    </div>
  );
}

export function SimpleApiManager({ chatId, chatTitle }: SimpleApiManagerProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "apps">("chat");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showAppSecret, setShowAppSecret] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingApp, setIsCreatingApp] = useState(false);
  const [createdAppSecret, setCreatedAppSecret] = useState<string | null>(null);
  const [createdJwtSecret, setCreatedJwtSecret] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set());

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

  const appCount = userApps?.length || 0;
  const filteredApps = userApps?.filter(
    (app) =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab("chat")}
          className={cn(
            "pb-3 px-1 text-sm font-medium transition-colors relative",
            activeTab === "chat"
              ? "text-amber-600 dark:text-amber-400"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
          )}
        >
          Chat API Key
          {activeTab === "chat" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 dark:bg-amber-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("apps")}
          className={cn(
            "pb-3 px-1 text-sm font-medium transition-colors relative",
            activeTab === "apps"
              ? "text-amber-600 dark:text-amber-400"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
          )}
        >
          Multi-User Apps
          {appCount > 0 && (
            <span className="ml-1.5 text-amber-600 dark:text-amber-400">
              {appCount}
            </span>
          )}
          {activeTab === "apps" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 dark:bg-amber-400" />
          )}
        </button>
      </div>

      {/* Search Bar (only for apps tab) */}
      {activeTab === "apps" && (userApps && userApps.length > 0) && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800"
          />
            </div>
      )}

      {/* Content */}
      {activeTab === "chat" ? (
            <div className="space-y-4">
          {apiKeyStatus?.hasApiKey ? (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                <div className="col-span-5">Key</div>
                <div className="col-span-4">Status</div>
                <div className="col-span-3">Actions</div>
              </div>

              {/* Table Row */}
              <div className="grid grid-cols-12 gap-4 items-center py-3 text-sm">
                <div className="col-span-5">
                  <div className="flex items-center gap-2">
                  <Input
                    value={
                      showApiKey
                        ? apiKeyStatus.apiKey || ""
                        : "tk_" + "•".repeat(32)
                    }
                    readOnly
                      className="font-mono text-xs bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800"
                  />
                  <Button
                      variant="ghost"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                      className="h-7 w-7 p-0"
                  >
                    {showApiKey ? (
                        <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                        <Eye className="w-3.5 h-3.5" />
                    )}
                  </Button>
                  <Button
                      variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(apiKeyStatus.apiKey || "", "API key")
                    }
                      className="h-7 w-7 p-0"
                  >
                      <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
                <div className="col-span-4">
                  <div className="flex items-center gap-2">
                    {apiKeyStatus.isEnabled ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-zinc-400" />
                    )}
                    <span className="text-zinc-900 dark:text-white">
                      {apiKeyStatus.isEnabled ? "Enabled" : "Disabled"}
                    </span>
                <Button
                  onClick={handleToggleAccess}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs ml-auto"
                    >
                      {apiKeyStatus.isEnabled ? "Disable" : "Enable"}
                </Button>
              </div>
                  </div>
                <div className="col-span-3">
                <Button
                  onClick={handleRegenerateKey}
                  disabled={isGenerating}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                >
                  {isGenerating ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Key className="w-6 h-6 text-zinc-400" />
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                No API key generated
              </p>
              <Button
                onClick={handleGenerateKey}
                disabled={isGenerating}
                className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100"
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
                </div>
      ) : (
        <div className="space-y-4">
          {userApps && userApps.length > 0 ? (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                <div className="col-span-4">App</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">API Access</div>
                <div className="col-span-4">Actions</div>
                </div>

              {/* Table Rows */}
              {filteredApps.length > 0 ? (
                filteredApps.map((app) => (
                  <div
                    key={app._id}
                    className="grid grid-cols-12 gap-4 items-center py-4 border-b border-zinc-200 dark:border-zinc-800"
                  >
                    <div className="col-span-4">
                      <div className="font-medium text-zinc-900 dark:text-white">
                          {app.name}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {app.description}
                      </div>
                    </div>
                    <div className="col-span-2">
                        <Badge
                          variant="outline"
                        className={
                          app.isActive
                            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-200"
                            : "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                        }
                        >
                          {app.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        {app.isApiDisabled ? (
                          <PowerOff className="w-3.5 h-3.5 text-red-500" />
                        ) : (
                          <Power className="w-3.5 h-3.5 text-green-500" />
                        )}
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          {app.isApiDisabled ? "Disabled" : "Enabled"}
                        </span>
                          </div>
                          </div>
                    <div className="col-span-4">
                      <div className="flex items-center gap-2">
                      <Button
                        variant={app.isApiDisabled ? "default" : "destructive"}
                        size="sm"
                        onClick={() =>
                          handleToggleApiAccess(
                            app.appId,
                            app.isApiDisabled || false,
                          )
                        }
                          className="h-7 text-xs"
                        >
                          {app.isApiDisabled ? "Enable" : "Disable"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            const newExpanded = new Set(expandedApps);
                            if (newExpanded.has(app._id)) {
                              newExpanded.delete(app._id);
                            } else {
                              newExpanded.add(app._id);
                            }
                            setExpandedApps(newExpanded);
                          }}
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    </div>
                    {/* Expanded Secrets Section */}
                    {expandedApps.has(app._id) && (
                      <div className="col-span-12 mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                      <AppSecretDisplay
                        appId={app.appId}
                        onCopy={copyToClipboard}
                      />
                      <JwtSecretDisplay
                        appId={app.appId}
                        onCopy={copyToClipboard}
                      />
                      <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                        <span>App ID: {app.appId}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1"
                          onClick={() => copyToClipboard(app.appId, "App ID")}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-sm text-zinc-500 dark:text-zinc-400">
                  No apps found matching "{searchQuery}"
              </div>
              )}
            </>
            ) : createdAppSecret ? (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 space-y-3">
              <div>
                  <h4 className="font-medium text-zinc-900 dark:text-white">
                    {chatTitle} App
                  </h4>
                </div>
                <div>
                <Label className="text-xs">App Secret</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={
                        showAppSecret
                          ? createdAppSecret
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
                        copyToClipboard(createdAppSecret, "App Secret")
                      }
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              {createdJwtSecret && (
                <div>
                  <Label className="text-xs">JWT Secret</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={
                        showAppSecret
                          ? createdJwtSecret
                          : "jwt_" + "•".repeat(60)
                      }
                      readOnly
                      className="font-mono text-sm"
                    />
                <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(createdJwtSecret, "JWT Secret")
                      }
                    >
                      <Copy className="w-4 h-4" />
                </Button>
                  </div>
              </div>
            )}
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Save these secrets securely
              </p>
          </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Key className="w-6 h-6 text-zinc-400" />
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                No multi-user apps created
              </p>
              <Button
                onClick={handleCreateApp}
                disabled={isCreatingApp}
                className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100"
              >
                {isCreatingApp ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create app
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
