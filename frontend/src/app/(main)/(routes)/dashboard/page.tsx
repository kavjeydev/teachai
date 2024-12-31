"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "../../components/sidebar";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";
import { PlusCircle } from "lucide-react";
import { DashSidebar } from "../../components/dash-sidebar";

export default function NoChat() {
  const { user } = useUser();

  const addChat = useMutation(api.chats.createChat);

  const onCreate = () => {
    const promise = addChat({ title: "untitled" });

    console.log("HERE");

    toast.success("Created chat");
  };
  if (!user || user === undefined) {
    return <div></div>;
  }
  return (
    <SidebarProvider>
      <SidebarTrigger />

      <DashSidebar />
      <div className="h-screen w-full flex items-center justify-center">
        <div className="flex flex-col gap-6 items-center">
          <div>
            <img src="/chatting-33.svg" height={400} width={400} />
          </div>
          <div>
            <Button onClick={onCreate} className="flex gap-1 items-center">
              <PlusCircle className="h-4 w-4" />
              Create chat
            </Button>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
