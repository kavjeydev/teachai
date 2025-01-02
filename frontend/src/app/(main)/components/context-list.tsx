"use client";

import * as React from "react";
import { File, X } from "lucide-react";

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

interface ChatContext {
  chatId: Id<"chats">;
  context:
    | {
        filename: string;
        fileId: string;
      }[]
    | null
    | undefined;
}

export function ContextList({ context, chatId }: ChatContext) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  const BASE_URL = "https://trainly-trainly.hypermode.app/graphql";

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
    onErase(chatId, fileId);

    const modusResponse = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_HYPERMODE_API_KEY}`,
      },
      body: JSON.stringify({
        query: `
              mutation($fileId: String!) {
                removeContext(fileId: $fileId)
              }
            `,
        variables: { fileId },
      }),
    });

    if (!modusResponse.ok) {
      const errorData = await modusResponse.json();
      throw new Error(errorData.detail || "Failed to write nodes to neo4j.");
    }
  };

  return (
    <>
      <div>
        <Button
          onClick={() => {
            setOpen(!open);
          }}
          className="group fixed left-[16.8rem] top-2"
          variant="link"
        >
          <h1 className="flex items-center underline decoration-buttoncolor/30 group-hover:decoration-buttoncolor text-buttoncolor">
            Manage Context Files
          </h1>
        </Button>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search for a file..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Context List">
            {context?.map((item) => (
              <CommandItem key={item.fileId}>
                <div className="flex justify-between gap-4 items-center w-full">
                  <div className="flex items-center gap-2">
                    <File size={20} color="#777777" />
                    <span>{item.filename}</span>
                  </div>
                  <Button
                    className="x-[9999999] rounded-full dark:hover:bg-darkmaincolor hover:bg-white"
                    onClick={() => {
                      handleErase(chatId, item.fileId);
                      console.log("erased");
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
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
