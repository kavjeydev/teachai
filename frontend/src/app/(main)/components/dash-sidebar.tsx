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
  MessageSquare,
  Sparkles,
  Code,
  Network,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Clock,
  FileText,
  Users,
  Shield,
} from "lucide-react";
import { SignOutButton } from "@clerk/clerk-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function DashSidebar() {
  const router = useRouter();
  const { user } = useUser();

  const chats = useQuery(api.chats.getChats);
  const addChat = useMutation(api.chats.createChat);
  const archiveChat = useMutation(api.chats.archive);
  const renameChat = useMutation(api.chats.rename);

  // Enhanced state for organization
  const [editingChatId, setEditingChatId] = React.useState<Id<"chats"> | null>(
    null,
  );
  const [editingTitle, setEditingTitle] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"date" | "name" | "activity">(
    "date",
  );
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [selectedFolder, setSelectedFolder] = React.useState<string>("all");
  const [showFilters, setShowFilters] = React.useState(false);

  const onCreate = () => {
    const promise = addChat({ title: "untitled" });
    toast.success("Created new chat!");
  };

  const onDelete = (chatId: Id<"chats">) => {
    archiveChat({ id: chatId });
    toast.success("Chat deleted");
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

  // Enhanced filtering and sorting
  const filteredAndSortedChats = React.useMemo(() => {
    if (!chats) return [];

    let filtered = chats.filter((chat) => {
      const matchesSearch = chat.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesFolder =
        selectedFolder === "all" || (chat as any).folder === selectedFolder;
      return matchesSearch && matchesFolder;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.title.localeCompare(b.title);
          break;
        case "date":
          comparison =
            new Date(a._creationTime).getTime() -
            new Date(b._creationTime).getTime();
          break;
        case "activity":
          comparison =
            new Date(a._creationTime).getTime() -
            new Date(b._creationTime).getTime();
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [chats, searchQuery, sortBy, sortOrder, selectedFolder]);

  return (
    <Sidebar className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-r border-slate-200/50 dark:border-slate-800/50">
      <SidebarHeader className="p-6 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
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
              className="w-full bg-gradient-to-r from-trainlymainlight to-purple-600 hover:from-trainlymainlight/90 hover:to-purple-600/90 text-white rounded-xl shadow-lg hover:shadow-trainlymainlight/25 transition-all duration-200 flex items-center gap-2 mb-6"
            >
              <PlusCircle className="h-4 w-4" />
              New Chat
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Search and Organization */}
        <SidebarGroup>
          <SidebarGroupContent>
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-trainlymainlight/50 rounded-xl"
              />
            </div>

            {/* Quick Sort */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
                  showFilters
                    ? "bg-trainlymainlight/10 text-trainlymainlight"
                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700",
                )}
              >
                <Filter className="h-3 w-3" />
                <span>Sort</span>
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl p-4 mb-4 space-y-3 border border-slate-200 dark:border-slate-700">
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "date" | "name" | "activity")
                  }
                  className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="date">📅 Recent</option>
                  <option value="name">🔤 Name</option>
                  <option value="activity">⚡ Activity</option>
                </select>

                <button
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-sm"
                >
                  {sortOrder === "asc" ? (
                    <SortAsc className="h-3 w-3" />
                  ) : (
                    <SortDesc className="h-3 w-3" />
                  )}
                  <span>
                    {sortOrder === "asc" ? "Oldest First" : "Newest First"}
                  </span>
                </button>
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-600 dark:text-slate-400 font-semibold mb-3">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-2">
              <button
                onClick={() => router.push("/")}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 group"
              >
                <div className="w-8 h-8 bg-trainlymainlight/10 rounded-lg flex items-center justify-center">
                  <Home className="w-4 h-4 text-trainlymainlight" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm text-slate-900 dark:text-white group-hover:text-trainlymainlight">
                    Home
                  </div>
                </div>
              </button>

              <button
                onClick={() =>
                  window.open("https://docs.trainlyai.com", "_blank")
                }
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 group"
              >
                <div className="w-8 h-8 bg-trainlymainlight/10 rounded-lg flex items-center justify-center">
                  <Code className="w-4 h-4 text-trainlymainlight" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm text-slate-900 dark:text-white group-hover:text-trainlymainlight">
                    API Docs
                  </div>
                </div>
              </button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Enhanced Chat List */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-semibold mb-3">
            <span>Your Chats ({filteredAndSortedChats.length})</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {filteredAndSortedChats.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl flex items-center justify-center mx-auto mb-3">
                    {searchQuery ? (
                      <Search className="w-6 h-6 text-slate-400" />
                    ) : (
                      <MessageSquare className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                    {searchQuery ? "No chats found" : "No chats yet"}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-xs text-trainlymainlight hover:underline"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                filteredAndSortedChats.map((chat) => (
                  <SidebarMenuItem key={chat._id}>
                    <div className="group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-trainlymainlight/10 group-hover:to-purple-100 dark:group-hover:to-slate-700 transition-all duration-200">
                        <MessageSquare className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-trainlymainlight transition-colors" />
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
                            className="h-8 text-sm border-slate-200 dark:border-slate-700 focus:border-trainlymainlight"
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() =>
                              router.push(`/dashboard/${chat._id}`)
                            }
                            onDoubleClick={() => startEditing(chat)}
                            className="text-left w-full"
                          >
                            <div className="font-medium text-sm text-slate-900 dark:text-white group-hover:text-trainlymainlight truncate transition-colors">
                              {chat.title}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                              <div className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                <span>{chat.context?.length || 0} docs</span>
                              </div>
                              {chat.metadata && (
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span>{chat.metadata.totalUsers || 0} users</span>
                                </div>
                              )}
                              {chat.metadata && chat.metadata.privacyMode === "privacy_first" && (
                                <div className="flex items-center gap-1">
                                  <Shield className="w-3 h-3 text-green-500" />
                                  <span className="text-green-600 dark:text-green-400">Privacy</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {new Date(
                                    chat._creationTime,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditing(chat)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          title="Rename"
                        >
                          <Settings className="w-3 h-3 text-slate-500" />
                        </button>
                        <button
                          onClick={() => onDelete(chat._id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete"
                        >
                          <Trash className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700">
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
              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-600 rounded-lg"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </SignOutButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
