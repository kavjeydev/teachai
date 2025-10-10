"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  Tag,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ScopeDefinition {
  name: string;
  type: "string" | "number" | "boolean";
  required: boolean;
  description?: string;
}

interface CustomScopesManagerProps {
  chatId: Id<"chats">;
  chatStringId?: string; // The actual chat ID string for API calls
  apiKey?: string;
  isApiEnabled?: boolean;
  hasApiKey?: boolean;
  hasApp?: boolean;
  appId?: string;
}

export function CustomScopesManager({
  chatId,
  chatStringId,
  apiKey,
  isApiEnabled,
  hasApiKey,
  hasApp,
  appId,
}: CustomScopesManagerProps) {
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // New scope form state
  const [newScope, setNewScope] = useState<ScopeDefinition>({
    name: "",
    type: "string",
    required: false,
    description: "",
  });

  // Convex hooks for scope management
  const scopeConfig = useQuery(api.chats.getScopeConfig, { chatId });
  const updateScopeConfig = useMutation(api.chats.updateScopeConfig);
  const clearScopeConfig = useMutation(api.chats.clearScopeConfig);

  // Local state for editing
  const [scopes, setScopes] = useState<ScopeDefinition[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Load scopes from Convex into local state
  useEffect(() => {
    if (scopeConfig) {
      setScopes(scopeConfig.scopes || []);
      setHasChanges(false);
    }
  }, [scopeConfig]);

  const validateScopeName = (name: string): boolean => {
    // Must start with letter, contain only alphanumeric, underscore, hyphen
    const regex = /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/;
    return regex.test(name);
  };

  const handleAddScope = () => {
    if (!newScope.name.trim()) {
      toast.error("Scope name is required");
      return;
    }

    if (!validateScopeName(newScope.name)) {
      toast.error(
        "Invalid scope name. Must start with a letter and contain only letters, numbers, underscores, and hyphens.",
      );
      return;
    }

    // Check for duplicates
    if (scopes.some((s) => s.name === newScope.name)) {
      toast.error("A scope with this name already exists");
      return;
    }

    setScopes([...scopes, newScope]);
    setNewScope({
      name: "",
      type: "string",
      required: false,
      description: "",
    });
    setShowAddForm(false);
    setHasChanges(true);
    toast.success(`Scope "${newScope.name}" added`);
  };

  const handleDeleteScope = (index: number) => {
    const scopeName = scopes[index].name;
    setScopes(scopes.filter((_, i) => i !== index));
    setDeleteIndex(null);
    setHasChanges(true);
    toast.success(`Scope "${scopeName}" removed`);
  };

  const handleSaveScopes = async () => {
    try {
      await updateScopeConfig({
        chatId,
        scopeConfig: { scopes },
      });
      toast.success("Scope configuration saved successfully");
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving scopes:", error);
      toast.error("Failed to save scope configuration");
    }
  };

  const getScopeTypeColor = (type: string) => {
    switch (type) {
      case "string":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "number":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "boolean":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400";
    }
  };

  // Check if we have any form of API access (API key or App)
  const hasAnyApiAccess = (isApiEnabled && (apiKey || hasApiKey)) || hasApp;

  // Show disabled state if no API access is configured
  if (!hasAnyApiAccess) {
    return (
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-zinc-900 dark:text-white">
            <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
              <Tag className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
            </div>
            Custom Scopes
          </CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            Enable API access or create an App to configure custom scopes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
            <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>
              Enable API access (with API key) or create a V1 App (with App ID)
              above to configure custom scopes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show loading state if API key is expected but still being fetched
  // (Only show this if API is enabled but no app exists)
  if (isApiEnabled && hasApiKey && !apiKey && !hasApp) {
    return (
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-zinc-900 dark:text-white">
            <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
              <Tag className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
            </div>
            Custom Scopes
          </CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            Ready to configure custom scopes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
            <Loader2 className="w-12 h-12 mx-auto mb-3 opacity-50 animate-spin" />
            <p>Loading API configuration...</p>
            <p className="text-xs mt-2">
              You may need to reveal your API key in the section above first
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-zinc-900 dark:text-white">
                <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                  <Tag className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
                </div>
                Custom Scopes
                {scopes.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  >
                    {scopes.length} scope{scopes.length !== 1 ? "s" : ""}
                  </Badge>
                )}
                {hasApp && !apiKey && (
                  <Badge
                    variant="outline"
                    className="ml-2 border-green-300 text-green-600 dark:border-green-700 dark:text-green-400"
                  >
                    App ID
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400 mt-1">
                Define custom attributes to segment your data (e.g.,
                playlist_id, workspace_id)
                {hasApp && !apiKey && appId && (
                  <span className="block text-xs mt-1">
                    Using V1 App authentication ({appId.substring(0, 12)}...)
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">What are custom scopes?</p>
                <p className="text-blue-700 dark:text-blue-300">
                  Scopes let you add custom attributes to your documents and
                  filter queries by those attributes. Perfect for multi-tenant
                  apps, playlist-based systems, or workspace organization.
                </p>
              </div>
            </div>
          </div>

          {scopeConfig === undefined ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          ) : (
            <>
              {/* Existing Scopes List */}
              {scopes.length > 0 && (
                <div className="space-y-3">
                  {scopes.map((scope, index) => (
                    <div
                      key={index}
                      className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <code className="font-mono text-sm font-semibold text-zinc-900 dark:text-white">
                              {scope.name}
                            </code>
                            <Badge
                              className={cn(
                                "text-xs font-medium",
                                getScopeTypeColor(scope.type),
                              )}
                            >
                              {scope.type}
                            </Badge>
                            {scope.required && (
                              <Badge
                                variant="outline"
                                className="text-xs border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400"
                              >
                                Required
                              </Badge>
                            )}
                          </div>
                          {scope.description && (
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              {scope.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteIndex(index)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Scope Form */}
              {showAddForm ? (
                <div className="bg-white dark:bg-zinc-900 rounded-lg border-2 border-blue-200 dark:border-blue-800 p-4 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-zinc-900 dark:text-white">
                      Add New Scope
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewScope({
                          name: "",
                          type: "string",
                          required: false,
                          description: "",
                        });
                      }}
                      className="h-8 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    >
                      Cancel
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scope-name">
                        Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="scope-name"
                        placeholder="playlist_id"
                        value={newScope.name}
                        onChange={(e) =>
                          setNewScope({ ...newScope, name: e.target.value })
                        }
                        className="font-mono"
                      />
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Letters, numbers, underscore, hyphen only
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scope-type">Type</Label>
                      <Select
                        value={newScope.type}
                        onValueChange={(value: any) =>
                          setNewScope({ ...newScope, type: value })
                        }
                      >
                        <SelectTrigger id="scope-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="string">String</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="boolean">Boolean</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scope-description">Description</Label>
                    <Textarea
                      id="scope-description"
                      placeholder="What is this scope used for?"
                      value={newScope.description}
                      onChange={(e) =>
                        setNewScope({
                          ...newScope,
                          description: e.target.value,
                        })
                      }
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Switch
                      id="scope-required"
                      checked={newScope.required}
                      onCheckedChange={(checked) =>
                        setNewScope({ ...newScope, required: checked })
                      }
                    />
                    <Label htmlFor="scope-required" className="cursor-pointer">
                      Required field (must be provided when uploading)
                    </Label>
                  </div>

                  <Button
                    onClick={handleAddScope}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Add Scope
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(true)}
                  className="w-full border-dashed border-2 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Scope
                </Button>
              )}

              {/* Save Button */}
              {hasChanges && (
                <Button
                  onClick={handleSaveScopes}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Scope Configuration
                </Button>
              )}

              {/* Example Usage */}
              {scopes.length > 0 && (
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                  <h4 className="font-semibold text-sm text-zinc-900 dark:text-white mb-2">
                    Example Usage:
                  </h4>
                  <pre className="text-xs bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-3 rounded overflow-x-auto">
                    {`// Upload with scopes
curl -X POST /v1/${chatStringId || "YOUR_CHAT_ID"}/upload_with_scopes \\
  -H "Authorization: Bearer ${apiKey?.substring(0, 10)}..." \\
  -F "file=@document.pdf" \\
  -F 'scope_values=${JSON.stringify(
    Object.fromEntries(
      scopes
        .slice(0, 2)
        .map((s) => [
          s.name,
          s.type === "string"
            ? "example_value"
            : s.type === "number"
              ? 42
              : true,
        ]),
    ),
    null,
    2,
  )}'

// Query with filters
curl -X POST /v1/${chatStringId || "YOUR_CHAT_ID"}/answer_question \\
  -H "Authorization: Bearer ${apiKey?.substring(0, 10)}..." \\
  -d '${JSON.stringify(
    {
      question: "What are the best practices?",
      scope_filters: Object.fromEntries(
        scopes
          .slice(0, 1)
          .map((s) => [
            s.name,
            s.type === "string"
              ? "example_value"
              : s.type === "number"
                ? 42
                : true,
          ]),
      ),
    },
    null,
    2,
  )}'`}
                  </pre>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteIndex !== null}
        onOpenChange={() => setDeleteIndex(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scope?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the scope "
              {deleteIndex !== null && scopes[deleteIndex]?.name}"? This won't
              affect existing documents, but new uploads won't use this scope.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteIndex !== null && handleDeleteScope(deleteIndex)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
