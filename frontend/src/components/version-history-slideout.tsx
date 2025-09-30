"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  History,
  RotateCcw,
  Clock,
  User,
  FileText,
  Settings,
  Thermometer,
  MessageSquare,
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface VersionHistorySlideoutProps {
  chatId: Id<"chats">;
  trigger?: React.ReactNode;
  onVersionRollback?: () => void;
}

export function VersionHistorySlideout({
  chatId,
  trigger,
  onVersionRollback,
}: VersionHistorySlideoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rollingBackVersion, setRollingBackVersion] = useState<string | null>(
    null,
  );
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(
    new Set(),
  );

  const versionHistory = useQuery(api.chats.getVersionHistory, { chatId });
  const rollbackToVersion = useMutation(api.chats.rollbackToVersion);

  const handleRollback = async (versionId: string) => {
    setRollingBackVersion(versionId);
    try {
      await rollbackToVersion({ chatId, versionId });
      toast.success("Successfully rolled back to selected version!");
      onVersionRollback?.();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to rollback to version:", error);
      toast.error("Failed to rollback to version. Please try again.");
    } finally {
      setRollingBackVersion(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  const getModelDisplayName = (modelId?: string) => {
    if (!modelId) return "Default";
    const modelMap: Record<string, string> = {
      "gpt-4o-mini": "GPT-4o Mini",
      "gpt-4o": "GPT-4o",
      "gpt-4-turbo": "GPT-4 Turbo",
      "gpt-4": "GPT-4",
      "gpt-3.5-turbo": "GPT-3.5 Turbo",
    };
    return modelMap[modelId] || modelId;
  };

  const togglePromptExpansion = (versionId: string) => {
    setExpandedPrompts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(versionId)) {
        newSet.delete(versionId);
      } else {
        newSet.add(versionId);
      }
      return newSet;
    });
  };

  const copyPromptToClipboard = async (
    prompt: string,
    versionNumber: number,
  ) => {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success(`Version ${versionNumber} prompt copied to clipboard!`);
    } catch (error) {
      toast.error("Failed to copy prompt to clipboard");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <History className="h-4 w-4 mr-2" />
            Version History
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </SheetTitle>
          <SheetDescription>
            View and rollback to previous published versions of your chat
            settings.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex-1 overflow-y-auto pr-2">
          <div className="space-y-4">
            {!versionHistory || versionHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No Version History</p>
                <p className="text-sm">
                  Publish your settings to start tracking versions.
                </p>
              </div>
            ) : (
              versionHistory.map((version, index) => (
                <div
                  key={version.versionId}
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                >
                  {/* Version Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <Badge className="bg-green-600 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Current
                          </Badge>
                        )}
                        <span className="font-medium text-sm">
                          Version {versionHistory.length - index}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(version.publishedAt)}
                      </div>
                    </div>
                    {index !== 0 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={rollingBackVersion === version.versionId}
                          >
                            <RotateCcw className="h-3 w-3 mr-2" />
                            {rollingBackVersion === version.versionId
                              ? "Rolling back..."
                              : "Rollback"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Rollback to Version{" "}
                              {versionHistory.length - index}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will restore your chat settings to this
                              version and make it the current published version.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRollback(version.versionId)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Rollback to This Version
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>

                  {/* Version Description */}
                  {version.description && (
                    <p className="text-sm text-muted-foreground italic">
                      "{version.description}"
                    </p>
                  )}

                  {/* Version Details */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Brain className="h-3 w-3 text-blue-500" />
                      <span className="text-muted-foreground">Model:</span>
                      <span className="font-medium">
                        {getModelDisplayName(version.selectedModel)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-green-500" />
                      <span className="text-muted-foreground">Files:</span>
                      <span className="font-medium">
                        {version.context?.length || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-3 w-3 text-orange-500" />
                      <span className="text-muted-foreground">
                        Temperature:
                      </span>
                      <span className="font-medium">
                        {version.temperature || 0.7}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-3 w-3 text-purple-500" />
                      <span className="text-muted-foreground">Max Tokens:</span>
                      <span className="font-medium">
                        {version.maxTokens || 1000}
                      </span>
                    </div>
                  </div>

                  {/* Custom Prompt Display */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <Settings className="h-3 w-3 text-amber-500" />
                        <span className="text-muted-foreground font-medium">
                          Custom Prompt:
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {version.customPrompt && (
                          <button
                            onClick={() =>
                              copyPromptToClipboard(
                                version.customPrompt!,
                                versionHistory.length - index,
                              )
                            }
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            title="Copy prompt to clipboard"
                          >
                            <Copy className="h-3 w-3" />
                            Copy
                          </button>
                        )}
                        {version.customPrompt &&
                          version.customPrompt.length > 150 && (
                            <button
                              onClick={() =>
                                togglePromptExpansion(version.versionId)
                              }
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {expandedPrompts.has(version.versionId) ? (
                                <>
                                  <ChevronUp className="h-3 w-3" />
                                  Collapse
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3 w-3" />
                                  Expand
                                </>
                              )}
                            </button>
                          )}
                      </div>
                    </div>
                    {version.customPrompt ? (
                      <div className="bg-muted/30 rounded-md p-3 text-xs border">
                        <div
                          className={`text-muted-foreground whitespace-pre-wrap ${
                            expandedPrompts.has(version.versionId)
                              ? "max-h-none"
                              : "max-h-16 overflow-hidden"
                          }`}
                        >
                          {expandedPrompts.has(version.versionId) ||
                          version.customPrompt.length <= 150
                            ? version.customPrompt
                            : `${version.customPrompt.substring(0, 150)}...`}
                        </div>
                        {!expandedPrompts.has(version.versionId) &&
                          version.customPrompt.length > 150 && (
                            <div className="mt-2 text-xs text-muted-foreground/70">
                              Click "Expand" to see full prompt (
                              {version.customPrompt.length} characters)
                            </div>
                          )}
                      </div>
                    ) : (
                      <div className="bg-muted/20 rounded-md p-3 text-xs text-muted-foreground italic border border-dashed">
                        Using default system prompt
                      </div>
                    )}
                  </div>

                  {/* Timestamp and Publisher */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>Published by you</span>
                    </div>
                    <span>{formatDate(version.publishedAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
