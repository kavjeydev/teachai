"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Brain, Zap } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

// OpenAI models available as of 2024/2025
const OPENAI_MODELS = [
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    shortName: "4o Mini",
    description: "Faster, cost-effective version (Recommended)",
    icon: Zap,
    category: "Latest",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    shortName: "4o",
    description: "Most capable multimodal model",
    icon: Brain,
    category: "Latest",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    shortName: "4 Turbo",
    description: "High-performance model with large context",
    icon: Brain,
    category: "GPT-4",
  },
  {
    id: "gpt-4",
    name: "GPT-4",
    shortName: "4",
    description: "Most capable GPT-4 model",
    icon: Brain,
    category: "GPT-4",
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    shortName: "3.5 Turbo",
    description: "Fast and efficient for most tasks",
    icon: Zap,
    category: "GPT-3.5",
  },
];

interface ModelSelectorProps {
  chatId: Id<"chats">;
  currentModel?: string;
  onModelChange?: () => void;
  compact?: boolean;
  unhingedMode?: boolean;
}

export function ModelSelector({
  chatId,
  currentModel = "gpt-4o-mini",
  onModelChange,
  compact = false,
  unhingedMode = false,
}: ModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState(currentModel);
  const updateChatModel = useMutation(api.chats.updateChatModel);

  // Update local state when props change
  useEffect(() => {
    // Force grok-3 when unhinged mode is enabled
    setSelectedModel(unhingedMode ? "grok-3" : currentModel);
  }, [currentModel, unhingedMode]);

  const handleModelChange = async (modelId: string) => {
    try {
      setSelectedModel(modelId);
      await updateChatModel({ chatId, selectedModel: modelId });
      const modelInfo = OPENAI_MODELS.find((m) => m.id === modelId);

      // Track model change in PostHog
      captureEvent("chat_model_changed", {
        chatId: chatId,
        oldModel: currentModel,
        newModel: modelId,
        modelName: modelInfo?.name || modelId,
      });

      toast.success(`Switched to ${modelInfo?.name || modelId}`);
      onModelChange?.();
    } catch (error) {
      console.error("Failed to update model:", error);
      toast.error("Failed to update model");
      setSelectedModel(currentModel); // Revert on error
    }
  };

  const selectedModelInfo = OPENAI_MODELS.find((m) => m.id === selectedModel);

  if (compact) {
    // Show locked grok-3 in unhinged mode
    if (unhingedMode) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
          <Brain className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
            grok-3
          </span>
          <span className="text-xs text-orange-500/70">🔒</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Select value={selectedModel} onValueChange={handleModelChange}>
          <SelectTrigger className="h-auto w-auto p-0 border-none bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0 shadow-none">
            <SelectValue>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all duration-200 cursor-pointer">
                {selectedModelInfo && (
                  <>
                    <selectedModelInfo.icon className="h-3 w-3" />
                    <span className="text-xs font-medium">
                      {selectedModelInfo.shortName}
                    </span>
                  </>
                )}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="min-w-[200px]">
            {OPENAI_MODELS.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex items-center gap-3 py-1">
                  <model.icon className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-xs text-zinc-500">
                      {model.description}
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Select value={selectedModel} onValueChange={handleModelChange}>
        <SelectTrigger className="w-full">
          <SelectValue>
            <div className="flex items-center gap-2">
              {selectedModelInfo && (
                <>
                  <selectedModelInfo.icon className="h-4 w-4" />
                  <span>{selectedModelInfo.name}</span>
                  <span className="text-xs text-zinc-500">
                    - {selectedModelInfo.description}
                  </span>
                </>
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {OPENAI_MODELS.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex items-center gap-3 py-1">
                <model.icon className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{model.name}</span>
                  <span className="text-xs text-zinc-500">
                    {model.description}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
