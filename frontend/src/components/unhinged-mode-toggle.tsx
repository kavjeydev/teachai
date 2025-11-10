"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Switch } from "@/components/ui/switch";
import { Flame } from "lucide-react";
import { toast } from "sonner";

interface UnhingedModeToggleProps {
  chatId: Id<"chats"> | null;
  currentUnhingedMode?: boolean;
  compact?: boolean;
}

export function UnhingedModeToggle({
  chatId,
  currentUnhingedMode = false,
  compact = false,
}: UnhingedModeToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const updateUnhingedMode = useMutation(api.chats.updateUnhingedMode);

  const handleToggle = async () => {
    if (!chatId) return;

    setIsUpdating(true);
    try {
      await updateUnhingedMode({
        chatId,
        unhingedMode: !currentUnhingedMode,
      });

      toast.success(
        !currentUnhingedMode
          ? "🔥 Unhinged mode activated! Prepare for wild responses..."
          : "✅ Unhinged mode deactivated. Back to normal."
      );
    } catch (error) {
      console.error("Failed to update unhinged mode:", error);
      toast.error("Failed to update unhinged mode");
    } finally {
      setIsUpdating(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors group/unhinged">
        <button
          onClick={handleToggle}
          disabled={isUpdating || !chatId}
          className="flex items-center gap-2"
          title={
            currentUnhingedMode
              ? "Unhinged mode is ON - Using Grok's unhinged AI"
              : "Unhinged mode is OFF - Click to enable"
          }
        >
          <Flame
            className={`w-3.5 h-3.5 transition-all ${
              currentUnhingedMode
                ? "text-orange-500 animate-pulse"
                : "text-zinc-400 group-hover/unhinged:text-orange-400"
            } ${isUpdating ? "opacity-50" : ""}`}
          />
          {currentUnhingedMode && (
            <span className="text-xs font-medium text-orange-500">
              Unhinged
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-orange-400/50 transition-all">
      <div className="flex items-center gap-2 flex-1">
        <Flame
          className={`w-5 h-5 transition-all ${
            currentUnhingedMode
              ? "text-orange-500 animate-pulse"
              : "text-zinc-400"
          }`}
        />
        <div className="flex-1">
          <div className="font-medium text-sm text-zinc-900 dark:text-white">
            Unhinged Mode
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {currentUnhingedMode
              ? "Using Grok's unhinged AI model"
              : "Use Grok's unhinged AI for wild responses"}
          </div>
        </div>
      </div>
      <Switch
        checked={currentUnhingedMode}
        onCheckedChange={handleToggle}
        disabled={isUpdating || !chatId}
        className="data-[state=checked]:bg-orange-500"
      />
    </div>
  );
}

