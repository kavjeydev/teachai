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
import { Lock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Id } from "../../../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import React from "react";
import { Badge } from "@/components/ui/badge";
import ThemeSwitcher from "./theme-switcher";

interface ChatNavbarProps {
  chatId: Id<"chats">;
}

export const ChatNavbar = ({ chatId }: ChatNavbarProps) => {
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
    <div className="relative flex items-center gap-2 w-full h-20 justify-between pr-4 bg-transparent">
      <div className="flex items-center gap-2">
        <Dialog>
          <DialogTrigger>
            <h1 className="hover:underline cursor-pointer">
              {currentChat?.title}
            </h1>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Rename Chat</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Chat Name
                </Label>
                <Input
                  className="min-w-[180px]"
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
              <Button
                type="submit"
                size="sm"
                onClick={() => {
                  finishEditing(chatId);
                  toast.success("Chat renamed successfully!");
                }}
              >
                Save changes
              </Button>
              <DialogClose asChild>
                <Button variant="bordered" size="sm">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger>
            <Badge
              className=" dark:bg-transparent dark:text-white border dark:border-white/20
                        bg-white text-black border-black/10 rounded-full cursor-pointer shadow-none hover:bg-transparent"
            >
              <div className="flex gap-1 items-center">
                <Lock className="h-2.5 w-2.5" />
                <h1 className="text-xs font-medium">
                  {currentChat?.visibility === "private" ? (
                    <h1>Private</h1>
                  ) : (
                    <h1>Public</h1>
                  )}
                </h1>
              </div>
            </Badge>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit visibility</DialogTitle>
              <DialogDescription>
                Make changes to who can see you chat here
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Visibility
                </Label>
                <Select
                  defaultValue={currentChat?.visibility}
                  onValueChange={handleVisibilityChange}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" size="sm">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div>
        <ThemeSwitcher />
      </div>
    </div>
  );
};
