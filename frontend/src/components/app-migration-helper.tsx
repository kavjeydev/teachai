"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

export function AppMigrationHelper() {
  const [appId, setAppId] = useState("app_user_created_123");
  const [chatId, setChatId] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const createOrUpdateAppWithParent = useMutation(
    api.app_management.createOrUpdateAppWithParent,
  );

  const handleUpdate = async () => {
    if (!appId || !chatId) {
      toast.error("Both App ID and Chat ID are required");
      return;
    }

    setIsUpdating(true);
    try {
      const result = await createOrUpdateAppWithParent({
        appId,
        parentChatId: chatId as Id<"chats">,
        name: `${appId} App`,
        description: `App linked to parent chat for settings inheritance`,
      });

      if (result.action === "created") {
        toast.success(
          `Successfully created app ${appId} linked to chat ${chatId}`,
        );
        // App created successfully
      } else {
        toast.success(
          `Successfully linked existing app ${appId} to chat ${chatId}`,
        );
        // App updated successfully
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update app");
      console.error("Migration error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-6 border border-zinc-200 rounded-lg bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
        🔧 App Migration Helper
      </h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
        Link your existing app to a parent chat to inherit settings and enable
        credit consumption.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            App ID
          </label>
          <Input
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            placeholder="app_user_created_123"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Parent Chat ID (the chat this app should inherit from)
          </label>
          <Input
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="j5764j9bspx6mjsagc6h1b8me5716gys"
          />
          <p className="text-xs text-zinc-500 mt-1">
            Go to the chat you want to inherit from and copy the ID from the URL
          </p>
        </div>

        <Button
          onClick={handleUpdate}
          disabled={isUpdating || !appId || !chatId}
          className="w-full"
        >
          {isUpdating ? "Updating..." : "Link App to Parent Chat"}
        </Button>
      </div>

      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>After updating:</strong> The app will inherit the parent
          chat's custom prompt, model selection, temperature, and other
          settings. End user queries will consume the parent chat owner's
          credits.
        </p>
      </div>
    </div>
  );
}
