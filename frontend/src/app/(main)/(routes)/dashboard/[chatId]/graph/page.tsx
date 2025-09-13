"use client";

import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "next-themes";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import { AppSidebar } from "@/app/(main)/components/sidebar";
import React from "react";
import { useUser } from "@clerk/clerk-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatNavbar } from "@/app/(main)/components/chat-navbar";
import GraphVisualizationNVL from "@/components/GraphVisualizationNVL";
import { Toaster } from "sonner";

interface GraphPageProps {
  params: Promise<{
    chatId: Id<"chats">;
  }>;
}

export default function GraphPage({ params }: GraphPageProps) {
  const { user } = useUser();
  const unwrappedParams = React.use(params);
  const chatId = unwrappedParams.chatId;
  const [open, setOpen] = React.useState(false);

  // Show loading skeleton while user is being loaded
  if (user === undefined) {
    return (
      <div className="flex flex-col justify-between w-screen h-screen">
        <div className="flex flex-col gap-4 h-full w-1/6 dark:bg-[#090909] bg-white p-4">
          <Skeleton className="h-16 w-full dark:bg-[#121212] bg-[#EFEFEF]" />
          <div className="flex gap-2 flex-col mt-8">
            <Skeleton className="h-4 w-1/3 dark:bg-[#121212] bg-[#EFEFEF]" />
            <Skeleton className="h-8 w-full dark:bg-[#121212] bg-[#EFEFEF]" />
            <Skeleton className="h-8 w-full dark:bg-[#121212] bg-[#EFEFEF]" />
            <Skeleton className="h-8 w-full dark:bg-[#121212] bg-[#EFEFEF]" />
            <Skeleton className="h-8 w-full dark:bg-[#121212] bg-[#EFEFEF]" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL as string;

  return (
    <div className="h-screen w-screen bg-darkmaincolor font-geist">
      <Toaster position="top-center" richColors />
      <SidebarProvider className="h-full w-full dark:bg-[#0E0E0E] bg-white rounded-lg">
        <SidebarTrigger />

        <AppSidebar
          chatId={chatId}
          fileProgress={0}
          showProgress={false}
          progressText=""
        />

        <div className="h-screen w-screen flex flex-col">
          <ChatNavbar chatId={chatId} />

          <div className="flex-1 p-4">
            <div className="h-full bg-white dark:bg-[#0E0E0E] rounded-lg border border-gray-200 dark:border-gray-700">
              <GraphVisualizationNVL
                chatId={chatId as string}
                baseUrl={baseUrl}
              />
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
