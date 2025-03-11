"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { Search,  User, LogOut, Settings } from 'lucide-react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AuthProvider from './auth-provider';
import { useRouter } from 'next/navigation';

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

type NavbarContentProps = {
  search: (query: string) => Promise<Character[]>;
};

const NavbarContent: React.FC<NavbarContentProps> = ({ search }) => {
  const router = useRouter()
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Character[]>([]);
  const { data: session, status } = useSession();

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await search(query);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectCharacter = (character: Character) => {
    // Handle character selection (e.g., navigate to character page)
    console.log('Selected character:', character);
    router.push(`/chat/${character.id}`)
    setIsSearchExpanded(false);
    setSuggestions([]);
    setSearchQuery('');
  };

  return (
    <nav className="w-full flex items-center justify-between px-2 py-2 border-b h-12">
      <span className="text-2xl font-bold">
        OpenCharacter
      </span>
      <div className="flex items-center space-x-4">
        <div className="relative">
          {isSearchExpanded ? (
            <>
              <input
                type="text"
                placeholder="Search..."
                className="bg-gray-100 dark:bg-gray-700 text-black dark:text-white px-2 py-1 rounded"
                autoFocus
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onBlur={() => {
                  // Delay hiding the search to allow for character selection
                  setTimeout(() => {
                    setIsSearchExpanded(false);
                    setSuggestions([]);
                  }, 200);
                }}
              />
              {suggestions.length > 0 && (
                <ul className="absolute z-[9999] mt-1 w-64 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                  {suggestions.map(char => (
                    <li 
                      key={char.id}
                      onClick={() => handleSelectCharacter(char)}
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 text-sm flex items-start"
                    >
                      {char.avatar_image_url && (
                        <img src={char.avatar_image_url} alt={char.name} className="w-8 h-8 rounded-full mr-2 flex-shrink-0" />
                      )}
                      <div className="flex-grow min-w-0">
                        <div className="font-medium text-black dark:text-white truncate">{char.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 break-words overflow-wrap-anywhere">{char.tagline}</div>
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs">
                  <span>{session.user?.name?.charAt(0)}</span>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-neutral-800">
              <DropdownMenuItem className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut()} className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            onClick={() => signIn('google')}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Sign In
          </Button>
        )}
      </div>
    </nav>
  );
};

const Navbar: React.FC<NavbarContentProps> = ({ search }) => {
  return (
    <AuthProvider>
      <NavbarContent search={search} />
    </AuthProvider>
  );
};

export default Navbar;