"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Key,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  BarChart3,
  Shield,
  Globe,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { captureEvent } from "@/lib/posthog";

interface ApiKeyManagerProps {
  chatId: Id<"chats">;
  chatTitle: string;
}

export function ApiKeyManager({ chatId, chatTitle }: ApiKeyManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showKeyValue, setShowKeyValue] = useState<Record<string, boolean>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [revokingKeys, setRevokingKeys] = useState<Set<string>>(new Set());

  // Form state
  const [description, setDescription] = useState("");
  const [scopes, setScopes] = useState(["chat.query"]);
  const [allowedOrigins, setAllowedOrigins] = useState(["*"]);
  const [rateLimitRpm, setRateLimitRpm] = useState(60);

  // Convex mutations and queries
  const integrationKeys = useQuery(api.api_keys.getChatIntegrationKeys, {
    chatId,
  });
  const usageStats = useQuery(api.api_keys.getChatUsageStats, {
    chatId,
    timeRange: "7d",
  });
  const createKey = useMutation(api.api_keys.createIntegrationKey);
  const revokeKey = useMutation(api.api_keys.revokeIntegrationKey);
  const updateKey = useMutation(api.api_keys.updateIntegrationKey);

  const handleCreateKey = async () => {
    setIsCreating(true);
    try {
      const result = await createKey({
        chatId,
        capabilities: scopes,
        allowedOrigins: allowedOrigins.filter((origin) => origin.trim()),
        rateLimitRpm,
        description: description || "Generated from dashboard",
      });

      // Track API key creation in PostHog
      captureEvent("api_key_created", {
        chatId: chatId,
        keyType: "integration_key",
        capabilities: scopes,
        rateLimitRpm: rateLimitRpm,
        hasCustomOrigins: allowedOrigins.filter((origin) => origin.trim() && origin !== "*").length > 0,
      });

      toast.success("Integration key created successfully!");

      // Reset form
      setShowCreateForm(false);
      setDescription("");
      setScopes(["chat.query"]);
      setAllowedOrigins(["*"]);
      setRateLimitRpm(60);

      return result;
    } catch (error) {
      console.error("Failed to create integration key:", error);
      toast.error("Failed to create integration key");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeKey = async (keyId: Id<"integration_keys">) => {
    if (
      !confirm(
        "Are you sure you want to revoke this API key? This action cannot be undone.",
      )
    ) {
      return;
    }

    setRevokingKeys((prev) => new Set([...prev, keyId]));
    try {
      await revokeKey({ integrationKeyId: keyId });
      toast.success("Integration key revoked successfully");
    } catch (error) {
      console.error("Failed to revoke key:", error);
      toast.error("Failed to revoke integration key");
    } finally {
      setRevokingKeys((prev) => {
        const newSet = new Set(prev);
        newSet.delete(keyId);
        return newSet;
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeyValue((prev) => ({
      ...prev,
      [keyId]: !prev[keyId],
    }));
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScopeColor = (scope: string) => {
    const colors = {
      "chat.query":
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      "graph.read":
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      "graph.write":
        "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    };
    return (
      colors[scope as keyof typeof colors] ||
      "bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300"
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
              <Key className="w-4 h-4 text-white" />
            </div>
            API Access
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Manage API keys for <strong>{chatTitle}</strong>
          </p>
        </div>

        <Button
          onClick={() => setShowCreateForm(true)}
          disabled={isCreating}
          className="bg-amber-400 hover:bg-amber-400/90 disabled:bg-amber-400/50 disabled:cursor-not-allowed text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {/* Usage Statistics */}
      {usageStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Usage Statistics (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400">
                  {usageStats.totalRequests}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Total Requests
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {usageStats.totalTokens.toLocaleString()}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Tokens Used
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(usageStats.avgResponseTime)}ms
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Avg Response
                </div>
              </div>
              <div className="text-center">
                <div
                  className={cn(
                    "text-2xl font-bold",
                    usageStats.errorRate < 0.05
                      ? "text-green-600"
                      : "text-red-600",
                  )}
                >
                  {(usageStats.errorRate * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Error Rate
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Key Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Integration Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="e.g., Mobile app integration"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <Label>Scopes (Permissions)</Label>
              <div className="space-y-2 mt-2">
                {[
                  {
                    id: "chat.query",
                    label: "Query Chat",
                    description: "Ask questions and get answers",
                  },
                  {
                    id: "graph.read",
                    label: "Read Graph",
                    description: "Access knowledge graph structure",
                  },
                  {
                    id: "graph.write",
                    label: "Write Graph",
                    description: "Modify nodes and relationships",
                  },
                ].map((scope) => (
                  <label key={scope.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={scopes.includes(scope.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setScopes([...scopes, scope.id]);
                        } else {
                          setScopes(scopes.filter((s) => s !== scope.id));
                        }
                      }}
                      className="rounded border-zinc-300"
                    />
                    <div>
                      <div className="font-medium">{scope.label}</div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        {scope.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="origins">Allowed Origins (CORS)</Label>
              <Textarea
                id="origins"
                placeholder="https://myapp.com&#10;https://staging.myapp.com&#10;* (for development only)"
                value={allowedOrigins.join("\n")}
                onChange={(e) =>
                  setAllowedOrigins(e.target.value.split("\n").filter(Boolean))
                }
                rows={3}
              />
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                One origin per line. Use * only for development.
              </p>
            </div>

            <div>
              <Label htmlFor="rateLimit">
                Rate Limit (Requests per minute)
              </Label>
              <Input
                id="rateLimit"
                type="number"
                min="1"
                max="300"
                value={rateLimitRpm}
                onChange={(e) =>
                  setRateLimitRpm(parseInt(e.target.value) || 60)
                }
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreateKey}
                disabled={isCreating}
                className="flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Integration Key"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Keys */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Integration Keys ({integrationKeys?.length || 0})
        </h3>

        {!integrationKeys || integrationKeys.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                No API Keys Yet
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Create your first integration key to start using this chat as an
                API.
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-amber-400 hover:bg-amber-400/90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First API Key
              </Button>
            </CardContent>
          </Card>
        ) : (
          integrationKeys.map((key) => (
            <Card key={key._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      {key.description}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Created {formatDate(key.createdAt)}
                      </div>
                      {key.lastUsed && (
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          Last used {formatDate(key.lastUsed)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleKeyVisibility(key.keyId)}
                    >
                      {showKeyValue[key.keyId] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(key.keyId, "Integration key")
                      }
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRevokeKey(key._id)}
                      disabled={revokingKeys.has(key._id)}
                      className="disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {revokingKeys.has(key._id) ? (
                        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* API Key Value */}
                <div>
                  <Label>Integration Key</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={
                        showKeyValue[key.keyId] ? key.keyId : "•".repeat(40)
                      }
                      readOnly
                      className="font-mono text-sm"
                    />
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    Use this key to authenticate with the TeachAI API
                  </p>
                </div>

                {/* Scopes */}
                <div>
                  <Label>Permissions</Label>
                  <div className="flex gap-2 mt-1">
                    {key.capabilities.map((scope: string) => (
                      <Badge key={scope} className={getScopeColor(scope)}>
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      Allowed Origins
                    </Label>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                      {key.allowedOrigins.length === 1 &&
                      key.allowedOrigins[0] === "*"
                        ? "All origins (development only)"
                        : key.allowedOrigins.join(", ")}
                    </div>
                  </div>

                  <div>
                    <Label>Rate Limit</Label>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                      {key.rateLimitRpm} requests/minute
                    </div>
                  </div>
                </div>

                {/* Usage Stats */}
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-zinc-900 dark:text-white">
                        {key.usageCount}
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400">
                        Total Uses
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-zinc-900 dark:text-white">
                        {key.lastUsed ? "Active" : "Unused"}
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400">
                        Status
                      </div>
                    </div>
                    <div>
                      <div
                        className={cn(
                          "text-lg font-semibold",
                          key.isRevoked ? "text-red-600" : "text-green-600",
                        )}
                      >
                        {key.isRevoked ? "Revoked" : "Active"}
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400">
                        Key Status
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Integration Examples */}
                <div>
                  <Label>Quick Integration</Label>
                  <div className="mt-2 space-y-2">
                    <div className="bg-zinc-900 dark:bg-zinc-950 rounded-lg p-3">
                      <div className="text-xs text-zinc-400 mb-1">
                        JavaScript
                      </div>
                      <code className="text-xs text-green-400 font-mono">
                        {`const client = new TeachAIClient({
  integrationKey: '${showKeyValue[key.keyId] ? key.keyId : "cik_your_key"}',
  chatId: '${chatId}'
});`}
                      </code>
                    </div>

                    <div className="bg-zinc-900 dark:bg-zinc-950 rounded-lg p-3">
                      <div className="text-xs text-zinc-400 mb-1">Python</div>
                      <code className="text-xs text-green-400 font-mono">
                        {`client = TeachAIClient(
    integration_key='${showKeyValue[key.keyId] ? key.keyId : "cik_your_key"}',
    chat_id='${chatId}'
)`}
                      </code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* API Documentation Link */}
      <Card>
        <CardContent className="text-center py-6">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
            Ready to Integrate?
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Check out our comprehensive API documentation and SDKs.
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              onClick={() => window.open("https://docs.trainlyai.com", "_blank")}
            >
              View API Docs
            </Button>
            <Button
              onClick={() =>
                copyToClipboard(
                  `curl -X POST https://api.teachai.com/v1/chats/${chatId}/query \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"messages":[{"role":"user","content":"Hello!"}]}'`,
                  "cURL example",
                )
              }
            >
              Copy cURL Example
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
