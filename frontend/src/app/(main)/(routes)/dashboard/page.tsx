"use client";

import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";
import { PlusCircle, Sparkles } from "lucide-react";
import { ResizableSidebar } from "../../components/resizable-sidebar";
import { useSidebarWidth } from "@/hooks/use-sidebar-width";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "sonner";
import { useState } from "react";
import { useConvexAuth } from "@/hooks/use-auth-state";

export default function NoChat() {
  const { user } = useUser();
  const { toast } = useToast();
  const { sidebarWidth } = useSidebarWidth();
  const [isCreating, setIsCreating] = useState(false);
  const { canQuery } = useConvexAuth();

  const addChat = useMutation(api.chats.createChat);

  const onCreate = async () => {
    if (!canQuery) {
      toast({
        title: "Please wait",
        description: "Authentication is still loading",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const promise = addChat({ title: "untitled" });

      toast({
        title: "Created chat!",
      });

      await promise;
    } catch (error) {
      console.error("Failed to create chat:", error);
      toast({
        title: "Failed to create chat",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (!user || user === undefined) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Toaster position="top-center" richColors />

      {/* Resizable Sidebar */}
      <ResizableSidebar />

      {/* Main Content Area - Responsive to sidebar width */}
      <div
        className="h-screen flex items-center justify-center"
        style={{
          marginLeft: `${sidebarWidth}px`,
          transition: "margin-left 300ms ease-out",
        }}
      >
        <div className="flex flex-col gap-8 items-center max-w-lg mx-auto text-center p-8">
          <div className="w-24 h-24 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-3xl flex items-center justify-center shadow-lg shadow-trainlymainlight/20">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Ready to build something amazing?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              Upload documents, ask questions, and watch your knowledge graph
              come to life.
            </p>
            <Button
              onClick={onCreate}
              disabled={isCreating}
              className="bg-trainlymainlight hover:bg-trainlymainlight/90 disabled:bg-trainlymainlight/50 disabled:cursor-not-allowed text-white px-8 py-4 text-lg rounded-xl font-semibold shadow-xl hover:shadow-2xl hover:shadow-trainlymainlight/25 transition-all duration-300 flex items-center gap-3 mx-auto"
            >
              {isCreating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Chat...
                </>
              ) : (
                <>
                  <PlusCircle className="h-5 w-5" />
                  Create Your First Chat
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
