"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import {
  Settings,
  Sparkles,
  Thermometer,
  MessageSquare,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { captureEvent } from "@/lib/posthog";

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

interface ChatSettingsPageProps {
  chatId: Id<"chats">;
}

export function ChatSettingsPage({ chatId }: ChatSettingsPageProps) {
  const chat = useQuery(api.chats.getChatById, { id: chatId });
  const updateChatPrompt = useMutation(api.chats.updateChatPrompt);
  const updateChatTemperature = useMutation(api.chats.updateChatTemperature);
  const updateChatMaxTokens = useMutation(api.chats.updateChatMaxTokens);
  const updateChatConversationHistoryLimit = useMutation(
    api.chats.updateChatConversationHistoryLimit,
  );
  const updateChatModel = useMutation(api.chats.updateChatModel);

  const [customPrompt, setCustomPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [conversationHistoryLimit, setConversationHistoryLimit] = useState(20);
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [isUsingDefaultPrompt, setIsUsingDefaultPrompt] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<"model" | "response">("model");

  // Initialize state from chat data
  useEffect(() => {
    if (chat) {
      setCustomPrompt(chat.customPrompt || "");
      setIsUsingDefaultPrompt(!chat.customPrompt);
      setTemperature(chat.temperature ?? 0.7);
      setMaxTokens(chat.maxTokens ?? 1000);
      setConversationHistoryLimit(chat.conversationHistoryLimit ?? 20);
      setSelectedModel(chat.selectedModel ?? "gpt-4o-mini");
      setHasChanges(false);
    }
  }, [chat]);

  const handlePromptToggle = (useDefault: boolean) => {
    setIsUsingDefaultPrompt(useDefault);
    if (useDefault) {
      setCustomPrompt("");
    }
    setHasChanges(true);
  };

  const handleTemperatureChange = (value: number[]) => {
    setTemperature(value[0]);
    setHasChanges(true);
  };

  const handleMaxTokensChange = (value: number[]) => {
    setMaxTokens(value[0]);
    setHasChanges(true);
  };

  const handleConversationHistoryLimitChange = (value: number[]) => {
    setConversationHistoryLimit(value[0]);
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    setIsUpdating(true);
    try {
      const settingsChanged: string[] = [];

      // Save prompt
      const promptToSave = isUsingDefaultPrompt ? undefined : customPrompt.trim();
      if (promptToSave !== (chat?.customPrompt || "")) {
        await updateChatPrompt({ chatId, customPrompt: promptToSave });
        settingsChanged.push("customPrompt");
      }

      // Save temperature
      if (temperature !== (chat?.temperature ?? 0.7)) {
        await updateChatTemperature({ chatId, temperature });
        settingsChanged.push("temperature");
      }

      // Save max tokens
      if (maxTokens !== (chat?.maxTokens ?? 1000)) {
        await updateChatMaxTokens({ chatId, maxTokens });
        settingsChanged.push("maxTokens");
      }

      // Save conversation history limit
      if (
        conversationHistoryLimit !== (chat?.conversationHistoryLimit ?? 20)
      ) {
        await updateChatConversationHistoryLimit({
          chatId,
          conversationHistoryLimit,
        });
        settingsChanged.push("conversationHistoryLimit");
      }

      // Save model
      if (selectedModel !== (chat?.selectedModel ?? "gpt-4o-mini")) {
        await updateChatModel({ chatId, selectedModel });
        settingsChanged.push("selectedModel");
      }

      if (settingsChanged.length > 0) {
        captureEvent("chat_settings_changed", {
          chatId: chatId,
          settingsChanged: settingsChanged,
          temperature: temperature,
          maxTokens: maxTokens,
          conversationHistoryLimit: conversationHistoryLimit,
          hasCustomPrompt: !isUsingDefaultPrompt,
          selectedModel: selectedModel,
        });
        toast.success("Settings saved successfully");
        setHasChanges(false);
      } else {
        toast.info("No changes to save");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!chat) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-64 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab("model")}
          className={cn(
            "pb-3 px-1 text-sm font-medium transition-colors relative",
            activeTab === "model"
              ? "text-amber-600 dark:text-amber-400"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
          )}
        >
          Model & Prompt
          {activeTab === "model" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 dark:bg-amber-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("response")}
          className={cn(
            "pb-3 px-1 text-sm font-medium transition-colors relative",
            activeTab === "response"
              ? "text-amber-600 dark:text-amber-400"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
          )}
        >
          Response
          {activeTab === "response" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 dark:bg-amber-400" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === "model" ? (
          <>
            {/* AI Model Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                  AI Model
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Select the AI model for this chat.
                </p>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 max-w-md">
                  <Label className="text-sm text-zinc-700 dark:text-zinc-300 mb-2 block">
                    Model
                  </Label>
                  <Select
                    value={selectedModel}
                    onValueChange={(value) => {
                      setSelectedModel(value);
                      setHasChanges(true);
                    }}
                  >
                    <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* System Prompt Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                  System Prompt
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Configure the system prompt that guides the AI's behavior.
                </p>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-4">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={isUsingDefaultPrompt ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePromptToggle(true)}
                      className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    >
                      <Sparkles className="h-3 w-3 mr-2" />
                      Use Default
                    </Button>
                    <Button
                      type="button"
                      variant={!isUsingDefaultPrompt ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePromptToggle(false)}
                      className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    >
                      <Settings className="h-3 w-3 mr-2" />
                      Custom Prompt
                    </Button>
                  </div>

                  {isUsingDefaultPrompt ? (
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2 font-medium">
                        Default System Prompt:
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 whitespace-pre-wrap font-mono">
                        {DEFAULT_SYSTEM_PROMPT.substring(0, 300)}...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Textarea
                        value={customPrompt}
                        onChange={(e) => {
                          setCustomPrompt(e.target.value);
                          setHasChanges(true);
                        }}
                        placeholder="Enter your custom system prompt here..."
                        className="min-h-[120px] text-sm font-mono bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                      />
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        This prompt will be used as the system message for this chat.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Temperature Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                  Temperature
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Control the randomness and creativity of responses.
                </p>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 max-w-md space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">
                        {temperature}
                      </span>
                    </div>
                    <Slider
                      value={[temperature]}
                      onValueChange={handleTemperatureChange}
                      max={1}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span>0.0 (Focused)</span>
                      <span>0.5 (Balanced)</span>
                      <span>1.0 (Creative)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Length Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                  Response Length
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Set the maximum length of AI responses.
                </p>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 max-w-md space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">
                        {maxTokens} tokens
                      </span>
                    </div>
                    <Slider
                      value={[maxTokens]}
                      onValueChange={handleMaxTokensChange}
                      max={4000}
                      min={100}
                      step={100}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span>100 (Short)</span>
                      <span>1000 (Medium)</span>
                      <span>4000 (Long)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conversation History Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                  Conversation History
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Configure how many previous messages to include for context.
                </p>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 max-w-md space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">
                        {conversationHistoryLimit} messages
                      </span>
                    </div>
                    <Slider
                      value={[conversationHistoryLimit]}
                      onValueChange={handleConversationHistoryLimitChange}
                      max={100}
                      min={0}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span>0 (None)</span>
                      <span>20 (Default)</span>
                      <span>100 (Extended)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <Button
            onClick={handleSaveSettings}
            disabled={isUpdating}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100"
          >
            {isUpdating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

