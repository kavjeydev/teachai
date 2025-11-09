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
import {
  Lock,
  Globe,
  Edit3,
  Network,
  Settings,
  Crown,
  Sparkles,
  ChevronDown,
  MessageSquare,
  Clock,
  Search,
  ChevronsUpDown,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Id } from "../../../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import React from "react";
import { Badge } from "@/components/ui/badge";
import ThemeSwitcher from "./theme-switcher";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { getStripe, PRICING_TIERS } from "@/lib/stripe";
import { NavbarPublishStatus } from "@/components/navbar-publish-status";
import { StorageUsageIndicator } from "@/components/storage-usage-indicator";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ChatNavbarProps {
  chatId?: Id<"chats">;
}

export const ChatNavbar = ({ chatId }: ChatNavbarProps) => {
  const router = useRouter();
  const currentChat = useQuery(
    api.chats.getChatById,
    chatId ? { id: chatId } : "skip",
  );
  const allChats = useQuery(api.chats.getChats);
  const [editingTitle, setEditingTitle] = React.useState("");
  const [editingChatId, setEditingChatId] = React.useState<Id<"chats"> | null>(
    null,
  );
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = React.useState(false);
  const [isUpgrading, setIsUpgrading] = React.useState(false);
  const [chatSelectorOpen, setChatSelectorOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Get subscription status to show/hide upgrade CTA
  const subscription = useQuery(api.subscriptions.getUserSubscription);
  const credits = useQuery(api.subscriptions.getUserCredits);
  const userApps = useQuery(
    api.app_management.getAppsForChat,
    chatId ? { chatId } : "skip",
  );
  const renameChat = useMutation(api.chats.rename);
  const initializeCredits = useMutation(
    api.subscriptions.initializeUserCredits,
  );

  // Auto-initialize credits on component mount for free users
  React.useEffect(() => {
    if (subscription?.tier === "free") {
      // Initialize credits for free users to ensure they have a database record
      initializeCredits({}).catch(console.error);
    }
  }, [subscription, initializeCredits]);

  const finishEditing = async (chatId: Id<"chats"> | undefined) => {
    if (!chatId) return;

    setIsRenaming(true);
    try {
      await renameChat({ id: chatId, title: editingTitle });
      setEditingChatId(null);
      toast.success("Chat renamed successfully!");
    } catch (error) {
      toast.error("Failed to rename chat");
    } finally {
      setIsRenaming(false);
    }
  };
  const updateVisibility = useMutation(api.chats.changeChatVisibility);

  const handleUpgrade = async (priceId: string, tierName: string) => {
    if (!priceId) {
      toast.error(
        `${tierName} plan is not configured. Please contact support at kavin11205@gmail.com.`,
      );
      return;
    }

    setIsUpgrading(true);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: priceId,
          mode: "subscription",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { sessionId, url } = await response.json();

      if (url) {
        window.open(url, "_blank");
      } else {
        const stripe = await getStripe();
        await stripe?.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error("Checkout failed:", error);
      toast.error("Failed to start checkout process");
    } finally {
      setIsUpgrading(false);
    }
  };

  async function handleVisibilityChange(selectedValue: string): Promise<void> {
    if (!chatId) return;

    setIsUpdatingVisibility(true);
    try {
      await updateVisibility({
        id: chatId,
        visibility: selectedValue,
      });
      toast.success("Visibility updated successfully!");
    } catch (error) {
      toast.error("Failed to update visibility.");
    } finally {
      setIsUpdatingVisibility(false);
    }
  }

  // Sort chats by recent activity
  const sortedChats = React.useMemo(() => {
    if (!allChats) return [];
    return [...allChats].sort(
      (a, b) =>
        new Date(b._creationTime).getTime() -
        new Date(a._creationTime).getTime(),
    );
  }, [allChats]);

  // Filter chats based on search query
  const filteredChats = React.useMemo(() => {
    if (!searchQuery) return sortedChats;
    const query = searchQuery.toLowerCase();
    return sortedChats.filter((chat) =>
      chat.title.toLowerCase().includes(query),
    );
  }, [sortedChats, searchQuery]);

  const handleChatSelect = (selectedChatId: string) => {
    if (selectedChatId !== chatId) {
      // Navigate to testing view of the selected chat
      router.push(`/dashboard/${selectedChatId}/testing`);
      setChatSelectorOpen(false);
      setSearchQuery("");
      toast.success("Switched chat");
    }
  };

  // Clear search when popover closes
  React.useEffect(() => {
    if (!chatSelectorOpen) {
      setSearchQuery("");
    }
  }, [chatSelectorOpen]);

  return (
    <div className="flex items-center justify-between w-full h-16 px-4 bg-white/80 dark:bg-[#090909] backdrop-blur-xl">
      <div className="flex items-center gap-2">
        {/* Chat Selector Dropdown */}
        <Popover open={chatSelectorOpen} onOpenChange={setChatSelectorOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-2 px-2 py-1 rounded-lg transition-all duration-200 group",
                !chatId
                  ? "cursor-default"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
              )}
            >
              <div className="flex flex-col items-start">
                <h1
                  className={cn(
                    "text-sm font-semibold max-w-[200px] truncate transition-colors",
                    !chatId
                      ? "text-zinc-400 dark:text-zinc-500"
                      : "text-zinc-900 dark:text-white group-hover:text-amber-400",
                  )}
                >
                  {!chatId
                    ? "No chat selected"
                    : currentChat?.title || "Loading..."}
                </h1>
              </div>
              <ChevronsUpDown
                className={cn(
                  "w-4 h-4 transition-colors",
                  !chatId
                    ? "text-zinc-300 dark:text-zinc-600"
                    : "text-zinc-400 group-hover:text-amber-400",
                )}
              />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[400px] p-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-xl"
            align="start"
          >
            <Command className="rounded-lg">
              <div className="flex items-center border-b border-zinc-200 dark:border-zinc-700 px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 text-zinc-500" />
                <input
                  placeholder="Search chats..."
                  className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <CommandList className="max-h-[300px] overflow-y-auto">
                {filteredChats.length === 0 ? (
                  <div className="py-6 text-center text-sm text-zinc-500">
                    No chats found.
                  </div>
                ) : (
                  <CommandGroup>
                    {filteredChats.map((chat) => (
                      <CommandItem
                        key={chat._id}
                        value={chat._id}
                        onSelect={() => handleChatSelect(chat._id)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-md mx-1 my-0.5",
                          chat._id === chatId &&
                            "bg-amber-400/10 border border-amber-400/20",
                        )}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0",
                            chat._id === chatId
                              ? "bg-amber-400 text-white"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
                          )}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={cn(
                              "text-sm font-medium truncate",
                              chat._id === chatId
                                ? "text-amber-400"
                                : "text-zinc-900 dark:text-white",
                            )}
                          >
                            {chat.title}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {chat.context?.length || 0} docs •{" "}
                            {new Date(chat._creationTime).toLocaleDateString()}
                          </div>
                        </div>
                        {chat._id === chatId && (
                          <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"></div>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Divider */}
        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700"></div>

        {/* Rename Chat Dialog (Separate button) */}
        <Dialog>
          <DialogTrigger asChild>
            <button
              className={cn(
                "p-2 rounded-md transition-colors",
                !chatId
                  ? "cursor-not-allowed opacity-40"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
              )}
              title={!chatId ? "No chat selected" : "Rename chat"}
              disabled={!chatId}
            >
              <Edit3
                className={cn(
                  "w-3.5 h-3.5 transition-colors",
                  !chatId
                    ? "text-zinc-300 dark:text-zinc-600"
                    : "text-zinc-400 hover:text-amber-400",
                )}
              />
            </button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
            <DialogHeader>
              <DialogTitle className="text-zinc-900 dark:text-white">
                Rename Chat
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="name"
                  className="text-right text-zinc-700 dark:text-zinc-300"
                >
                  Chat Name
                </Label>
                <Input
                  className="col-span-3 border-zinc-200 dark:border-zinc-700 focus:border-amber-400 dark:focus:border-amber-400"
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
              <DialogClose asChild>
                <Button
                  className="bg-amber-400 hover:bg-amber-400/90 disabled:bg-amber-400/50 disabled:cursor-not-allowed text-white"
                  disabled={isRenaming}
                  onClick={() => finishEditing(chatId)}
                >
                  {isRenaming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        {/* Upgrade CTA - Only show for free users */}
        {subscription?.tier === "free" && (
          <Button
            onClick={() => router.push("/upgrade")}
            size="sm"
            className="h-8 px-3 gap-2 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-400/90 hover:to-amber-600/90 text-white shadow-lg hover:shadow-amber-400/25 transition-all duration-300"
          >
            <Crown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Upgrade</span>
            <span className="sm:hidden">Pro</span>
          </Button>
        )}

        <div
          className="text-sm text-black dark:text-white cursor-pointer font-bold hover:text-amber-400 transition-all duration-300
          hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg px-2 py-1"
          onClick={() => window.open("https://docs.trainlyai.com", "_blank")}
        >
          Documentation
        </div>

        {/* Credit Counter & Storage Usage - Show for all users */}
        {credits && (
          <div className="hidden sm:flex items-center gap-1.5">
            {/* Credits */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {(credits.remainingCredits || 0).toFixed(1)}
              </span>
            </div>

            {/* Storage Usage */}
            <StorageUsageIndicator compact />
          </div>
        )}

        {/* Publish Status - Show for paid users with selected chat */}
        {chatId && subscription?.tier !== "free" && (
          <NavbarPublishStatus
            chatId={chatId}
            hasUnpublishedChanges={currentChat?.hasUnpublishedChanges}
            publishedAt={currentChat?.publishedSettings?.publishedAt}
            hasApps={userApps ? userApps.length > 0 : false}
            onPublish={() => {
              // Trigger refresh of chat data if needed
            }}
            onRollback={() => {
              // Trigger refresh of chat data if needed
            }}
          />
        )}

        <Select onValueChange={handleVisibilityChange} disabled={!chatId}>
          <SelectTrigger
            className={cn(
              "w-[120px] h-8 text-sm border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 transition-colors",
              !chatId
                ? "opacity-40 cursor-not-allowed"
                : "hover:border-amber-400/50",
            )}
          >
            <SelectValue
              placeholder={
                !chatId
                  ? "No chat"
                  : currentChat?.visibility === "public"
                    ? "Public"
                    : "Private"
              }
            />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
            <SelectGroup>
              <SelectItem
                value="private"
                className="hover:bg-zinc-50 dark:hover:bg-zinc-700"
              >
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-zinc-500" />
                  <span>Private</span>
                </div>
              </SelectItem>
              <SelectItem
                value="public"
                className="hover:bg-zinc-50 dark:hover:bg-zinc-700"
              >
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-green-500" />
                  <span>Public</span>
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {chatId && (
          <Badge
            className={cn(
              "border font-medium",
              currentChat?.visibility === "public"
                ? "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400"
                : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700",
            )}
            variant="outline"
          >
            {currentChat?.visibility}
          </Badge>
        )}

        <ThemeSwitcher />
      </div>
    </div>
  );
};
