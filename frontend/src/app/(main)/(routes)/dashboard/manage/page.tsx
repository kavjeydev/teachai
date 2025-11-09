"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { ResizableSidebar } from "../../../components/resizable-sidebar";
import { ChatNavbar } from "../../../components/chat-navbar";
import { useSidebarWidth } from "@/hooks/use-sidebar-width";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlusCircle,
  Search,
  Filter,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Star,
  StarOff,
  Trash,
  Edit3,
  Copy,
  Download,
  Share,
  Archive,
  RotateCcw,
  FolderPlus,
  Folder,
  FolderOpen,
  MessageSquare,
  FileText,
  Clock,
  Globe,
  Lock,
  Eye,
  ArrowLeft,
  Calendar,
  Tag,
  Users,
  Zap,
  CreditCard,
} from "lucide-react";
import { BillingDashboard } from "@/components/billing-dashboard";
import { ChatDeleteDialog } from "@/components/chat-delete-dialog";

export default function ChatManagementPage() {
  const { user } = useUser();
  const router = useRouter();
  const { sidebarWidth } = useSidebarWidth();

  const chats = useQuery(api.chats.getChats);
  const archivedChats = useQuery(api.chats.getArchivedChats);
  const chatLimits = useQuery(api.chats.getUserChatLimits);
  const userFolders = useQuery(api.chats.getFolders);
  const addChat = useMutation(api.chats.createChat);
  const archiveChat = useMutation(api.chats.archive);
  const restoreChat = useMutation(api.chats.restoreFromArchive);
  const permanentlyDeleteChat = useMutation(api.chats.permanentlyDelete);
  const renameChat = useMutation(api.chats.rename);
  const createFolder = useMutation(api.chats.createFolder);
  const moveToFolder = useMutation(api.chats.moveToFolder);
  const deleteFolder = useMutation(api.chats.deleteFolder);
  const toggleFavorite = useMutation(api.chats.toggleFavorite);

  // UI State
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name" | "activity" | "size">(
    "date",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [editingChatId, setEditingChatId] = useState<Id<"chats"> | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [chatToMove, setChatToMove] = useState<string | null>(null);
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const [folderChatCount, setFolderChatCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<any>(null);
  const [isPermanentDelete, setIsPermanentDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate folder counts
  const folderCounts = useMemo(() => {
    if (!chats) return {};

    const counts: Record<string, number> = {
      all: chats.length,
      recent: chats.filter((chat) => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Date(chat._creationTime) > weekAgo;
      }).length,
      uncategorized: chats.filter((chat) => !chat.folderId).length,
      archived: archivedChats?.length || 0,
    };

    // Add counts for user-created folders
    if (userFolders) {
      userFolders.forEach((folder) => {
        counts[folder._id] = chats.filter(
          (chat) => chat.folderId === folder._id,
        ).length;
      });
    }

    return counts;
  }, [chats, archivedChats, userFolders]);

  // Folder organization - combine default and user folders
  const allFolders = useMemo(() => {
    const defaultFolders = [
      {
        id: "all",
        name: "All Chats",
        icon: MessageSquare,
        color: "text-zinc-600",
      },
      { id: "recent", name: "Recent", icon: Clock, color: "text-blue-600" },
      {
        id: "uncategorized",
        name: "Uncategorized",
        icon: Folder,
        color: "text-zinc-600",
      },
      {
        id: "archived",
        name: "Archived",
        icon: Archive,
        color: "text-orange-600",
      },
    ];

    const customFolders =
      userFolders?.map((folder) => ({
        id: folder._id,
        name: folder.name,
        icon: Folder,
        color: folder.color || "text-amber-600",
      })) || [];

    return [...defaultFolders, ...customFolders];
  }, [userFolders]);

  // Filter and sort chats
  const filteredAndSortedChats = useMemo(() => {
    // Use archived chats if archived folder is selected, otherwise use regular chats
    const sourceChats =
      selectedFolder === "archived" ? archivedChats || [] : chats || [];

    if (!sourceChats.length) return [];

    let filtered = sourceChats.filter((chat) => {
      const matchesSearch = chat.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      let matchesFolder = true;
      if (selectedFolder !== "all" && selectedFolder !== "archived") {
        switch (selectedFolder) {
          case "recent":
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            matchesFolder = new Date(chat._creationTime) > weekAgo;
            break;
          case "uncategorized":
            matchesFolder = !chat.folderId;
            break;
          case "pinned":
            matchesFolder =
              chat.title.toLowerCase().includes("important") ||
              chat.title.toLowerCase().includes("project");
            break;
          case "work":
            matchesFolder =
              chat.title.toLowerCase().includes("work") ||
              chat.title.toLowerCase().includes("project") ||
              chat.title.toLowerCase().includes("business");
            break;
          case "research":
            matchesFolder =
              chat.title.toLowerCase().includes("research") ||
              chat.title.toLowerCase().includes("study") ||
              chat.title.toLowerCase().includes("learn");
            break;
          case "personal":
            matchesFolder =
              !chat.title.toLowerCase().includes("work") &&
              !chat.title.toLowerCase().includes("research");
            break;
          default:
            // Handle custom user-created folders by checking folderId
            matchesFolder = chat.folderId === selectedFolder;
            break;
        }
      }

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
        case "size":
          comparison = (a.context?.length || 0) - (b.context?.length || 0);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [chats, archivedChats, searchQuery, sortBy, sortOrder, selectedFolder]);

  const onCreate = async () => {
    // Check if user can create more chats
    if (chatLimits && !chatLimits.canCreateMore) {
      toast.error(
        `You've reached your chat limit of ${chatLimits.chatLimit} chat${chatLimits.chatLimit > 1 ? "s" : ""} for the ${chatLimits.tierName} plan. Please upgrade your plan or archive existing chats to create new ones.`,
      );
      return;
    }

    try {
      await addChat({ title: "Untitled Chat" });
      toast.success("Created new chat!");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create chat");
      }
    }
  };

  const onDelete = (chat: any) => {
    handleArchiveChat(chat);
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

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      try {
        await createFolder({ name: newFolderName.trim() });
        toast.success("Folder created!");
        setNewFolderName("");
        setIsCreatingFolder(false);
      } catch (error) {
        toast.error("Failed to create folder");
      }
    }
  };

  const toggleChatSelection = (chatId: string) => {
    const newSelection = new Set(selectedChats);
    if (newSelection.has(chatId)) {
      newSelection.delete(chatId);
    } else {
      newSelection.add(chatId);
    }
    setSelectedChats(newSelection);
  };

  const selectAll = () => {
    if (selectedChats.size === filteredAndSortedChats.length) {
      setSelectedChats(new Set());
    } else {
      setSelectedChats(new Set(filteredAndSortedChats.map((chat) => chat._id)));
    }
  };

  const handleToggleFavorite = async (chatId: Id<"chats">) => {
    try {
      const newStatus = await toggleFavorite({ chatId });
      toast.success(newStatus ? "Chat favorited!" : "Chat unfavorited!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update favorite status");
    }
  };

  const handleMoveToFolder = async (
    chatId: Id<"chats">,
    folderId: string | undefined,
  ) => {
    try {
      await moveToFolder({ chatId, folderId });
      const folderName = folderId
        ? userFolders?.find((f) => f._id === folderId)?.name || "Unknown Folder"
        : "Uncategorized";
      toast.success(`Chat moved to ${folderName}!`);
      setShowMoveModal(false);
      setChatToMove(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to move chat");
    }
  };

  const handleDeleteFolder = async (
    folderId: string,
    deleteChats: boolean = false,
  ) => {
    try {
      const result = await deleteFolder({
        folderId: folderId as Id<"folders">,
        deleteChats,
      });
      if (deleteChats) {
        toast.success(
          `Folder deleted along with ${result.deletedChats} chats!`,
        );
      } else {
        toast.success("Folder deleted! Chats moved to uncategorized.");
      }
      setShowDeleteFolderModal(false);
      setFolderToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete folder");
    }
  };

  const promptDeleteFolder = (folderId: string) => {
    const chatCount = folderCounts[folderId] || 0;
    setFolderChatCount(chatCount);
    setFolderToDelete(folderId);
    setShowDeleteFolderModal(true);
  };

  const handleArchiveChat = (chat: any) => {
    setChatToDelete(chat);
    setIsPermanentDelete(false);
    setDeleteDialogOpen(true);
  };

  const handlePermanentDelete = (chat: any) => {
    setChatToDelete(chat);
    setIsPermanentDelete(true);
    setDeleteDialogOpen(true);
  };

  const handleRestoreChat = async (chat: any) => {
    try {
      await restoreChat({ id: chat._id });
      toast.success(`"${chat.title}" restored successfully!`);
    } catch (error: any) {
      console.error("Failed to restore chat:", error);

      // Show specific error message with upgrade option if it's a limit error
      if (error.message && error.message.includes("reached your limit")) {
        toast.error(error.message, {
          duration: 8000,
          action: {
            label: "View Plans",
            onClick: () => window.open("/pricing", "_blank"),
          },
        });
      } else {
        toast.error(error.message || "Failed to restore chat");
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!chatToDelete) return;

    setIsDeleting(true);
    try {
      if (isPermanentDelete) {
        // First, delete from Convex database
        const result = await permanentlyDeleteChat({ id: chatToDelete._id });
        console.log(
          `🗑️ Convex deletion completed for chat: ${chatToDelete.title}`,
        );

        // Then, cleanup Neo4j data from frontend
        try {
          const backendUrl =
            process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000";
          // Remove trailing slash to avoid double slashes
          const baseUrl = backendUrl.endsWith("/")
            ? backendUrl.slice(0, -1)
            : backendUrl;
          // Include child chat IDs if they exist
          const childChatIdsParam =
            result.childChatIds && result.childChatIds.length > 0
              ? `&child_chat_ids=${encodeURIComponent(result.childChatIds.join(","))}`
              : "";
          const cleanupUrl = `${baseUrl}/cleanup_chat_data/${result.chatId}?convex_id=${result.convexId}${childChatIdsParam}`;

          console.log(`🗑️ Calling Neo4j cleanup from frontend: ${cleanupUrl}`);

          const neo4jResponse = await fetch(cleanupUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (neo4jResponse.ok) {
            const neo4jResult = await neo4jResponse.json();
            console.log(`✅ Neo4j cleanup successful:`, neo4jResult);
            console.log(
              `✅ Nodes deleted: ${neo4jResult.nodes_deleted}, Relationships deleted: ${neo4jResult.relationships_deleted}`,
            );
          } else {
            console.error(`❌ Neo4j cleanup failed: ${neo4jResponse.status}`);
            const errorText = await neo4jResponse.text();
            console.error(`❌ Error response: ${errorText}`);
            // Don't fail the whole operation if Neo4j cleanup fails
          }
        } catch (neo4jError) {
          console.error(`💥 Error calling Neo4j cleanup:`, neo4jError);
          // Don't fail the whole operation if Neo4j cleanup fails
        }

        toast.success(`"${chatToDelete.title}" permanently deleted.`);
      } else {
        await archiveChat({ id: chatToDelete._id });
        toast.success(`"${chatToDelete.title}" archived successfully!`);
      }
      setDeleteDialogOpen(false);
      setChatToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete/archive chat:", error);
      toast.error(error.message || "Operation failed");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <div className="h-full w-screen bg-gradient-to-br overflow-hidden rounded-3xl dark:bg-[#090909] bg-white px-4 pb-4">
        <Toaster position="top-center" richColors />

        {/* Resizable Sidebar */}
        <ResizableSidebar />

        {/* Main Content Area - Responsive to sidebar width */}
        <div
          className="h-[98vh] flex flex-col relative bg-gradient-to-b from-white via-white to-white
           dark:from-[#090909] dark:via-[#090909] dark:to-[#090909] rounded-3xl"
          style={{
            marginLeft: `${sidebarWidth}px`,
            transition: "margin-left 300ms ease-out",
          }}
        >
          <ChatNavbar />

          <div className="flex-1 overflow-y-auto relative border rounded-3xl border-zinc-200 dark:border-zinc-800 p-8">
            <div className="w-full h-full max-w-7xl mx-auto space-y-6">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
                  My Knowledge Graphs
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Manage and organize your GraphRAG conversations
                </p>
              </div>

              <div className="flex items-center justify-between mb-6">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Search chats..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:border-amber-400/50"
                  />
                </div>

                <div className="flex items-center gap-3">
                  {/* Create Chat */}
                  <Button
                    onClick={onCreate}
                    className="bg-amber-400 hover:bg-amber-400/90 text-white shadow-lg hover:shadow-amber-400/25 transition-all duration-200"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Chat
                  </Button>

                  {/* Filter Toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      "gap-2",
                      showFilters && "bg-amber-400/10 text-amber-400",
                    )}
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-amber-400/50"
                  >
                    <option value="date">📅 Date</option>
                    <option value="name">🔤 Name</option>
                    <option value="activity">⚡ Activity</option>
                    <option value="size">📊 Size</option>
                  </select>

                  {/* Sort Order */}
                  <button
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                    className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    {sortOrder === "asc" ? (
                      <SortAsc className="h-4 w-4" />
                    ) : (
                      <SortDesc className="h-4 w-4" />
                    )}
                  </button>

                  {/* View Toggle */}
                  <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "p-2 rounded-md transition-colors",
                        viewMode === "grid"
                          ? "bg-white dark:bg-zinc-800 shadow-sm"
                          : "hover:bg-zinc-200 dark:hover:bg-zinc-700",
                      )}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "p-2 rounded-md transition-colors",
                        viewMode === "list"
                          ? "bg-white dark:bg-zinc-800 shadow-sm"
                          : "hover:bg-zinc-200 dark:hover:bg-zinc-700",
                      )}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>

                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {filteredAndSortedChats.length} of {chats?.length || 0}{" "}
                    chats
                  </span>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex gap-6">
                {/* Sidebar Folders */}
                <div className="w-64 space-y-2">
                  <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-4">
                    Folders
                  </h3>

                  {allFolders.map((folder) => (
                    <div
                      key={folder.id}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group",
                        selectedFolder === folder.id
                          ? "bg-amber-400/10 border border-amber-400/20 text-amber-400"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300",
                      )}
                    >
                      <button
                        onClick={() => setSelectedFolder(folder.id)}
                        className="flex items-center gap-3 flex-1 text-left min-w-0"
                      >
                        <folder.icon
                          className={cn("h-4 w-4 flex-shrink-0", folder.color)}
                        />
                        <span className="text-sm font-medium flex-1 truncate">
                          {folder.name}
                        </span>
                        <span className="text-xs text-zinc-400 flex-shrink-0 px-1">
                          {folderCounts[folder.id] || 0}
                        </span>
                      </button>
                      {/* Only show delete button for custom folders */}
                      {!["all", "recent", "uncategorized"].includes(
                        folder.id,
                      ) && (
                        <button
                          onClick={() => promptDeleteFolder(folder.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-all flex-shrink-0"
                          title="Delete Folder"
                        >
                          <Trash className="h-3 w-3 text-red-500" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Create Folder */}
                  {isCreatingFolder ? (
                    <div className="w-full flex items-center gap-2 p-3 rounded-lg border-2 border-amber-400/50 bg-amber-400/5">
                      <FolderPlus className="h-4 w-4 text-amber-400" />
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateFolder();
                          if (e.key === "Escape") {
                            setIsCreatingFolder(false);
                            setNewFolderName("");
                          }
                        }}
                        onBlur={handleCreateFolder}
                        placeholder="Folder name..."
                        className="flex-1 text-sm bg-transparent border-none outline-none text-zinc-900 dark:text-white placeholder-zinc-400"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsCreatingFolder(true)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-amber-400/50 transition-colors text-zinc-500 dark:text-zinc-400 hover:text-amber-400"
                    >
                      <FolderPlus className="h-4 w-4" />
                      <span className="text-sm">New Folder</span>
                    </button>
                  )}
                </div>

                {/* Chat Grid/List */}
                <div className="flex-1">
                  {filteredAndSortedChats.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        {searchQuery ? (
                          <Search className="w-12 h-12 text-zinc-400" />
                        ) : (
                          <MessageSquare className="w-12 h-12 text-zinc-400" />
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                        {searchQuery
                          ? "No chats found"
                          : "No chats in this folder"}
                      </h3>
                      <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                        {searchQuery
                          ? "Try adjusting your search terms or browse all chats"
                          : "Create your first chat to start building your knowledge graph"}
                      </p>
                      {searchQuery ? (
                        <Button
                          onClick={() => setSearchQuery("")}
                          variant="outline"
                          className="border-amber-400/30 text-amber-400 hover:bg-amber-400/10"
                        >
                          Clear Search
                        </Button>
                      ) : (
                        <Button
                          onClick={onCreate}
                          className="bg-amber-400 hover:bg-amber-400/90 text-white"
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Create Chat
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div
                      className={cn(
                        viewMode === "grid"
                          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                          : "space-y-2",
                      )}
                    >
                      {filteredAndSortedChats.map((chat) => (
                        <div
                          key={chat._id}
                          className={cn(
                            "group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:border-amber-400/30 transition-all duration-200 hover:shadow-lg hover:shadow-amber-400/5",
                            viewMode === "list" && "flex items-center",
                            selectedChats.has(chat._id) &&
                              "ring-2 ring-amber-400/20 border-amber-400/30",
                          )}
                        >
                          {viewMode === "grid" ? (
                            // Grid View - Document Card Style
                            <div className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-amber-400/20 to-amber-100 dark:from-amber-400/20 dark:to-zinc-700 rounded-xl flex items-center justify-center">
                                  <MessageSquare className="w-6 h-6 text-amber-400" />
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/${chat._id}/graph`,
                                      )
                                    }
                                    className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                                    title="View Graph"
                                  >
                                    <Eye className="w-3 h-3 text-zinc-500" />
                                  </button>
                                  {selectedFolder !== "archived" && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setChatToMove(chat._id);
                                          setShowMoveModal(true);
                                        }}
                                        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                                        title="Move to Folder"
                                      >
                                        <Folder className="w-3 h-3 text-zinc-500" />
                                      </button>
                                      <button
                                        onClick={() => startEditing(chat)}
                                        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                                        title="Rename"
                                      >
                                        <Edit3 className="w-3 h-3 text-zinc-500" />
                                      </button>
                                    </>
                                  )}
                                  {selectedFolder === "archived" ? (
                                    // Archived chat actions
                                    <>
                                      <button
                                        onClick={() => handleRestoreChat(chat)}
                                        className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors"
                                        title="Restore Chat"
                                      >
                                        <RotateCcw className="w-3 h-3 text-green-500" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handlePermanentDelete(chat)
                                        }
                                        className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                                        title="Delete Permanently"
                                      >
                                        <Trash className="w-3 h-3 text-red-500" />
                                      </button>
                                    </>
                                  ) : (
                                    // Active chat actions
                                    <button
                                      onClick={() => onDelete(chat)}
                                      className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                                      title="Archive"
                                    >
                                      <Archive className="w-3 h-3 text-orange-500" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div
                                className={
                                  selectedFolder === "archived"
                                    ? "cursor-default opacity-60"
                                    : "cursor-pointer"
                                }
                                onClick={() => {
                                  if (selectedFolder !== "archived") {
                                    router.push(`/dashboard/${chat._id}`);
                                  }
                                }}
                              >
                                {editingChatId === chat._id ? (
                                  <Input
                                    value={editingTitle}
                                    onChange={(e) =>
                                      setEditingTitle(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        finishEditing(chat._id);
                                      if (e.key === "Escape")
                                        setEditingChatId(null);
                                    }}
                                    onBlur={() => finishEditing(chat._id)}
                                    className="text-sm font-semibold mb-4"
                                    autoFocus
                                  />
                                ) : (
                                  <h4 className="font-semibold text-zinc-900 dark:text-white group-hover:text-amber-400 transition-colors truncate mb-4">
                                    {chat.title}
                                  </h4>
                                )}

                                <div className="space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    <span>
                                      {chat.context?.length || 0} documents
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      {new Date(
                                        chat._creationTime,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      {chat.visibility === "public" ? (
                                        <>
                                          <Globe className="w-4 h-4 text-green-500" />
                                          <span className="text-green-600 dark:text-green-400">
                                            Public
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <Lock className="w-4 h-4" />
                                          <span>Private</span>
                                        </>
                                      )}
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleFavorite(chat._id);
                                      }}
                                      className="transition-colors"
                                    >
                                      {chat.isFavorited ? (
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 hover:text-yellow-600" />
                                      ) : (
                                        <Star className="w-4 h-4 text-zinc-300 hover:text-yellow-500" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            // List View - Table Style
                            <div className="flex items-center gap-4 p-4">
                              <div
                                className={`flex items-center gap-4 flex-1 ${selectedFolder === "archived" ? "cursor-default opacity-60" : "cursor-pointer"}`}
                                onClick={() => {
                                  if (selectedFolder !== "archived") {
                                    router.push(`/dashboard/${chat._id}`);
                                  }
                                }}
                              >
                                <div className="w-10 h-10 bg-gradient-to-br from-amber-400/20 to-amber-100 dark:from-amber-400/20 dark:to-zinc-700 rounded-xl flex items-center justify-center flex-shrink-0">
                                  <MessageSquare className="w-5 h-5 text-amber-400" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  {editingChatId === chat._id ? (
                                    <Input
                                      value={editingTitle}
                                      onChange={(e) =>
                                        setEditingTitle(e.target.value)
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter")
                                          finishEditing(chat._id);
                                        if (e.key === "Escape")
                                          setEditingChatId(null);
                                      }}
                                      onBlur={() => finishEditing(chat._id)}
                                      className="text-sm font-semibold"
                                      autoFocus
                                    />
                                  ) : (
                                    <h4 className="font-semibold text-zinc-900 dark:text-white group-hover:text-amber-400 transition-colors truncate">
                                      {chat.title}
                                    </h4>
                                  )}
                                </div>

                                <div className="flex items-center gap-6 text-sm text-zinc-500 dark:text-zinc-400">
                                  <div className="flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    <span>
                                      {chat.context?.length || 0} docs
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      {new Date(
                                        chat._creationTime,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {chat.visibility === "public" ? (
                                      <Globe className="w-3 h-3 text-green-500" />
                                    ) : (
                                      <Lock className="w-3 h-3" />
                                    )}
                                    <span>{chat.visibility}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {selectedFolder !== "archived" && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleFavorite(chat._id);
                                      }}
                                      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                                      title={
                                        chat.isFavorited
                                          ? "Unfavorite"
                                          : "Favorite"
                                      }
                                    >
                                      {chat.isFavorited ? (
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 hover:text-yellow-600" />
                                      ) : (
                                        <Star className="w-4 h-4 text-zinc-300 hover:text-yellow-500" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() =>
                                        router.push(
                                          `/dashboard/${chat._id}/graph`,
                                        )
                                      }
                                      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                                      title="View Graph"
                                    >
                                      <Eye className="w-4 h-4 text-zinc-500" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setChatToMove(chat._id);
                                        setShowMoveModal(true);
                                      }}
                                      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                                      title="Move to Folder"
                                    >
                                      <Folder className="w-4 h-4 text-zinc-500" />
                                    </button>
                                    <button
                                      onClick={() => startEditing(chat)}
                                      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                                      title="Rename"
                                    >
                                      <Edit3 className="w-4 h-4 text-zinc-500" />
                                    </button>
                                  </>
                                )}
                                {selectedFolder === "archived" ? (
                                  // Archived chat actions
                                  <>
                                    <button
                                      onClick={() => handleRestoreChat(chat)}
                                      className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors"
                                      title="Restore Chat"
                                    >
                                      <RotateCcw className="w-4 h-4 text-green-500" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handlePermanentDelete(chat)
                                      }
                                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                                      title="Delete Permanently"
                                    >
                                      <Trash className="w-4 h-4 text-red-500" />
                                    </button>
                                  </>
                                ) : (
                                  // Active chat actions
                                  <button
                                    onClick={() => onDelete(chat)}
                                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                                    title="Archive"
                                  >
                                    <Archive className="w-4 h-4 text-orange-500" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Footer */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                  <div className="text-2xl font-bold text-amber-400 mb-2">
                    {chats?.length || 0}
                  </div>
                  <div className="text-zinc-600 dark:text-zinc-400">
                    Total Chats
                  </div>
                </div>
                <div className="text-center p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                  <div className="text-2xl font-bold text-amber-400 mb-2">
                    {chats?.reduce(
                      (total, chat) => total + (chat.context?.length || 0),
                      0,
                    ) || 0}
                  </div>
                  <div className="text-zinc-600 dark:text-zinc-400">
                    Documents
                  </div>
                </div>
                <div className="text-center p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                  <div className="text-2xl font-bold text-amber-400 mb-2">
                    {chats?.filter((chat) => chat.visibility === "public")
                      .length || 0}
                  </div>
                  <div className="text-zinc-600 dark:text-zinc-400">
                    Public APIs
                  </div>
                </div>
                <div className="text-center p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                  <div className="text-2xl font-bold text-amber-400 mb-2">
                    {Math.round(((chats?.length || 0) / 100) * 100) || 0}%
                  </div>
                  <div className="text-zinc-600 dark:text-zinc-400">
                    Knowledge Built
                  </div>
                </div>
              </div>
            </div>

            {/* Move to Folder Modal */}
            {showMoveModal && chatToMove && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl w-full max-w-md">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                      Move Chat to Folder
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      <button
                        onClick={() =>
                          handleMoveToFolder(
                            chatToMove as Id<"chats">,
                            undefined,
                          )
                        }
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-left"
                      >
                        <Folder className="h-4 w-4 text-zinc-500" />
                        <span className="text-sm">Uncategorized</span>
                      </button>
                      {userFolders?.map((folder) => (
                        <button
                          key={folder._id}
                          onClick={() =>
                            handleMoveToFolder(
                              chatToMove as Id<"chats">,
                              folder._id,
                            )
                          }
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-left"
                        >
                          <Folder className="h-4 w-4 text-amber-500" />
                          <span className="text-sm">{folder.name}</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-6">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowMoveModal(false);
                          setChatToMove(null);
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Folder Modal */}
            {showDeleteFolderModal && folderToDelete && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl w-full max-w-md">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                        <Trash className="w-6 h-6 text-red-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                          Delete Folder
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {
                            userFolders?.find((f) => f._id === folderToDelete)
                              ?.name
                          }
                        </p>
                      </div>
                    </div>

                    {folderChatCount > 0 ? (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white text-xs font-bold">
                              !
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                              This folder contains {folderChatCount} chat
                              {folderChatCount !== 1 ? "s" : ""}
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                              What would you like to do with the chats in this
                              folder?
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                        This folder is empty and can be safely deleted.
                      </p>
                    )}

                    <div className="flex flex-col gap-3">
                      {folderChatCount > 0 && (
                        <Button
                          onClick={() =>
                            handleDeleteFolder(folderToDelete, true)
                          }
                          className="bg-red-500 hover:bg-red-600 text-white w-full"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete Folder & All Chats ({folderChatCount})
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleDeleteFolder(folderToDelete, false)
                        }
                        className="w-full"
                      >
                        {folderChatCount > 0
                          ? "Delete Folder Only (Move Chats to Uncategorized)"
                          : "Delete Empty Folder"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDeleteFolderModal(false);
                          setFolderToDelete(null);
                        }}
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chat Delete Dialog */}
            <ChatDeleteDialog
              isOpen={deleteDialogOpen}
              onClose={() => {
                setDeleteDialogOpen(false);
                setChatToDelete(null);
              }}
              onConfirm={handleConfirmDelete}
              chatTitle={chatToDelete?.title || ""}
              isPermanentDelete={isPermanentDelete}
              isLoading={isDeleting}
              subchatCount={0} // TODO: Calculate subchat count if needed
            />
          </div>
        </div>
      </div>
    </>
  );
}
