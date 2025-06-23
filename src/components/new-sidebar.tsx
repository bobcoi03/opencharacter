"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  MessageCircle,
  Users,
  Search,
  User,
  LogOut,
  Github,
  Plus,
  LayoutDashboard,
  DollarSign,
  Landmark,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Audiowide } from '@next/font/google';

const font = Audiowide({
  subsets: ['latin'], // Specify subsets you need
  weight: ['400', '400'], // Optional: Specify font weights
});

type Character = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  visibility: string;
  userId: string;
  interactionCount: number;
  likeCount: number;
  tags: string;
  avatar_image_url: string | null;
};

interface NewSidebarProps {
  search: (query: string) => Promise<Character[]>;
}

const NewSidebarContent: React.FC<NewSidebarProps> = ({ search }) => {
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isChatRoute = pathname.startsWith("/chat/");
  const isPlansRoute = pathname === "/plans" || pathname === "/pricing";
  const isSearchRoute = pathname === "/search";

  return (
    <>
      {/* Fixed Top Navbar */}
      {!isChatRoute && (
        <div className="fixed top-0 left-0 right-0 h-12 bg-neutral-900 border-b border-gray-700 flex items-center justify-between px-4 z-50">
          <div className="w-full items-center gap-4 flex">
            <Link
              href="/"
              className="text-2xl font-bold text-white"
            >
              <div className={font.className}>
                OpenCharacter
              </div>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {/* Desktop Search Bar - Hidden on search page */}
            {!isSearchRoute && (
              <div className="hidden md:block relative">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search characters..."
                    className="w-64 pl-10 pr-4 py-1 bg-neutral-800 text-white placeholder-gray-400 border border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onClick={() => router.push('/search')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        router.push('/search');
                      }
                    }}
                    readOnly
                  />
                </div>
              </div>
            )}
            
            {/* Mobile Search Icon - Hidden on search page */}
            {!isSearchRoute && (
              <div className="md:hidden relative">
                <Search
                  className="text-gray-600 dark:text-gray-300 cursor-pointer"
                  size={20}
                  onClick={() => router.push('/search')}
                />
              </div>
            )}
            {status === "authenticated" ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center space-x-2 cursor-pointer">
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      <img
                        src={session?.user?.image || '/default-avatar.jpg'}
                        alt="User Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-white dark:bg-neutral-800"
                >
                  <DropdownMenuItem className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Link href={"/profile"} className="w-full flex">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Link href={"/dashboard"} className="w-full flex">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Link href={"/subscription"} className="w-full flex">
                      <Landmark className="mr-2 h-4 w-4" />
                      <span>Subscription</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Link href={"/plans"} className="w-full flex">
                      <DollarSign className="mr-2 h-4 w-4" />
                      <span>Plans</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Link
                      href={"https://github.com/bobcoi03/opencharacter"}
                      target="_blank"
                      className="flex w-full"
                    >
                      <Github className="mr-2 h-4 w-4" />
                      <span>Github </span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Link href={"/referral/account"} className="flex w-full">
                      <Users className="mr-2 h-4 w-4" />
                      <span>Referral</span>
                    </Link>
                  </DropdownMenuItem>

                  
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              !pathname.startsWith("/signin") && (
                <Button
                  onClick={() => router.push("/signin")}
                  className="bg-white text-black px-3 text-xs rounded-full hover:bg-gray-300"
                >
                  Sign In
                </Button>
              )
            )}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isChatRoute && !isPlansRoute && (
        <div className="hidden md:flex flex-col items-center fixed left-0 top-12 bottom-0 w-16 bg-neutral-900 py-4 z-40">
          <SidebarContent
            isCreateOpen={isCreateOpen}
            setIsCreateOpen={setIsCreateOpen}
          />
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      {!isChatRoute && !isPlansRoute && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-neutral-900 flex justify-around items-center h-16 z-[9999]">
          <SidebarContent
            isCreateOpen={isCreateOpen}
            setIsCreateOpen={setIsCreateOpen}
            isMobile
          />
        </div>
      )}
    </>
  );
};

interface SidebarContentProps {
  isCreateOpen: boolean;
  setIsCreateOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMobile?: boolean;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  isCreateOpen,
  setIsCreateOpen,
  isMobile = false,
}) => {
  const router = useRouter();
  const iconClass = "w-5 h-5";
  const textClass = isMobile ? "text-[10px]" : "text-[10px] mt-1";
  const buttonClass = `flex flex-col items-center justify-center ${isMobile ? "w-full" : ""} text-gray-400 hover:text-white transition-colors duration-200`;

  return (
    <div
      className={`flex ${isMobile ? "flex-row justify-around w-full" : "flex-col space-y-6"} items-center py-4`}
    >
      <Popover>
        <PopoverTrigger asChild>
          <div className={`${buttonClass}`}>
            <Button variant={"ghost"} size={"icon"} className="h-10 w-10">
              <Plus className={iconClass} />
            </Button>
            <span className={textClass}>Create</span>
          </div>
        </PopoverTrigger>
        <PopoverContent
          side={isMobile ? "top" : "right"}
          className="w-48 p-0 bg-neutral-800"
        >
          <div className="flex flex-col">
            <Button
              variant="ghost"
              className="w-full justify-start rounded-none text-left px-4 py-2 text-sm text-gray-300 hover:bg-neutral-700"
              onClick={() => {
                router.push("/new");
              }}
            >
              Character
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start rounded-none text-left px-4 py-2 text-sm text-gray-300 hover:bg-neutral-700"
              onClick={() => {
                router.push("/new/import");
              }}
            >
              Import
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start rounded-none text-left px-4 py-2 text-sm text-gray-300 hover:bg-neutral-700"
              onClick={() => {
                router.push("/profile/persona/create");
              }}
            >
              Persona
            </Button>
            <Link
              className="w-full justify-start rounded-none text-left px-4 py-2 text-sm text-gray-300 hover:bg-neutral-700"
              href="https://openimage.art"
              target="_blank"
            >
              Images
            </Link>
          </div>
        </PopoverContent>
      </Popover>

      <Link href="/chat" className={buttonClass}>
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <MessageCircle className={iconClass} />
        </Button>
        <span className={textClass}>Chats</span>
      </Link>

      <Link
        href="https://discord.gg/PG4KXHXXa4"
        target="_blank"
        className={buttonClass}
      >
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <Users className={iconClass} />
        </Button>
        <span className={textClass}>Community</span>
      </Link>

      <Link href="/referral" className={buttonClass}>
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <Users className={iconClass} />
        </Button>
        <span className={textClass}>Referral</span>
      </Link>
    </div>
  );
};

const NewSidebar: React.FC<NewSidebarProps> = ({ search }) => {
  return (
      <NewSidebarContent search={search} />
  );
};

export default NewSidebar;
