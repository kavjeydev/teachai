"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  X,
  FileText,
  Settings,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFileQueue } from "@/hooks/use-file-queue";
import { startTransition } from "react";

interface CreateChatWizardProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: Id<"organizations">;
}

const MODELS = [
  { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Fast & cost-effective" },
  { id: "gpt-4o", name: "GPT-4o", description: "Most capable" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", description: "High performance" },
  { id: "gpt-4", name: "GPT-4", description: "Standard GPT-4" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "Fast & efficient" },
];

export function CreateChatWizard({
  isOpen,
  onClose,
  organizationId,
}: CreateChatWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  // Step 1: Name
  const [chatName, setChatName] = useState("");

  // Step 2: Files
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Step 3: Settings
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState([1000]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public" | "protected">("private");

  const createChat = useMutation(api.chats.createChat);
  const updateChatModel = useMutation(api.chats.updateChatModel);
  const updateChatTemperature = useMutation(api.chats.updateChatTemperature);
  const updateChatMaxTokens = useMutation(api.chats.updateChatMaxTokens);
  const updateChatPrompt = useMutation(api.chats.updateChatPrompt);
  const changeChatVisibility = useMutation(api.chats.changeChatVisibility);
  const uploadContext = useMutation(api.chats.uploadContext);

  // File queue for handling uploads
  const [createdChatId, setCreatedChatId] = useState<Id<"chats"> | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const fileQueue = useFileQueue({
    chatId: createdChatId,
    chatInfo: createdChatId ? { chatType: "standard", chatId: createdChatId } : undefined,
    onFileProcessed: (fileId, fileName) => {
      if (createdChatId) {
        uploadContext({
          id: createdChatId,
          context: {
            filename: fileName,
            fileId: fileId,
          },
        });
      }
    },
    onQueueComplete: () => {
      toast.success("All files processed successfully!");
      handleFinish();
    },
  });

  // Upload pending files once chat is created
  useEffect(() => {
    if (createdChatId && pendingFiles.length > 0 && fileQueue.uploadFiles) {
      const filesToUpload = [...pendingFiles];
      setPendingFiles([]);
      fileQueue.uploadFiles(filesToUpload).catch((error) => {
        console.error("File upload error:", error);
        toast.error("Chat created but some files failed to upload");
        setIsCreating(false);
        handleFinish();
      });
    }
  }, [createdChatId]);

  const handleFiles = useCallback(
    async (files: FileList | File[], isFolder = false, folderName?: string) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      // Store files to upload after chat creation
      setSelectedFiles((prev) => [...prev, ...fileArray]);
    },
    [],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!chatName.trim()) {
        toast.error("Please enter a chat name");
        return;
      }
    }
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleCreate();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleCreate = async () => {
    if (!chatName.trim()) {
      toast.error("Please enter a chat name");
      return;
    }

    setIsCreating(true);
    try {
      // Create the chat
      const newChat = await createChat({
        title: chatName.trim(),
        organizationId,
      });

      setCreatedChatId(newChat);

      // Update settings if changed from defaults
      const updates: Promise<any>[] = [];

      if (selectedModel !== "gpt-4o-mini") {
        updates.push(updateChatModel({ chatId: newChat, selectedModel }));
      }

      if (temperature[0] !== 0.7) {
        updates.push(updateChatTemperature({ chatId: newChat, temperature: temperature[0] }));
      }

      if (maxTokens[0] !== 1000) {
        updates.push(updateChatMaxTokens({ chatId: newChat, maxTokens: maxTokens[0] }));
      }

      if (customPrompt.trim()) {
        updates.push(updateChatPrompt({ chatId: newChat, customPrompt: customPrompt.trim() }));
      }

      if (visibility !== "private") {
        updates.push(changeChatVisibility({ id: newChat, visibility }));
      }

      await Promise.all(updates);

      // Upload files if any
      if (selectedFiles.length > 0 && newChat) {
        // Set created chat ID and upload files
        // The fileQueue hook will be re-initialized with the new chatId
        setCreatedChatId(newChat);
        setPendingFiles(selectedFiles);
        // Files will be uploaded in useEffect below
        return;
      }

      handleFinish();
    } catch (error: any) {
      console.error("Failed to create chat:", error);
      toast.error(error.message || "Failed to create chat");
      setIsCreating(false);
    }
  };

  const handleFinish = () => {
    setIsCreating(false);
    onClose();
    // Reset form
    setStep(1);
    setChatName("");
    setSelectedFiles([]);
    setSelectedModel("gpt-4o-mini");
    setTemperature([0.7]);
    setMaxTokens([1000]);
    setCustomPrompt("");
    setVisibility("private");
    setCreatedChatId(null);

    // Navigate to the new chat if it was created
    if (createdChatId) {
      startTransition(() => {
        router.push(`/dashboard/${createdChatId}`);
      });
    }
  };

  const handleClose = () => {
    if (isCreating) return; // Prevent closing while creating
    onClose();
    // Reset form
    setStep(1);
    setChatName("");
    setSelectedFiles([]);
    setSelectedModel("gpt-4o-mini");
    setTemperature([0.7]);
    setMaxTokens([1000]);
    setCustomPrompt("");
    setVisibility("private");
    setCreatedChatId(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Chat</DialogTitle>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  step >= s
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500",
                )}
              >
                {step > s ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    "flex-1 h-1 mx-2 transition-colors",
                    step > s
                      ? "bg-zinc-900 dark:bg-white"
                      : "bg-zinc-200 dark:bg-zinc-700",
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="chat-name" className="text-base font-medium">
                Chat Name
              </Label>
              <Input
                id="chat-name"
                value={chatName}
                onChange={(e) => setChatName(e.target.value)}
                placeholder="Enter a name for your chat..."
                className="mt-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && chatName.trim()) {
                    handleNext();
                  }
                }}
                autoFocus
              />
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                Give your chat a descriptive name to help you find it later.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Files */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Upload Files (Optional)</Label>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                Add documents to build your knowledge graph. You can skip this step and add files later.
              </p>

              {/* Drag and drop area */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-8 text-center hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-zinc-400" />
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Supports PDF, DOCX, TXT, and more
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    handleFiles(e.target.files);
                  }
                }}
              />

              {/* Selected files list */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label className="text-sm font-medium">Selected Files</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-zinc-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Settings */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">AI Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div>
                        <div className="font-medium">{model.name}</div>
                        <div className="text-xs text-zinc-500">{model.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-base font-medium">
                Temperature: {temperature[0].toFixed(1)}
              </Label>
              <Slider
                value={temperature}
                onValueChange={setTemperature}
                min={0}
                max={1}
                step={0.1}
                className="mt-2"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Controls randomness. Lower values make responses more focused and deterministic.
              </p>
            </div>

            <div>
              <Label className="text-base font-medium">
                Max Tokens: {maxTokens[0]}
              </Label>
              <Slider
                value={maxTokens}
                onValueChange={setMaxTokens}
                min={100}
                max={4000}
                step={100}
                className="mt-2"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Maximum length of the AI's response.
              </p>
            </div>

            <div>
              <Label htmlFor="custom-prompt" className="text-base font-medium">
                Custom System Prompt (Optional)
              </Label>
              <Textarea
                id="custom-prompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter a custom system prompt..."
                className="mt-2 min-h-[100px]"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Override the default system prompt to customize the AI's behavior.
              </p>
            </div>

            <div>
              <Label className="text-base font-medium">Visibility</Label>
              <Select
                value={visibility}
                onValueChange={(value: "private" | "public" | "protected") =>
                  setVisibility(value)
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="protected">Protected</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Control who can access this chat via API.
              </p>
            </div>
          </div>
        )}

        {/* Footer buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || isCreating}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button
              onClick={handleNext}
              disabled={isCreating}
              className="bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : step === 3 ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Create Chat
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

