"use client";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { PublicNav } from "@/app/components/public-nav";

export default function CommunityPage() {
  const publicChats = useQuery(api.chats.getPublicChats);
  const router = useRouter();
  return (
    <div className="flex gap-4 flex-wrap font-geist h-screen w-full p-12">
      <PublicNav />
      {publicChats?.map((chat) => (
        <div className="flex flex-col gap-2">
          <div
            className="cursor-pointer"
            onClick={() => {
              window.open(`/preview/${chat._id}`, "_blank");
            }}
          >
            <div className="h-36 w-80 bg-muted-foreground rounded-lg"></div>
            <h1 className="text-lg font-regular">{chat.title}</h1>
          </div>
        </div>
      ))}
    </div>
  );
}
