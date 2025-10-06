"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Upload,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface PublishControlsProps {
  chatId: Id<"chats">;
  hasUnpublishedChanges?: boolean;
  publishedAt?: number;
  onPublish?: () => void;
  onRollback?: () => void;
}

export function PublishControls({
  chatId,
  hasUnpublishedChanges = false,
  publishedAt,
  onPublish,
  onRollback,
}: PublishControlsProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);

  const publishChatSettings = useMutation(api.chats.publishChatSettings);
  const rollbackChatSettings = useMutation(api.chats.rollbackChatSettings);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await publishChatSettings({ chatId });
      toast.success(
        "Settings published successfully! Your API will now use these settings.",
      );
      onPublish?.();
    } catch (error) {
      console.error("Failed to publish settings:", error);
      toast.error("Failed to publish settings. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRollback = async () => {
    setIsRollingBack(true);
    try {
      await rollbackChatSettings({ chatId });
      toast.success("Settings rolled back to published version.");
      onRollback?.();
    } catch (error) {
      console.error("Failed to rollback settings:", error);
      toast.error("Failed to rollback settings. Please try again.");
    } finally {
      setIsRollingBack(false);
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <div
        className={`p-4 rounded-lg border ${
          hasUnpublishedChanges
            ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
            : "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
        }`}
      >
        <div className="flex items-center gap-3">
          {hasUnpublishedChanges ? (
            <>
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div className="flex-1">
                <h3 className="font-medium text-amber-800 dark:text-amber-200">
                  Testing Mode - Changes Not Published
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  You have unpublished changes. Your API is still using the
                  previously published settings. Test your changes in this chat,
                  then publish when ready.
                </p>
              </div>
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100"
              >
                <Clock className="h-3 w-3 mr-1" />
                Draft
              </Badge>
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div className="flex-1">
                <h3 className="font-medium text-green-800 dark:text-green-200">
                  Published - API Live
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Your API is using the current settings. Last published:{" "}
                  {formatDate(publishedAt)}
                </p>
              </div>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
              >
                <Zap className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant={hasUnpublishedChanges ? "default" : "outline"}
                      size="sm"
                      disabled={
                        isPublishing || (!hasUnpublishedChanges && !publishedAt)
                      }
                      className={
                        hasUnpublishedChanges
                          ? "bg-blue-600 hover:bg-blue-700"
                          : ""
                      }
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isPublishing ? "Publishing..." : "Publish Changes"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Publish Settings to API?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will make your current settings live for your API.
                        Any applications using your API will immediately start
                        using these new settings.
                        <br />
                        <br />
                        <strong>Changes being published:</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>AI model selection</li>
                          <li>Custom prompt and advanced settings</li>
                          <li>Temperature and response length</li>
                          <li>Uploaded files and context</li>
                        </ul>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handlePublish}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Publish Changes
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {hasUnpublishedChanges
                ? "Publish your changes to make them live for your API"
                : publishedAt
                  ? "No unpublished changes to publish"
                  : "Publish your initial settings to enable API access"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {publishedAt && hasUnpublishedChanges && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isRollingBack}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {isRollingBack ? "Rolling back..." : "Rollback"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Rollback to Published Settings?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will discard your current draft changes and restore
                        the settings that are currently published to your API.
                        <br />
                        <br />
                        <strong>This action will:</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Restore AI model and prompt settings</li>
                          <li>Reset temperature and response settings</li>
                          <li>Restore file context to published state</li>
                          <li>Remove all unpublished changes</li>
                        </ul>
                        <br />
                        Last published: {formatDate(publishedAt)}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleRollback}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Rollback Changes
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TooltipTrigger>
              <TooltipContent>
                Discard draft changes and restore published settings
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Help Text */}
      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
        <strong>How it works:</strong> This chat is your testing environment.
        Make changes to AI settings, upload files, or modify prompts to test
        them here. When you're satisfied, publish the changes to make them live
        for your API consumers.
      </div>
    </div>
  );
}
