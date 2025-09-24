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
import { Lock, Globe, Edit3, Network, Settings, Crown, Sparkles } from "lucide-react";
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
import { getStripe } from "@/lib/stripe";

interface ChatNavbarProps {
  chatId: Id<"chats">;
  onGraphToggle?: () => void;
  isGraphOpen?: boolean;
  reasoningContextCount?: number;
  onApiSettingsToggle?: () => void;
}

export const ChatNavbar = ({
  chatId,
  onGraphToggle,
  isGraphOpen,
  reasoningContextCount,
  onApiSettingsToggle,
}: ChatNavbarProps) => {
  const router = useRouter();
  const currentChat = useQuery(api.chats.getChatById, {
    id: chatId,
  });
  const [editingTitle, setEditingTitle] = React.useState("");
  const [editingChatId, setEditingChatId] = React.useState<Id<"chats"> | null>(
    null,
  );
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = React.useState(false);
  const [isUpgrading, setIsUpgrading] = React.useState(false);

  // Get subscription status to show/hide upgrade CTA
  const subscription = useQuery(api.subscriptions.getUserSubscription);
  const credits = useQuery(api.subscriptions.getUserCredits);
  const renameChat = useMutation(api.chats.rename);

  const finishEditing = async (chatId: Id<"chats">) => {
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

  const handleUpgrade = async () => {
    setIsUpgrading(true);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
          mode: 'subscription'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId, url } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        const stripe = await getStripe();
        await stripe?.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      toast.error('Failed to start checkout process');
    } finally {
      setIsUpgrading(false);
    }
  };

  async function handleVisibilityChange(selectedValue: string): Promise<void> {
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

  return (
    <div className="flex items-center justify-between w-full h-12 px-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50">
      <div className="flex items-center gap-4">
        <Dialog>
          <DialogTrigger>
            <div className="flex items-center gap-2 group cursor-pointer">
              <Edit3 className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-400 transition-colors" />
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-white group-hover:text-amber-400 transition-colors">
                {currentChat?.title}
              </h1>
            </div>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
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

      <div className="flex items-center gap-3">
        {/* Upgrade CTA - Only show for free users */}
        {subscription?.tier === 'free' && (
          <Button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            size="sm"
            className="h-8 px-3 gap-2 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-400/90 hover:to-amber-600/90 text-white shadow-lg hover:shadow-amber-400/25 transition-all duration-300"
          >
            {isUpgrading ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="hidden sm:inline">Processing...</span>
              </>
            ) : (
              <>
                <Crown className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Upgrade Pro</span>
                <span className="sm:hidden">Pro</span>
              </>
            )}
          </Button>
        )}

        {/* Credit Counter - Show for paid users */}
        {subscription?.tier !== 'free' && credits && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {(credits.remainingCredits || 0).toFixed(1)} credits
            </span>
          </div>
        )}

        {/* Settings Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onApiSettingsToggle}
          className="h-8 px-3 gap-2 transition-colors text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-amber-400"
          title={subscription?.tier === 'free' ? "Chat Settings & API Access (Pro Feature)" : "Chat Settings & API Access"}
        >
          <Settings className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">API Settings</span>
        </Button>

        {/* Graph Toggle Button */}
        {onGraphToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onGraphToggle}
            className={cn(
              "h-8 px-3 gap-2 transition-colors text-sm relative",
              isGraphOpen
                ? "bg-amber-400/10 text-amber-400 border-amber-400/20 border"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
            )}
          >
            <Network className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Graph</span>
            {reasoningContextCount && reasoningContextCount > 0 && (
              <div
                className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"
                title={`${reasoningContextCount} reasoning nodes available`}
              />
            )}
          </Button>
        )}

        <Select onValueChange={handleVisibilityChange}>
          <SelectTrigger className="w-[120px] h-8 text-sm border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-amber-400/50 transition-colors">
            <SelectValue
              placeholder={
                currentChat?.visibility === "public" ? "Public" : "Private"
              }
            />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
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

        <Badge
          className={cn(
            "border font-medium",
            currentChat?.visibility === "public"
              ? "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400"
              : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
          )}
          variant="outline"
        >
          {currentChat?.visibility}
        </Badge>

        <ThemeSwitcher />
      </div>
    </div>
  );
};
