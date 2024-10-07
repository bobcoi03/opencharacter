"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Rss,
  PlusCircle,
  MessageCircle,
  Users,
  Search,
  User,
  LogOut,
  HandCoins,
  Github,
  Plus,
} from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
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
import AuthProvider from "./auth-provider";

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
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Character[]>([]);
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isChatRoute = pathname.startsWith("/chat/");

  const handleSearch = async (query: string): Promise<void> => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await search(query);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectCharacter = (character: Character): void => {
    router.push(`/chat/${character.id}`);
    setIsSearchExpanded(false);
    setSuggestions([]);
    setSearchQuery("");
  };

  return (
    <>
      {/* Fixed Top Navbar */}
      {!isChatRoute && (
        <div className="fixed top-0 left-0 right-0 h-12 bg-neutral-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 z-50">
          <div className="w-full items-center gap-4 flex">
            <Link
              href="/"
              className="text-2xl font-bold text-white"
            >
              OpenCharacter
            </Link>
            <Link href={"https://buymeacoffee.com/luongquangn"} target="_blank" className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs">
              Donate
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              {isSearchExpanded ? (
                <>
                  <input
                    type="text"
                    placeholder="Search..."
                    className="bg-gray-100 dark:bg-gray-700 text-black dark:text-white px-2 py-1 rounded w-full max-w-[400px]"
                    autoFocus
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleSearch(e.target.value)
                    }
                    onBlur={() => {
                      setTimeout(() => {
                        setIsSearchExpanded(false);
                        setSuggestions([]);
                      }, 200);
                    }}
                  />
                  {suggestions.length > 0 && (
                    <ul className="absolute z-[9999] mt-1 w-full max-w-[400px] bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto left-0 right-0">
                      {suggestions.map((char: Character) => (
                        <li
                          key={char.id}
                          onClick={() => handleSelectCharacter(char)}
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 text-sm flex items-start"
                        >
                          {char.avatar_image_url && (
                            <img
                              src={char.avatar_image_url}
                              alt={char.name}
                              className="w-8 h-8 rounded-full mr-2 flex-shrink-0"
                            />
                          )}
                          <div className="flex-grow min-w-0">
                            <div className="font-medium text-black dark:text-white truncate">
                              {char.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {char.tagline}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <Search
                  className="text-gray-600 dark:text-gray-300 cursor-pointer"
                  size={20}
                  onClick={() => setIsSearchExpanded(true)}
                />
              )}
            </div>
            {status === "authenticated" ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center space-x-2 cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-black via-black to-purple-300 flex items-center justify-center text-md text-white font-semibold">
                      <span>{session?.user?.name?.charAt(0)}</span>
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
                    <Link
                      href={"https://github.com/bobcoi03/opencharacter"}
                      target="_blank"
                      className="flex w-full"
                    >
                      <Github className="mr-2 h-4 w-4" />
                      <span>Github </span>
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
              <Button
                onClick={() => signIn("google")}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isChatRoute && (
        <div className="hidden md:flex flex-col items-center fixed left-0 top-12 bottom-0 w-16 bg-neutral-900 py-4 z-40">
          <SidebarContent
            isCreateOpen={isCreateOpen}
            setIsCreateOpen={setIsCreateOpen}
          />
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      {!isChatRoute && (
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
      <Link href="/" className={buttonClass}>
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <Home className={iconClass} />
        </Button>
        <span className={textClass}>Home</span>
      </Link>

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
                router.push("/profile/persona/create");
              }}
            >
              Persona
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start rounded-none text-left px-4 py-2 text-sm text-gray-300 hover:bg-neutral-700"
              onClick={() => {
                router.push("/twitter");
              }}
            >
              Twitter Profile
            </Button>
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
    </div>
  );
};

const NewSidebar: React.FC<NewSidebarProps> = ({ search }) => {
  return (
    <AuthProvider>
      <NewSidebarContent search={search} />
    </AuthProvider>
  );
};

export default NewSidebar;
