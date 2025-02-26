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
  AppleIcon,
  Cloud,
  Minus,
  Plus,
  Calendar,
  Smile,
  Calculator,
  User,
  CreditCard,
  File,
  X,
  Paperclip,
  Lock,
  Unlock,
  HomeIcon,
  Globe,
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
import { getActiveResourcesInfo } from "node:process";
import { ContextList } from "./context-list";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Bar, BarChart, ResponsiveContainer } from "recharts";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import APIKeyInput from "./api-key-input";
import { useToast } from "@/hooks/use-toast";

const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
];

interface SidebarParams {
  chatId: Id<"chats">;
}

export function DashSidebar() {
  const router = useRouter();
  const { user } = useUser();
  const { theme } = useTheme();

  const [chatActive, setChatActive] = React.useState(false);
  const { toast } = useToast();

  // Fetch chats
  const chats = useQuery(api.chats.getChats);

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
  const BASE_URL = "https://teachai-teachai.hypermode.app/graphql";

  // Handler for creating a chat
  const onCreate = () => {
    const promise = addChat({ title: "untitled" });
    toast({ title: "Created chat" });
  };

  // Handler for archiving/deleting a chat
  const onDelete = (chatId: Id<"chats">) => {
    const promise = archiveChat({ id: chatId });
    toast({
      title: "Archived chat",
    });
  };

  // (C) Handlers for renaming a chat
  const handleDoubleClick = (chatId: Id<"chats">, currentTitle: string) => {
    // Stop the default onClick (which pushes to /dashboard)
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
  };

  const finishEditing = (chatId: Id<"chats">) => {
    renameChat({ id: chatId, title: editingTitle })
      .then(() => {
        toast({ title: "Chat renamed" });
      })
      .catch(() => {
        toast({ title: "Error renaming chat" });
      })
      .finally(() => {
        setEditingChatId(null);
      });
  };

  const eraseContent = useMutation(api.chats.eraseContext);

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

  if (!user || user === undefined) {
    return <div>loading...</div>;
  }

  return (
    <Sidebar className="z-99999 border-none">
      <SidebarHeader className=" bg-opacity-90 border-muted-foreground/50 dark:bg-darkmaincolor">
        <div className="flex items-center space-x-1 px-1 py-3">
          <Popover>
            <PopoverTrigger asChild>
              <SidebarMenuButton className="h-12 transition-colors duration-200">
                <Avatar>
                  <AvatarImage
                    src={`${theme === "dark" ? "/trainly_white.png" : "/trainly.png"}`}
                    alt="User Avatar"
                  />
                  <AvatarFallback>TR</AvatarFallback>
                </Avatar>
                <div className="leading-tight truncate text-ellipsis">
                  <div className="font-semibold">Trainly</div>
                  <div className="text-sm text-muted-foreground">
                    Contact Us
                  </div>
                </div>
                <ChevronsUpDown className="ml-auto text-muted-foreground" />
              </SidebarMenuButton>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popper-anchor-width]">
              <Button className="w-full">kavin11205@gmail.com</Button>
            </PopoverContent>
          </Popover>
        </div>
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

              <SidebarMenuItem key="trash">
                <SidebarMenuButton asChild>
                  <div className="cursor-pointer">
                    <Trash />
                    <span>Trash</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

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
                  return (
                    <SidebarMenuItem
                      key={chat._id}
                      // Only navigate on single click. Double-click is for editing.
                      onClick={() => {
                        if (!isEditing) {
                          router.push("/dashboard/" + chat._id);
                          setChatActive(true);
                        }
                      }}
                      onDoubleClick={() =>
                        handleDoubleClick(chat._id, chat.title)
                      }
                      className="cursor-pointer"
                    >
                      <SidebarMenuButton asChild>
                        <div
                          className={cn(
                            "flex w-full justify-between items-center",
                          )}
                        >
                          {/* Show an input if we are editing this chat, otherwise show the title */}
                          {isEditing ? (
                            <Input
                              autoFocus
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onBlur={() => finishEditing(chat._id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  finishEditing(chat._id);
                                } else if (e.key === "Escape") {
                                  // Cancel editing
                                  setEditingChatId(null);
                                }
                              }}
                              className="bg-muted-foreground/20 h-6 "
                            />
                          ) : (
                            <span className="cursor-pointer">{chat.title}</span>
                          )}

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
