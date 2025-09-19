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
} from "@/components/ui/sidebar";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlusCircle,
  Trash,
  Home,
  Settings,
  File,
  Paperclip,
  Network,
  MessageSquare,
  Sparkles,
  Code,
  Eye,
} from "lucide-react";
import { SignOutButton } from "@clerk/clerk-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SidebarParams {
  chatId: Id<"chats">;
  fileProgress: number;
  showProgress: boolean;
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

  const chats = useQuery(api.chats.getChats);
  const currentChat = useQuery(api.chats.getChatById, { id: chatId });

  const addChat = useMutation(api.chats.createChat);
  const archiveChat = useMutation(api.chats.archive);
  const renameChat = useMutation(api.chats.rename);

  const [editingChatId, setEditingChatId] = React.useState<Id<"chats"> | null>(null);
  const [editingTitle, setEditingTitle] = React.useState("");

  const onCreate = () => {
    const promise = addChat({ title: "untitled" });
    toast.success("Created new chat!");
  };

  const onDelete = (chatId: Id<"chats">) => {
    archiveChat({ id: chatId });
    toast.success("Chat deleted");
    router.push("/dashboard");
  };

  const startEditing = (chat: any) => {
    setEditingChatId(chat._id);
    setEditingTitle(chat.title);
  };

  const finishEditing = (chatId: Id<"chats">) => {
    if (editingTitle.trim()) {
      renameChat({ id: chatId, title: editingTitle });
      toast.success("Chat renamed!");
    }
    setEditingChatId(null);
  };

  return (
    <Sidebar className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800">
      <SidebarHeader className="p-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-white">
            trainly
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        {/* Create New Chat */}
        <SidebarGroup>
          <SidebarGroupContent>
            <Button
              onClick={onCreate}
              className="w-full bg-trainlymainlight hover:bg-trainlymainlight/90 text-white rounded-xl shadow-lg hover:shadow-trainlymainlight/25 transition-all duration-200 flex items-center gap-2 mb-6"
            >
              <PlusCircle className="h-4 w-4" />
              New Chat
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Chat List */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-600 dark:text-slate-400 font-semibold mb-3">
            Recent Chats
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {chats?.map((chat) => (
                <SidebarMenuItem key={chat._id}>
                  <div className={cn(
                    "group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800",
                    chat._id === chatId && "bg-trainlymainlight/10 border border-trainlymainlight/20"
                  )}>
                    <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {editingChatId === chat._id ? (
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") finishEditing(chat._id);
                            if (e.key === "Escape") setEditingChatId(null);
                          }}
                          onBlur={() => finishEditing(chat._id)}
                          className="h-8 text-sm border-slate-200 dark:border-slate-700"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => router.push(`/dashboard/${chat._id}`)}
                          onDoubleClick={() => startEditing(chat)}
                          className="text-left w-full"
                        >
                          <div className={cn(
                            "font-medium text-sm truncate",
                            chat._id === chatId
                              ? "text-trainlymainlight"
                              : "text-slate-900 dark:text-white group-hover:text-trainlymainlight"
                          )}>
                            {chat.title}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {chat.context?.length || 0} documents
                          </div>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => onDelete(chat._id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20 transition-all duration-200"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions */}
        <SidebarGroup className="mt-8">
          <SidebarGroupLabel className="text-slate-600 dark:text-slate-400 font-semibold mb-3">
            Quick Actions
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-2">
              <button
                onClick={() => router.push(`/dashboard/${chatId}/graph`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 group"
              >
                <div className="w-8 h-8 bg-trainlymainlight/10 rounded-lg flex items-center justify-center">
                  <Network className="w-4 h-4 text-trainlymainlight" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm text-slate-900 dark:text-white group-hover:text-trainlymainlight">
                    Graph View
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Visualize knowledge
                  </div>
                </div>
              </button>

              <button
                onClick={() => window.open('https://docs.trainlyai.com', '_blank')}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 group"
              >
                <div className="w-8 h-8 bg-trainlymainlight/10 rounded-lg flex items-center justify-center">
                  <Code className="w-4 h-4 text-trainlymainlight" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm text-slate-900 dark:text-white group-hover:text-trainlymainlight">
                    API Docs
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Integration guide
                  </div>
                </div>
              </button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.imageUrl} className="rounded-full" />
            <AvatarFallback className="bg-trainlymainlight text-white text-sm">
              {user?.firstName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-slate-900 dark:text-white truncate">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user?.primaryEmailAddress?.emailAddress}
            </div>
          </div>
          <SignOutButton>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-600"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </SignOutButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
