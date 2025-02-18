"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Ellipsis,
  PlusCircle,
  Trash,
  Home,
  ChevronsUpDown,
  Settings,
  ChevronRight,
  File,
  X,
  Paperclip,
  Lock,
  Unlock,
  Save,
  Circle,
  Undo,
  Globe,
  FoldHorizontal,
  GalleryVertical,
} from "lucide-react";
import { SignOutButton } from "@clerk/clerk-react";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import APIKeyInput from "./api-key-input";
import { useToast } from "@/hooks/use-toast";
import APICodeBlock from "./api-code-block";
import { Dialog } from "@radix-ui/react-dialog";
import { DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ProgressBar from "./progress-bar";

const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
];

interface SidebarParams {
  chatId: Id<"chats">;
  fileProgress: number;
  showProgress: boolean | false;
  progressText: string;
}

export function AppSidebar({
  chatId,
  fileProgress,
  showProgress,
  progressText,
}: SidebarParams) {
  const router = useRouter();
  const { user } = useUser();
  const { theme } = useTheme();
  const { toast } = useToast();

  // Fetch chats
  const chats = useQuery(api.chats.getChats);

  const currentChat = useQuery(api.chats.getChatById, {
    id: chatId,
  });

  const [currVisibility, setCurrVisibility] = React.useState<string>(
    currentChat ? currentChat.apiInfo.visibility : "protected",
  );

  const showContext = useQuery(api.chats.getContext, {
    id: chatId,
  });

  const changeVisibility = useMutation(api.chats.changeVisibility);

  // Mutations
  const addChat = useMutation(api.chats.createChat);
  const archiveChat = useMutation(api.chats.archive);
  // (A) Create your rename mutation hook
  const renameChat = useMutation(api.chats.rename);

  const [settingsOpen, setSettingsOpen] = React.useState(false);

  // (B) Local state for inline editing
  const [editingChatId, setEditingChatId] = React.useState<Id<"chats"> | null>(
    null,
  );
  const [editingTitle, setEditingTitle] = React.useState("");

  // Handler for creating a chat
  const onCreate = () => {
    const promise = addChat({ title: "untitled" });
    toast({ title: "Created chat" });
    console.log("remmved");
  };

  // Handler for archiving/deleting a chat
  const onDelete = (chatId: Id<"chats">) => {
    const promise = archiveChat({ id: chatId });
    toast({ title: "Archived chat" });
  };

  // (C) Handlers for renaming a chat
  const handleDoubleClick = (chatId: Id<"chats">, currentTitle: string) => {
    // Stop the default onClick (which pushes to /dashboard)
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
  };

  const sampleCode = `async function callQueryAI(question: string, chatid: string): Promise<any> {
  const url = 'https://www.trainlyai.com/api/queryai';
  const apiKey = 'YOUR_API_KEY_HERE'; // Replace with your actual API key

  const payload = {
    question,
    chatId,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}`;

  const pythonCode = `import requests # pip install requests
from typing import Any

def call_query_ai(question: str, chatid: str) -> Any:
    url = 'https://www.trainlyai.com/api/queryai'
    api_key = 'YOUR_API_KEY_HERE'  # Replace with your actual API key

    payload = {
        "question": question,
        "chatId": chatid,
    }

    headers = {
        'Content-Type': 'application/json',
        'x-api-key': api_key,
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        data = response.json()
        return data
    except requests.exceptions.RequestException as e:
        print(f'API call failed: {e}')
        raise

# Example usage:
response = call_query_ai("What is the capital of France?", "${chatId}")
print(response)
`;

  const finishEditing = (chatId: Id<"chats">) => {
    renameChat({ id: chatId, title: editingTitle });
    setEditingChatId(null);
  };

  const eraseContent = useMutation(api.chats.eraseContext);
  const BASE_URL = "https://teachai-teachai.hypermode.app/graphql";

  const onErase = (id: Id<"chats">, fileId: string) => {
    eraseContent({
      id,
      fileId,
    })
      .then(() => {
        toast({ title: "Removed context!" });
      })
      .catch(() => {
        toast({ title: "Failed to remove context" });
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

  const handleSave = async (chatId: Id<"chats">, visibility: string) => {
    changeVisibility({
      id: chatId,
      visibility: visibility,
    })
      .then(() => {
        toast({ title: "Visibility changed!" });
      })
      .catch(() => {
        toast({ title: "Failed to change visibility" });
      });
  };

  const archivedChats = useQuery(api.chats.getArchivedChats);
  const restore = useMutation(api.chats.unArchive);

  const deleteForever = useMutation(api.chats.remove);

  const handleRestore = async (chatId: Id<"chats">) => {
    restore({
      id: chatId,
    });
    toast({
      title: "Restored chat.",
    });
  };

  const handleDelete = async (chatId: Id<"chats">) => {
    router.push("/dashboard");

    const contextLength = currentChat?.context?.length || 0;
    if (currentChat?.context) {
      for (let i = 0; i < contextLength; i++) {
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
            variables: { fileId: currentChat.context[i].fileId },
          }),
        });

        if (!modusResponse.ok) {
          const errorData = await modusResponse.json();
          throw new Error(
            errorData.detail || "Failed to write nodes to neo4j.",
          );
        }
      }
    }

    deleteForever({
      id: chatId,
    });
  };

  if (!user || user === undefined) {
    return <div>loading...</div>;
  }

  return (
    <Sidebar className="z-99999" collapsible="icon">
      <SidebarHeader className=" bg-opacity-90 border-muted-foreground/50 dark:bg-darkmaincolor">
        <Popover>
          <PopoverTrigger asChild>
            <SidebarMenuButton className="h-12 transition-colors duration-200">
              <GalleryVertical />
              <div className="leading-tight truncate text-ellipsis">
                <div className="font-semibold">Trainly</div>
                <div className="text-sm text-muted-foreground">Contact Us</div>
              </div>
              <ChevronsUpDown className="ml-auto text-muted-foreground" />
            </SidebarMenuButton>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popper-anchor-width]">
            <Button className="w-full">kavin11205@gmail.com</Button>
          </PopoverContent>
        </Popover>
      </SidebarHeader>
      <SidebarContent className="dark:bg-darkmaincolor bg-opacity-90 border-r-0">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span className="cursor-pointer">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <SidebarMenuItem key="commuunity">
                <SidebarMenuButton
                  asChild
                  onClick={() => window.open("/community", "_blank")}
                >
                  <div className="cursor-pointer">
                    <Globe />
                    <span>Community</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem key="addchat">
                <SidebarMenuButton asChild onClick={onCreate}>
                  <div className="cursor-pointer">
                    <PlusCircle />
                    <span>Add Chat</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <Dialog>
                <DialogTrigger>
                  <SidebarMenuItem key="trash">
                    <SidebarMenuButton asChild>
                      <div className="cursor-pointer">
                        <Trash />
                        <span>Trash</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </DialogTrigger>
                <DialogContent className="p-0">
                  <Command className="rounded-lg border shadow-md max-h-80">
                    <CommandInput placeholder="Type a command or search..." />
                    <CommandList>
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup heading="Archived Chats">
                        {archivedChats?.map((chat) => (
                          <CommandItem
                            key={chat._id}
                            className="flex justify-between"
                          >
                            <div className="flex gap-2">
                              <File />
                              <span>
                                {chat.title}{" "}
                                <div className="fixed opacity-0 pointer-events-none">
                                  {chat._id}
                                </div>
                              </span>
                            </div>
                            <div className="flex">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-4"
                                      onClick={() => {
                                        handleRestore(chat._id);
                                      }}
                                    >
                                      <Undo />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Restore</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      className="h-3 w-3"
                                      variant="ghost"
                                      onClick={() => {
                                        handleDelete(chat._id);
                                      }}
                                    >
                                      <X className="h-3 w-3 cursor-pointer" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete forever</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </DialogContent>
              </Dialog>

              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      onClick={() => setSettingsOpen(!settingsOpen)}
                    >
                      <div className="flex justify-between items-center cursor-pointer w-full">
                        <div className="flex gap-2 cursor-pointer items-center">
                          <Settings className="h-4 w-4" />
                          <span>Settings</span>
                        </div>
                        <div>
                          <ChevronRight
                            className={`h-4 w-4 mt-0.5 ${settingsOpen ? "rotate-0" : "rotate-90"}
                            transition-transform duration-200`}
                          />
                        </div>
                      </div>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <Drawer>
                          <DrawerTrigger asChild>
                            <SidebarMenuButton>
                              <div className="flex justify-between items-center cursor-pointer w-full">
                                <div className="flex gap-2 cursor-pointer items-center">
                                  <span className="font-semibold">My API</span>
                                </div>
                              </div>
                            </SidebarMenuButton>
                          </DrawerTrigger>
                          <DrawerContent className="">
                            <div className="flex flex-col px-20 py-8 w-full">
                              <div className="flex w-full items-center justify-center">
                                <DrawerHeader className="flex flex-col items-center mb-10">
                                  <DrawerTitle className="text-4xl ">
                                    API Settings
                                  </DrawerTitle>
                                  <DrawerDescription>
                                    Manage your API properties.
                                  </DrawerDescription>
                                </DrawerHeader>
                              </div>
                              <div className="flex mx-auto w-full justify-between">
                                <Command className="rounded-lg border shadow-md md:min-w-[300px] w-20 h-96">
                                  <CommandInput placeholder="Search for a file..." />
                                  <CommandList>
                                    <CommandEmpty>
                                      No results found.
                                    </CommandEmpty>
                                    <CommandGroup heading="Context List">
                                      {showContext?.map((item) => (
                                        <CommandItem key={item.fileId}>
                                          <div className="flex justify-between items-center w-full">
                                            <div className="flex items-center gap-2">
                                              <File size={20} color="#777777" />
                                              <span>{item.filename}</span>
                                              <div className="fixed opacity-0 pointer-events-none">
                                                {item.fileId}
                                              </div>
                                            </div>
                                            <Button
                                              className="x-[9999999] rounded-full hover:bg-darkmaincolor"
                                              onClick={() => {
                                                handleErase(
                                                  chatId,
                                                  item.fileId,
                                                );
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
                                </Command>

                                <Tabs
                                  defaultValue={currentChat?.apiInfo.visibility}
                                  className="w-[300px] "
                                >
                                  <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger
                                      value="protected"
                                      className="flex items-center gap-2 justify-center"
                                      onClick={() =>
                                        setCurrVisibility("protected")
                                      }
                                    >
                                      Protected{" "}
                                      <Lock className="h-3 w-3 text-red-500" />
                                    </TabsTrigger>
                                    <TabsTrigger
                                      value="public"
                                      className="flex items-center gap-2 justify-center"
                                      onClick={() =>
                                        setCurrVisibility("public")
                                      }
                                    >
                                      Public{" "}
                                      <Unlock className="h-3 w-3 text-green-500" />
                                    </TabsTrigger>
                                  </TabsList>
                                  <TabsContent
                                    value="public"
                                    className="text-muted-foreground text-sm ml-1"
                                  >
                                    <h1>
                                      Your chat,{" "}
                                      <span className="font-semibold">
                                        {currentChat?.title}
                                      </span>
                                      ,{" "}
                                      <span className="dark:text-white text-black">
                                        can be accessed
                                      </span>{" "}
                                      via API with your API Key.
                                    </h1>
                                    <APIKeyInput chatId={chatId} />
                                  </TabsContent>
                                  <TabsContent
                                    value="protected"
                                    className=" text-muted-foreground text-sm ml-1"
                                  >
                                    <h1>
                                      Your chat,{" "}
                                      <span className="font-semibold">
                                        {currentChat?.title}
                                      </span>
                                      ,{" "}
                                      <span className="dark:text-white text-black">
                                        can not be accessed
                                      </span>{" "}
                                      via API with your API Key.
                                    </h1>
                                  </TabsContent>
                                </Tabs>

                                <Tabs
                                  defaultValue="node"
                                  className="w-[700px] "
                                >
                                  <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger
                                      value="node"
                                      className="flex items-center gap-2 justify-center"
                                      onClick={() => {}}
                                    >
                                      Node{" "}
                                      <Circle className="h-3 w-3 text-green-500" />
                                    </TabsTrigger>
                                    <TabsTrigger
                                      value="python"
                                      className="flex items-center gap-2 justify-center"
                                      onClick={() => {}}
                                    >
                                      Python{" "}
                                      <Paperclip className="h-3 w-3 text-green-500" />
                                    </TabsTrigger>
                                  </TabsList>
                                  <TabsContent
                                    value="node"
                                    className="text-muted-foreground text-sm ml-1"
                                  >
                                    <APICodeBlock code={sampleCode} />
                                  </TabsContent>
                                  <TabsContent
                                    value="python"
                                    className=" text-muted-foreground text-sm ml-1"
                                  >
                                    <APICodeBlock code={pythonCode} />
                                  </TabsContent>
                                </Tabs>

                                <DrawerFooter className="absolute top-0 right-0">
                                  <Button
                                    disabled={
                                      currentChat?.apiInfo.visibility ===
                                      currVisibility
                                    }
                                    onClick={() => {
                                      handleSave(chatId, currVisibility);
                                    }}
                                  >
                                    Save
                                    <Save className="h-4 w-4" />
                                  </Button>
                                </DrawerFooter>
                              </div>
                            </div>
                          </DrawerContent>
                        </Drawer>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton>
                          <div className="flex justify-between items-center cursor-pointer w-full">
                            <div className="flex gap-2 cursor-pointer items-center">
                              <span>Limits</span>
                            </div>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">
            Chats
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {!chats ? (
                <div className="flex flex-col gap-2 px-2">
                  <Skeleton className="h-8" />
                  <Skeleton className="h-8" />
                  <Skeleton className="h-8" />
                </div>
              ) : (
                chats.map((chat) => {
                  const isEditing = editingChatId === chat._id;
                  const isActive = chatId === chat._id;

                  return (
                    <SidebarMenuItem
                      key={chat._id}
                      // Only navigate on single click. Double-click is for editing.
                      onClick={() => {
                        if (!isEditing) {
                          window.open("/dashboard/" + chat._id, "_self");
                        }
                      }}
                      onDoubleClick={() =>
                        handleDoubleClick(chat._id, chat.title)
                      }
                    >
                      <SidebarMenuButton asChild>
                        <div
                          className={cn(
                            "flex w-full justify-between items-center cursor-pointer",
                            isActive && "bg-muted-foreground/10",
                          )}
                        >
                          <File />
                          {/* Show an input if we are editing this chat, otherwise show the title */}
                          <div className="flex w-full justify-between items-center cursor-pointer">
                            {isEditing ? (
                              <Input
                                autoFocus
                                value={editingTitle}
                                onChange={(e) =>
                                  setEditingTitle(e.target.value)
                                }
                                onBlur={() => finishEditing(chat._id)}
                                onKeyDown={(e) => {
                                  console.log(e.key);
                                  if (e.key === "Enter") {
                                    console.log("entered");
                                    finishEditing(chat._id);
                                  } else if (e.key === "Escape") {
                                    // Cancel editing
                                    finishEditing(chat._id);
                                    // setIsEd
                                  }
                                }}
                                className="bg-muted-foreground/20 h-6 "
                              />
                            ) : (
                              <span className="cursor-pointer">
                                {chat.title}
                              </span>
                            )}
                          </div>

                          {/* Archive/Delete popover */}
                          <div
                            className="p-1 hover:bg-muted-foreground/10 rounded-lg transition-colors duration-200"
                            // Prevent clicking on the dots from also pushing to dashboard
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Popover>
                              <PopoverTrigger className="flex items-center justify-center">
                                <Ellipsis className="text-muted-foreground h-4 w-4" />
                              </PopoverTrigger>
                              <PopoverContent className="w-fit flex flex-col gap-2">
                                <Button
                                  onClick={() => {
                                    onDelete(chat._id);
                                  }}
                                  size="sm"
                                >
                                  Archive
                                </Button>

                                <Button
                                  onClick={() => {
                                    handleDoubleClick(chat._id, chat.title);
                                  }}
                                  size="sm"
                                >
                                  Rename
                                </Button>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className=" bg-opacity-90 border-muted-foreground/50 dark:bg-darkmaincolor">
        {showProgress && (
          <ProgressBar value={fileProgress} label={progressText} />
        )}
        <div className="flex items-center space-x-3 px-1 py-3">
          <Popover>
            <PopoverTrigger asChild>
              <SidebarMenuButton className="h-12 transition-colors duration-200">
                <Avatar>
                  <AvatarImage src={user?.imageUrl} alt="User Avatar" />
                  <AvatarFallback>SC</AvatarFallback>
                </Avatar>
                <div className="leading-tight truncate text-ellipsis">
                  <div className="font-semibold">{user?.firstName}</div>
                  <div className="text-sm text-muted-foreground">
                    {user?.emailAddresses[0].emailAddress}
                  </div>
                </div>
                <ChevronsUpDown className="ml-auto text-muted-foreground" />
              </SidebarMenuButton>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popper-anchor-width]">
              <SignOutButton>
                <Button className="w-full">Sign Out</Button>
              </SignOutButton>
              {/* <ContextList /> */}
            </PopoverContent>
          </Popover>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
