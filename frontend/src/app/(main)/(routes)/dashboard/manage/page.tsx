"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { captureEvent } from "@/lib/posthog";
import { useOptimizedNavigation } from "@/hooks/use-optimized-navigation";
import { useOrganization } from "@/components/organization-provider";
import { OrganizationRequired } from "@/components/organization-required";
import { CreateChatWizard } from "@/components/create-chat-wizard";
import dynamic from "next/dynamic";
import { MessageSquare, Clock, Folder, Archive } from "lucide-react";

// Import new components
import { ManagePageHeader } from "@/components/manage-chats/manage-page-header";
import { ChatsContent } from "@/components/manage-chats/chats-content";
import { LoadingState } from "@/components/manage-chats/loading-state";
import { MoveToFolderModal } from "@/components/manage-chats/move-to-folder-modal";
import { DeleteFolderModal } from "@/components/manage-chats/delete-folder-modal";

// Dynamically import heavy components
const ChatDeleteDialog = dynamic(
  () =>
    import("@/components/chat-delete-dialog").then((mod) => ({
      default: mod.ChatDeleteDialog,
    })),
  {
    ssr: false,
  },
);

export default function ChatManagementPage() {
  const { user } = useUser();
  const router = useRouter();
  const { navigate } = useOptimizedNavigation();
  const { currentOrganizationId, organizations } = useOrganization();

  const chats = useQuery(
    api.chats.getChats,
    currentOrganizationId ? { organizationId: currentOrganizationId } : "skip",
  );
  const archivedChats = useQuery(
    api.chats.getArchivedChats,
    currentOrganizationId ? { organizationId: currentOrganizationId } : "skip",
  );
  const chatLimits = useQuery(
    api.chats.getUserChatLimits,
    currentOrganizationId ? { organizationId: currentOrganizationId } : "skip",
  );
  const userFolders = useQuery(
    api.chats.getFolders,
    currentOrganizationId ? { organizationId: currentOrganizationId } : "skip",
  );
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
  const [showCreateWizard, setShowCreateWizard] = useState(false);

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

  const onCreate = () => {
    if (!currentOrganizationId) {
      toast.error("Please select an organization first");
      return;
    }

    // Check if user can create more chats
    if (chatLimits && !chatLimits.canCreateMore) {
      toast.error(
        `You've reached your chat limit of ${chatLimits.chatLimit} chat${chatLimits.chatLimit > 1 ? "s" : ""} for the ${chatLimits.tierName} plan. Please upgrade your plan or archive existing chats to create new ones.`,
      );
      return;
    }

    setShowCreateWizard(true);
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
      const oldTitle =
        (selectedFolder === "archived" ? archivedChats : chats)?.find(
          (c) => c._id === chatId,
        )?.title || "untitled";
      renameChat({ id: chatId, title: editingTitle });

      // Track chat renaming in PostHog
      captureEvent("chat_renamed", {
        chatId: chatId,
        oldTitle: oldTitle,
        newTitle: editingTitle,
        source: "manage_page",
      });

      toast.success("Chat renamed!");
    }
    setEditingChatId(null);
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      try {
        if (!currentOrganizationId) {
          toast.error("Please select an organization first");
          return;
        }
        await createFolder({
          name: newFolderName.trim(),
          organizationId: currentOrganizationId,
        });

        // Track folder creation in PostHog
        captureEvent("folder_created", {
          folderName: newFolderName.trim(),
        });

        toast.success("Folder created!");
        setNewFolderName("");
        setIsCreatingFolder(false);
      } catch (error) {
        toast.error("Failed to create folder");
      }
    }
  };

  const handleToggleFavorite = async (chatId: Id<"chats">) => {
    try {
      const newStatus = await toggleFavorite({ chatId });

      // Track favorite toggle in PostHog
      captureEvent("chat_favorite_toggled", {
        chatId: chatId,
        isFavorited: newStatus,
      });

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

      // Track chat moved to folder in PostHog
      captureEvent("chat_moved_to_folder", {
        chatId: chatId,
        folderId: folderId || "uncategorized",
        folderName: folderName,
      });

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
      // Track folder deletion in PostHog
      captureEvent("folder_deleted", {
        folderId: folderId,
        deleteChats: deleteChats,
        chatsDeleted: result.deletedChats || 0,
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

      // Track chat restoration in PostHog
      captureEvent("chat_restored", {
        chatId: chat._id,
        chatTitle: chat.title,
      });

      toast.success(`"${chat.title}" restored successfully!`);
    } catch (error: any) {
      console.error("Failed to restore chat:", error);

      // Show specific error message with upgrade option if it's a limit error
      if (error.message && error.message.includes("Chat limit reached")) {
        toast.error("Chat limit reached", {
          description: "Archive chats or upgrade to restore.",
          duration: 8000,
          action: {
            label: "View Plans",
            onClick: () => window.open("/pricing", "_blank"),
          },
        });
      } else {
        toast.error("Failed to restore chat");
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

          const neo4jResponse = await fetch(cleanupUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!neo4jResponse.ok) {
            console.error(`❌ Neo4j cleanup failed: ${neo4jResponse.status}`);
            const errorText = await neo4jResponse.text();
            console.error(`❌ Error response: ${errorText}`);
            // Don't fail the whole operation if Neo4j cleanup fails
          }
        } catch (neo4jError) {
          console.error(`💥 Error calling Neo4j cleanup:`, neo4jError);
          // Don't fail the whole operation if Neo4j cleanup fails
        }

        // Track permanent deletion in PostHog
        captureEvent("chat_permanently_deleted", {
          chatId: chatToDelete._id,
          chatTitle: chatToDelete.title,
          childChatsDeleted: result.childChatIds?.length || 0,
        });

        toast.success(`"${chatToDelete.title}" permanently deleted.`);
      } else {
        await archiveChat({ id: chatToDelete._id });

        // Track chat archiving in PostHog
        captureEvent("chat_archived", {
          chatId: chatToDelete._id,
          chatTitle: chatToDelete.title,
          source: "manage_page",
        });

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

  const currentOrg = organizations?.find(
    (org) => org._id === currentOrganizationId,
  );

  const handleNavigate = (chatId: Id<"chats">) => {
    navigate(`/dashboard/${chatId}`);
  };

  return (
    <OrganizationRequired>
      <div className="flex-1 overflow-y-auto relative border rounded-3xl border-zinc-200 dark:border-zinc-800 p-8">
        <div className="w-full h-full max-w-7xl mx-auto space-y-6">
          <ManagePageHeader organizationName={currentOrg?.name} />

          <Suspense fallback={<LoadingState />}>
            <ChatsContent
              chats={chats}
              archivedChats={archivedChats}
              selectedFolder={selectedFolder}
              searchQuery={searchQuery}
              sortBy={sortBy}
              sortOrder={sortOrder}
              editingChatId={editingChatId}
              editingTitle={editingTitle}
              onSearchChange={setSearchQuery}
              onEditTitle={setEditingTitle}
              onStartEditing={startEditing}
              onFinishEditing={finishEditing}
              onCancelEditing={() => setEditingChatId(null)}
              onArchive={onDelete}
              onRestore={handleRestoreChat}
              onPermanentDelete={handlePermanentDelete}
              onNavigate={handleNavigate}
              onCreateClick={onCreate}
            />
          </Suspense>

          {/* Move to Folder Modal */}
          <MoveToFolderModal
            isOpen={showMoveModal}
            chatToMove={chatToMove}
            folders={userFolders}
            onMove={handleMoveToFolder}
            onClose={() => {
              setShowMoveModal(false);
              setChatToMove(null);
            }}
          />

          {/* Delete Folder Modal */}
          <DeleteFolderModal
            isOpen={showDeleteFolderModal}
            folderToDelete={folderToDelete}
            folderChatCount={folderChatCount}
            folders={userFolders}
            onDelete={handleDeleteFolder}
            onClose={() => {
              setShowDeleteFolderModal(false);
              setFolderToDelete(null);
            }}
          />

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

          {/* Create Chat Wizard */}
          {currentOrganizationId && (
            <CreateChatWizard
              isOpen={showCreateWizard}
              onClose={() => setShowCreateWizard(false)}
              organizationId={currentOrganizationId}
            />
          )}
        </div>
      </div>
    </OrganizationRequired>
  );
}
