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
  Calendar,
  FolderPlus,
  Folder,
  MoreHorizontal,
  Clock,
  FileText,
  Hash,
  Star,
} from "lucide-react";
import { SignOutButton } from "@clerk/clerk-react";
import { Id } from "../../../../convex/_generated/dataModel";
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

  const chats = useQuery(api.chats.getChats);
  const currentChat = useQuery(api.chats.getChatById, { id: chatId });

  const addChat = useMutation(api.chats.createChat);
  const archiveChat = useMutation(api.chats.archive);
  const renameChat = useMutation(api.chats.rename);

  // Enhanced state management
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
  const [viewMode, setViewMode] = React.useState<"list" | "grid">("list");

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

  const folders = React.useMemo(() => {
    if (!chats) return [];
    const folderSet = new Set(
      chats.map((chat: any) => chat.folder || "general").filter(Boolean),
    );
    return Array.from(folderSet);
  }, [chats]);

  return (
    <Sidebar className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border-r border-zinc-200/50 dark:border-zinc-800/50">
      <SidebarHeader className="p-6 border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-xl font-bold text-zinc-900 dark:text-white">
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
              className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-400/90 hover:to-amber-600/90 text-white rounded-xl shadow-lg hover:shadow-amber-400/25 transition-all duration-200 flex items-center gap-2 mb-6"
            >
              <PlusCircle className="h-4 w-4" />
              New Chat
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Enhanced Search and Filters */}
        <SidebarGroup>
          <SidebarGroupContent>
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -tranzinc-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:border-amber-400/50 rounded-xl"
              />
            </div>

            {/* Sort and Filter Controls */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
                  showFilters
                    ? "bg-amber-400/10 text-amber-400"
                    : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700",
                )}
              >
                <Filter className="h-3 w-3" />
                <span>Filters</span>
              </button>

              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm"
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="h-3 w-3" />
                ) : (
                  <SortDesc className="h-3 w-3" />
                )}
              </button>
            </div>

            {/* Enhanced Filter Panel */}
            {showFilters && (
              <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 rounded-xl p-4 mb-4 space-y-4 border border-zinc-200 dark:border-zinc-700">
                <div>
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-2 block">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as "date" | "name" | "activity")
                    }
                    className="w-full bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg px-3 py-2 text-sm focus:border-amber-400/50 transition-colors"
                  >
                    <option value="date">📅 Date Created</option>
                    <option value="name">🔤 Name</option>
                    <option value="activity">⚡ Last Activity</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-2 block">
                    Category
                  </label>
                  <select
                    value={selectedFolder}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg px-3 py-2 text-sm focus:border-amber-400/50 transition-colors"
                  >
                    <option value="all">📁 All Chats</option>
                    <option value="general">💬 General</option>
                    <option value="work">💼 Work</option>
                    <option value="research">🔬 Research</option>
                    <option value="personal">👤 Personal</option>
                  </select>
                </div>

                {/* Quick Stats */}
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center p-2 bg-white dark:bg-zinc-800 rounded-lg">
                      <div className="font-bold text-amber-400">
                        {chats?.length || 0}
                      </div>
                      <div className="text-zinc-500">Total</div>
                    </div>
                    <div className="text-center p-2 bg-white dark:bg-zinc-800 rounded-lg">
                      <div className="font-bold text-amber-400">
                        {filteredAndSortedChats.length}
                      </div>
                      <div className="text-zinc-500">Filtered</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Enhanced Chat List */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 font-semibold mb-3">
            <span>Your Chats ({filteredAndSortedChats.length})</span>
            <div className="flex items-center gap-1">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <span className="text-xs">Clear</span>
                </button>
              )}
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {filteredAndSortedChats.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 rounded-xl flex items-center justify-center mx-auto mb-3">
                    {searchQuery ? (
                      <Search className="w-6 h-6 text-zinc-400" />
                    ) : (
                      <MessageSquare className="w-6 h-6 text-zinc-400" />
                    )}
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                    {searchQuery ? "No chats found" : "No chats yet"}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-xs text-amber-400 hover:underline"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                filteredAndSortedChats.map((chat) => (
                  <SidebarMenuItem key={chat._id}>
                    <div
                      className={cn(
                        "group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 border hover:shadow-sm",
                        chat._id === chatId
                          ? "bg-gradient-to-r from-amber-400/10 to-amber-50 dark:from-amber-400/10 dark:to-zinc-800 border-amber-400/30 shadow-md"
                          : "border-transparent hover:border-zinc-200 dark:hover:border-zinc-700",
                      )}
                    >
                      {/* Enhanced Chat Icon */}
                      <div className="relative">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200",
                            chat._id === chatId
                              ? "bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg"
                              : "bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 group-hover:from-amber-400/10 group-hover:to-amber-100 dark:group-hover:to-zinc-700",
                          )}
                        >
                          <MessageSquare
                            className={cn(
                              "w-5 h-5 transition-colors",
                              chat._id === chatId
                                ? "text-white"
                                : "text-zinc-600 dark:text-zinc-400 group-hover:text-amber-400",
                            )}
                          />
                        </div>
                        {/* Activity Indicator */}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900 shadow-sm"></div>
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
                            className="h-8 text-sm border-zinc-200 dark:border-zinc-700 focus:border-amber-400"
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
                            <div
                              className={cn(
                                "font-medium text-sm truncate transition-colors mb-1",
                                chat._id === chatId
                                  ? "text-amber-400"
                                  : "text-zinc-900 dark:text-white group-hover:text-amber-400",
                              )}
                            >
                              {chat.title}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                              <div className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                <span>{chat.context?.length || 0} docs</span>
                              </div>
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

                      {/* Enhanced Chat Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditing(chat)}
                          className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                          title="Rename chat"
                        >
                          <Settings className="w-3 h-3 text-zinc-500" />
                        </button>
                        <button
                          onClick={() => onDelete(chat._id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete chat"
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

        {/* Quick Actions */}
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-zinc-600 dark:text-zinc-400 font-semibold mb-3">
            Quick Actions
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-2">
              <button
                onClick={() => router.push(`/dashboard/${chatId}/graph`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 group"
              >
                <div className="w-8 h-8 bg-amber-400/10 rounded-lg flex items-center justify-center">
                  <Network className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm text-zinc-900 dark:text-white group-hover:text-amber-400">
                    Graph View
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Visualize knowledge
                  </div>
                </div>
              </button>

              <button
                onClick={() =>
                  window.open("https://docs.trainlyai.com", "_blank")
                }
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 group"
              >
                <div className="w-8 h-8 bg-amber-400/10 rounded-lg flex items-center justify-center">
                  <Code className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm text-zinc-900 dark:text-white group-hover:text-amber-400">
                    API Docs
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Integration guide
                  </div>
                </div>
              </button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-700">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.imageUrl} className="rounded-full" />
            <AvatarFallback className="bg-amber-400 text-white text-sm">
              {user?.firstName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-zinc-900 dark:text-white truncate">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {user?.primaryEmailAddress?.emailAddress}
            </div>
          </div>
          <SignOutButton>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-zinc-500 hover:text-red-600 rounded-lg"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </SignOutButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
