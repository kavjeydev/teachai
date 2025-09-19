"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";
import { PlusCircle, Sparkles } from "lucide-react";
import { MinimalSidebar } from "../../components/minimal-sidebar";
import { useToast } from "@/hooks/use-toast";

export default function NoChat() {
  const { user } = useUser();
  const { toast } = useToast();

  const addChat = useMutation(api.chats.createChat);

  const onCreate = () => {
    const promise = addChat({ title: "untitled" });

    toast({
      title: "Created chat!",
    });
  };

  if (!user || user === undefined) {
    return <div></div>;
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <SidebarProvider className="h-full w-full">
        <SidebarTrigger className="fixed top-4 left-4 z-50 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 shadow-lg backdrop-blur-sm transition-all duration-200" />

        {/* Fixed Sidebar */}
        <div className="fixed left-0 top-0 h-full z-40">
          <MinimalSidebar />
        </div>

        {/* Main Content Area */}
        <div className="ml-72 h-screen flex items-center justify-center">
          <div className="flex flex-col gap-8 items-center max-w-lg mx-auto text-center p-8">
            <div className="w-24 h-24 bg-gradient-to-br from-trainlymainlight to-purple-600 rounded-3xl flex items-center justify-center shadow-lg shadow-trainlymainlight/20">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Ready to build something amazing?
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Create your first GraphRAG chat and start building AI that you
                can actually trust. Upload documents, ask questions, and watch
                your knowledge graph come to life.
              </p>
              <Button
                onClick={onCreate}
                className="bg-trainlymainlight hover:bg-trainlymainlight/90 text-white px-8 py-4 text-lg rounded-xl font-semibold shadow-xl hover:shadow-2xl hover:shadow-trainlymainlight/25 transition-all duration-300 flex items-center gap-3 mx-auto"
              >
                <PlusCircle className="h-5 w-5" />
                Create Your First Chat
              </Button>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
