"use client";

import * as React from "react";
import { File, Settings, X } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatContext {
  chatId: Id<"chats">;
  context:
    | {
        filename: string;
        fileId: string;
      }[]
    | null
    | undefined;
  onContextDeleted?: () => void; // Add callback for when context is deleted
}

export function ContextList({
  context,
  chatId,
  onContextDeleted,
}: ChatContext) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const eraseContent = useMutation(api.chats.eraseContext);
  const markFileDeleted = useMutation(api.fileQueue.markFileDeleted);
  const currentChat = useQuery(api.chats.getChatById, {
    id: chatId,
  });

  const onErase = (id: Id<"chats">, fileId: string) => {
    const promise = eraseContent({
      id,
      fileId,
    });

    toast({
      title: "File removed successfully.",
    });
  };

  const handleErase = async (chatId: Id<"chats">, fileId: string) => {
    console.log(`🗑️ Starting delete for file: ${fileId}`);

    // First update Convex to remove from context list
    onErase(chatId, fileId);

    // Then delete from Neo4j
    try {
      console.log(`📤 Sending DELETE request to backend for: ${fileId}`);
      const modusResponse = await fetch(
        (process.env.NEXT_PUBLIC_BASE_URL as string) +
          `remove_context/${fileId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const responseData = await modusResponse.json();
      console.log(`📥 Backend response:`, responseData);

      if (!modusResponse.ok) {
        console.error("❌ Failed to delete context from Neo4j:", responseData);
        throw new Error(responseData.detail || "Failed to delete from Neo4j.");
      }

      console.log(`✅ Successfully deleted from Neo4j: ${fileId}`);
    } catch (error) {
      console.error(`❌ Error deleting from Neo4j:`, error);
      // Don't throw - the file is already removed from Convex context
    }

    // Mark file as deleted in Convex queue
    try {
      await markFileDeleted({
        fileId: fileId,
        chatId: chatId,
      });
      console.log(`🗑️ File marked as deleted in Convex queue: ${fileId}`);
    } catch (error) {
      // Non-fatal - file might not exist in queue (e.g., old files)
      console.warn(
        "Could not mark file as deleted in queue (non-fatal):",
        error,
      );
    }

    // Trigger graph refresh after successful deletion
    if (onContextDeleted) {
      onContextDeleted();
    }
  };

  return (
    <>
      <div className="">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => {
                  setOpen(!open);
                }}
                className="group absolute right-2 top-3.5 text-muted-foreground w-fit outline outline-muted-foreground/10 px-3 mr-1"
                variant="secondary"
                size="icon"
              >
                <Settings />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Manage Context Files</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search for a file..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Context List">
            {Array.isArray(context) && context.length > 0 ? (
              context.map((item) => (
                <CommandItem key={item.fileId}>
                  <div
                    className="flex justify-between gap-4 items-center w-full"
                    key={item.fileId}
                  >
                    <div className="flex items-center gap-2">
                      <File size={20} color="#777777" />
                      <span>{item.filename}</span>
                      <div className="fixed pointer-events-none opacity-0">
                        {item.fileId}
                      </div>
                    </div>
                    <Button
                      className="x-[9999999] rounded-full dark:hover:bg-zinc-800 hover:bg-white"
                      onClick={() => {
                        handleErase(chatId, item.fileId);
                      }}
                      size="icon"
                      variant="ghost"
                    >
                      <X
                        size={12}
                        color="#E53E3E"
                        className="cursor-pointer hover:opacity-75"
                      />
                    </Button>
                  </div>
                </CommandItem>
              ))
            ) : (
              <CommandItem disabled>
                <span className="text-zinc-500">No context files</span>
              </CommandItem>
            )}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
