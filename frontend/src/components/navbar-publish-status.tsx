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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Upload,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Settings,
  History,
} from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { VersionHistorySlideout } from "./version-history-slideout";

interface NavbarPublishStatusProps {
  chatId: Id<"chats">;
  hasUnpublishedChanges?: boolean;
  publishedAt?: number;
  onPublish?: () => void;
  onRollback?: () => void;
}

export function NavbarPublishStatus({
  chatId,
  hasUnpublishedChanges = false,
  publishedAt,
  onPublish,
  onRollback,
}: NavbarPublishStatusProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const publishChatSettings = useMutation(api.chats.publishChatSettings);
  const rollbackChatSettings = useMutation(api.chats.rollbackChatSettings);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await publishChatSettings({ chatId });
      toast.success("Settings published! Your API now uses these settings.");
      onPublish?.();
      setIsOpen(false);
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
      setIsOpen(false);
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

  if (!hasUnpublishedChanges && !publishedAt) {
    return null; // Don't show anything if no settings have been configured
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-3 gap-2 text-xs font-medium transition-all duration-200 ${
            hasUnpublishedChanges
              ? "bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:hover:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700"
              : "bg-green-100 hover:bg-green-200 text-green-800 border border-green-300 dark:bg-green-900/30 dark:hover:bg-green-900/40 dark:text-green-200 dark:border-green-700"
          }`}
        >
          {hasUnpublishedChanges ? (
            <>
              <Clock className="h-3 w-3" />
              Draft
            </>
          ) : (
            <>
              <Zap className="h-3 w-3" />
              Live
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 space-y-4">
          {/* Status Header */}
          <div className="flex items-center gap-3">
            {hasUnpublishedChanges ? (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                    Testing Mode
                  </h3>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Changes not published to API
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100"
                >
                  Draft
                </Badge>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800 dark:text-green-200">
                    Published
                  </h3>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    API is using current settings
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                >
                  Live
                </Badge>
              </>
            )}
          </div>

          {/* Description */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            {hasUnpublishedChanges ? (
              <>
                Your API is still using the previously published settings. Test
                your changes in the chat, then publish when ready.
              </>
            ) : (
              <>Last published: {formatDate(publishedAt)}</>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant={hasUnpublishedChanges ? "default" : "outline"}
                    size="sm"
                    disabled={
                      isPublishing || (!hasUnpublishedChanges && !publishedAt)
                    }
                    className={`flex-1 ${
                      hasUnpublishedChanges
                        ? "bg-blue-600 hover:bg-blue-700"
                        : ""
                    }`}
                  >
                    <Upload className="h-3 w-3 mr-2" />
                    {isPublishing ? "Publishing..." : "Publish"}
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

              {publishedAt && hasUnpublishedChanges && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isRollingBack}
                    >
                      <RotateCcw className="h-3 w-3 mr-2" />
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
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleRollback}
                        variant="destructive"
                      >
                        Rollback Changes
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {/* Version History Button */}
            {publishedAt && (
              <VersionHistorySlideout
                chatId={chatId}
                onVersionRollback={() => {
                  onRollback?.();
                }}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <History className="h-3 w-3 mr-2" />
                    View Version History
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
