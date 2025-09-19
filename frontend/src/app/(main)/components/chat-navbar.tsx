"use client";

import { DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@nextui-org/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { Lock, Globe, Edit3, Network } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Id } from "../../../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import React from "react";
import { Badge } from "@/components/ui/badge";
import ThemeSwitcher from "./theme-switcher";
import { cn } from "@/lib/utils";

interface ChatNavbarProps {
  chatId: Id<"chats">;
  onGraphToggle?: () => void;
  isGraphOpen?: boolean;
  reasoningContextCount?: number;
}

export const ChatNavbar = ({
  chatId,
  onGraphToggle,
  isGraphOpen,
  reasoningContextCount,
}: ChatNavbarProps) => {
  const currentChat = useQuery(api.chats.getChatById, {
    id: chatId,
  });
  const [editingTitle, setEditingTitle] = React.useState("");
  const [editingChatId, setEditingChatId] = React.useState<Id<"chats"> | null>(
    null,
  );
  const renameChat = useMutation(api.chats.rename);

  const finishEditing = (chatId: Id<"chats">) => {
    renameChat({ id: chatId, title: editingTitle });
    setEditingChatId(null);
  };
  const updateVisibility = useMutation(api.chats.changeChatVisibility);

  function handleVisibilityChange(selectedValue: string): void {
    updateVisibility({
      id: chatId,
      visibility: selectedValue,
    })
      .then(() => {
        toast.success("Visibility updated successfully!");
      })
      .catch((error) => {
        toast.error("Failed to update visibility.");
      });
  }

  return (
    <div className="flex items-center justify-between w-full h-12 px-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
      <div className="flex items-center gap-4">
        <Dialog>
          <DialogTrigger>
            <div className="flex items-center gap-2 group cursor-pointer">
              <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-trainlymainlight transition-colors" />
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-trainlymainlight transition-colors">
                {currentChat?.title}
              </h1>
            </div>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white">
                Rename Chat
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="name"
                  className="text-right text-slate-700 dark:text-slate-300"
                >
                  Chat Name
                </Label>
                <Input
                  className="col-span-3 border-slate-200 dark:border-slate-700 focus:border-trainlymainlight dark:focus:border-trainlymainlight"
                  autoFocus
                  defaultValue={currentChat?.title}
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      finishEditing(chatId);
                      toast.success("Chat renamed successfully!");
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  className="bg-trainlymainlight hover:bg-trainlymainlight/90 text-white"
                  onClick={() => {
                    finishEditing(chatId);
                    toast.success("Chat renamed successfully!");
                  }}
                >
                  Save Changes
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3">
        {/* Graph Toggle Button */}
        {onGraphToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onGraphToggle}
            className={cn(
              "h-8 px-3 gap-2 transition-colors text-sm relative",
              isGraphOpen
                ? "bg-trainlymainlight/10 text-trainlymainlight border-trainlymainlight/20 border"
                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400",
            )}
          >
            <Network className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Graph</span>
            {reasoningContextCount && reasoningContextCount > 0 && (
              <div
                className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"
                title={`${reasoningContextCount} reasoning nodes available`}
              />
            )}
          </Button>
        )}

        <Select onValueChange={handleVisibilityChange}>
          <SelectTrigger className="w-[120px] h-8 text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-trainlymainlight/50 transition-colors">
            <SelectValue
              placeholder={
                currentChat?.visibility === "public" ? "Public" : "Private"
              }
            />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <SelectGroup>
              <SelectItem
                value="private"
                className="hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-slate-500" />
                  <span>Private</span>
                </div>
              </SelectItem>
              <SelectItem
                value="public"
                className="hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-green-500" />
                  <span>Public</span>
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Badge
          className={cn(
            "border font-medium",
            currentChat?.visibility === "public"
              ? "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400"
              : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
          )}
          variant="outline"
        >
          {currentChat?.visibility}
        </Badge>

        <ThemeSwitcher />
      </div>
    </div>
  );
};
