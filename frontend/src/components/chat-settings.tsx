"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Settings, Sparkles, Thermometer, MessageSquare } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant with access to a knowledge graph built from the user's documents. You have the following context from their documents:

IMPORTANT INSTRUCTIONS:
1. ALWAYS prioritize using the provided context to answer the user's question
2. If the context contains relevant information, you MUST use it and cite it with [^0], [^1], etc.
3. When citing, use the format [^X] where X is the chunk index (0-based)
4. If you use multiple chunks, cite each one: [^0] [^1] [^2]
5. The citations should correspond to chunks 0 through X where X is the highest index
6. If the user asks about a document by name and you see content from a similar document, you MUST use that content
7. Only use external knowledge if the context is completely irrelevant to the question, and clearly state when you're using external knowledge

For example:
- "According to the Grant Assignment document [^0], ecology research involves..."
- "The document shows [^2] that species interactions..."

RESPOND IN MARKDOWN FORMAT WITH CITATIONS`;

interface ChatSettingsProps {
  chatId: Id<"chats">;
  currentPrompt?: string;
  currentTemperature?: number;
  currentMaxTokens?: number;
  currentConversationHistoryLimit?: number;
  onSettingsChange?: () => void;
}

export function ChatSettings({
  chatId,
  currentPrompt = "",
  currentTemperature = 0.7,
  currentMaxTokens = 1000,
  currentConversationHistoryLimit = 20,
  onSettingsChange,
}: ChatSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(currentPrompt);
  const [temperature, setTemperature] = useState(currentTemperature);
  const [maxTokens, setMaxTokens] = useState(currentMaxTokens);
  const [conversationHistoryLimit, setConversationHistoryLimit] = useState(
    currentConversationHistoryLimit,
  );
  const [isUsingDefaultPrompt, setIsUsingDefaultPrompt] =
    useState(!currentPrompt);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateChatPrompt = useMutation(api.chats.updateChatPrompt);
  const updateChatTemperature = useMutation(api.chats.updateChatTemperature);
  const updateChatMaxTokens = useMutation(api.chats.updateChatMaxTokens);
  const updateChatConversationHistoryLimit = useMutation(
    api.chats.updateChatConversationHistoryLimit,
  );

  // Update local state when props change
  useEffect(() => {
    setCustomPrompt(currentPrompt);
    setTemperature(currentTemperature);
    setMaxTokens(currentMaxTokens);
    setConversationHistoryLimit(currentConversationHistoryLimit);
    setIsUsingDefaultPrompt(!currentPrompt);
  }, [
    currentPrompt,
    currentTemperature,
    currentMaxTokens,
    currentConversationHistoryLimit,
  ]);

  const handleSettingsSave = async () => {
    setIsUpdating(true);
    try {
      // Save prompt
      const promptToSave = isUsingDefaultPrompt
        ? undefined
        : customPrompt.trim();
      await updateChatPrompt({ chatId, customPrompt: promptToSave });

      // Save temperature if it changed
      if (temperature !== currentTemperature) {
        await updateChatTemperature({ chatId, temperature: temperature });
      }

      // Save max tokens if it changed
      if (maxTokens !== currentMaxTokens) {
        await updateChatMaxTokens({ chatId, maxTokens: maxTokens });
      }

      // Save conversation history limit if it changed
      if (conversationHistoryLimit !== currentConversationHistoryLimit) {
        await updateChatConversationHistoryLimit({
          chatId,
          conversationHistoryLimit: conversationHistoryLimit,
        });
      }

      toast.success("Settings saved successfully");
      onSettingsChange?.();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePromptToggle = (useDefault: boolean) => {
    setIsUsingDefaultPrompt(useDefault);
    if (useDefault) {
      setCustomPrompt("");
    }
  };

  const handleTemperatureChange = (value: number[]) => {
    const newTemp = value[0];
    setTemperature(newTemp); // Update UI only, no API call
  };

  const handleMaxTokensChange = (value: number[]) => {
    const newMaxTokens = value[0];
    setMaxTokens(newMaxTokens); // Update UI only, no API call
  };

  const handleConversationHistoryLimitChange = (value: number[]) => {
    const newLimit = value[0];
    setConversationHistoryLimit(newLimit); // Update UI only, no API call
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          title="Advanced Settings"
        >
          <Settings className="h-4 w-4 text-zinc-500 hover:text-amber-400 transition-colors" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] max-h-[95vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-amber-400" />
            Advanced Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Custom Prompt */}
          <div className="space-y-2">
            <Label className="text-base font-semibold flex items-center gap-2">
              System Prompt
              {((isUsingDefaultPrompt && currentPrompt) ||
                (!isUsingDefaultPrompt &&
                  customPrompt.trim() !== currentPrompt)) && (
                <span className="text-xs text-amber-500 font-normal">
                  (unsaved)
                </span>
              )}
            </Label>

            {/* Prompt Type Toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={isUsingDefaultPrompt ? "default" : "outline"}
                size="sm"
                onClick={() => handlePromptToggle(true)}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-3 w-3" />
                Use Default
              </Button>
              <Button
                type="button"
                variant={!isUsingDefaultPrompt ? "default" : "outline"}
                size="sm"
                onClick={() => handlePromptToggle(false)}
                className="flex items-center gap-2"
              >
                <Settings className="h-3 w-3" />
                Custom Prompt
              </Button>
            </div>

            {/* Default Prompt Preview */}
            {isUsingDefaultPrompt && (
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2 font-medium">
                  Default System Prompt:
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 whitespace-pre-wrap font-mono">
                  {DEFAULT_SYSTEM_PROMPT.substring(0, 200)}...
                </p>
              </div>
            )}

            {/* Custom Prompt Editor */}
            {!isUsingDefaultPrompt && (
              <div className="space-y-2">
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Enter your custom system prompt here..."
                  className="min-h-[80px] text-sm font-mono"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  This prompt will be used as the system message for this chat.
                  Make sure to include instructions for how the AI should behave
                  and use context.
                </p>
              </div>
            )}
          </div>

          {/* Temperature Control */}
          <div className="space-y-2">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              Temperature: {temperature}
              {temperature !== currentTemperature && (
                <span className="text-xs text-amber-500 font-normal">
                  (unsaved)
                </span>
              )}
            </Label>
            <div className="space-y-2">
              <Slider
                value={[temperature]}
                onValueChange={handleTemperatureChange}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>0.0 (Focused)</span>
                <span>0.5 (Balanced)</span>
                <span>1.0 (Creative)</span>
              </div>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Controls randomness in responses. Lower values make output more
              focused and deterministic.
            </p>
          </div>

          {/* Response Length Control */}
          <div className="space-y-2">
            <Label className="text-base font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Response Length: {maxTokens} tokens
              {maxTokens !== currentMaxTokens && (
                <span className="text-xs text-amber-500 font-normal">
                  (unsaved)
                </span>
              )}
            </Label>
            <div className="space-y-2">
              <Slider
                value={[maxTokens]}
                onValueChange={handleMaxTokensChange}
                max={4000}
                min={100}
                step={100}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>100 (Short)</span>
                <span>1000 (Medium)</span>
                <span>4000 (Long)</span>
              </div>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Maximum length of AI responses. Higher values allow longer, more
              detailed answers.
            </p>
          </div>

          {/* Conversation History Limit Control */}
          <div className="space-y-2">
            <Label className="text-base font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Conversation History: {conversationHistoryLimit} messages
              {conversationHistoryLimit !== currentConversationHistoryLimit && (
                <span className="text-xs text-amber-500 font-normal">
                  (unsaved)
                </span>
              )}
            </Label>
            <div className="space-y-2">
              <Slider
                value={[conversationHistoryLimit]}
                onValueChange={handleConversationHistoryLimitChange}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>0 (None)</span>
                <span>20 (Default)</span>
                <span>100 (Extended)</span>
              </div>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Number of previous messages to include for context. Set to 0 to
              disable conversation history. Higher values provide more context
              but use more tokens.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-3 border-t">
            <Button
              variant="outline"
              onClick={() => {
                // Reset all values to original values on cancel
                setTemperature(currentTemperature);
                setMaxTokens(currentMaxTokens);
                setConversationHistoryLimit(currentConversationHistoryLimit);
                setCustomPrompt(currentPrompt);
                setIsUsingDefaultPrompt(!currentPrompt);
                setIsOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSettingsSave}
              disabled={isUpdating}
              className="bg-amber-400 hover:bg-amber-400/90 disabled:bg-amber-400/50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
