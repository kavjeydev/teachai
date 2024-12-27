import {
  Calendar,
  ChevronDown,
  ChevronsUpDown,
  Home,
  Inbox,
  PlusCircle,
  Search,
  Settings,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTheme } from "next-themes";
import { SignOutButton, useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";

// Menu items.
const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
];

export function AppSidebar() {
  const addFile = useMutation(api.chats.createChat);

  const onCreate = () => {
    const promise = addFile({ title: "untitled" });

    toast.success("Chat created!");
  };

  const { user } = useUser();

  console.log(user);

  return (
    <Sidebar className="z-99999 border-none">
      <SidebarContent className="dark:bg-darkmaincolor bg-opacity-90 border-r-0">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent className="">
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title} className="">
                  <SidebarMenuButton asChild className="">
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <SidebarMenuItem key="addchat" className="">
                <SidebarMenuButton
                  asChild
                  className=""
                  onClick={() => {
                    onCreate();
                  }}
                >
                  <div>
                    <PlusCircle />
                    <span>Add Chat</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">
            Chats
          </SidebarGroupLabel>
          <SidebarGroupContent></SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className=" bg-opacity-90 border-muted-foreground/50 dark:bg-darkmaincolor">
        <div className="flex items-center space-x-3 px-4 py-3 ">
          <Popover>
            <PopoverTrigger asChild>
              <SidebarMenuButton className=" h-12 transition-colors duration-200">
                <Avatar>
                  <AvatarImage src={user?.imageUrl} alt="User Avatar" />
                  <AvatarFallback>SC</AvatarFallback>
                </Avatar>
                <div className="leading-tight truncate text-ellipsis">
                  <div className="font-semibold ">{user?.firstName}</div>
                  <div className="text-sm text-muted-foreground">
                    {user?.emailAddresses[0].emailAddress}
                  </div>
                </div>
                <ChevronsUpDown className="ml-auto text-muted-foreground" />
              </SidebarMenuButton>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popper-anchor-width]">
              <SignOutButton>
                <Button className="w-full">Sign Out</Button>
              </SignOutButton>
            </PopoverContent>
          </Popover>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
