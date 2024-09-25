"use client"

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import dynamic from 'next/dynamic';
import { AlignLeft, ChevronsLeft, Plus, Compass, Search, ChevronDown, User, Settings, LogOut, Twitter, FileText, GithubIcon, PersonStanding } from 'lucide-react'
import Link from 'next/link';
import AuthProvider from './auth-provider';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { getConversations } from '@/app/actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CharacterSearchBar } from './character-search-bar';

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

const DynamicThemeToggler = dynamic(() => import('@/lib/theme/get-theme-button').then(mod => mod.getThemeToggler()), {
  ssr: false,
});

function SideBarContent({ search }: { search: (query: string) => Promise<Character[]> }) {
    const [isOpen, setIsOpen] = useState(false)
    const { data: session, status } = useSession()
    const [conversations, setConversations] = useState<{ id: string; character_id: string; character_name: string | null; character_avatar: string | null; last_message_timestamp: string; updated_at: string; interaction_count: number; }[] | undefined>(undefined)
    const [isMobile, setIsMobile] = useState(false)
    const [isProDialogOpen, setIsProDialogOpen] = useState(false)
  
    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768) // 768px is the breakpoint for md
      }

      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const toggleSidebar = () => {
      setIsOpen(!isOpen)
    }

    useEffect(() => {
      async function fetchConversations() {
        if (status === "authenticated") {
          const result = await getConversations();
          if (!result.error) {
            setConversations(result.conversations)
          }
        }
      }
      fetchConversations()
    }, [status])

    return (
      <>
        <Button
          onClick={toggleSidebar}
          variant="ghost"
          size="icon"
          className={`${isOpen ? 'hidden' : ''} md:hidden fixed z-50 top-4 left-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white`}
        >
          <AlignLeft className='w-6 h-6'/>
        </Button>
        <div 
          className={`
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0
            fixed md:static top-0 left-0 h-full w-64 bg-white dark:bg-neutral-900 
            transition-transform duration-300 ease-in-out z-40
            ${isMobile ? 'shadow-lg' : 'border-r border-gray-200 dark:border-neutral-800'}
          `}
        >
          <div className="h-full flex flex-col">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <Link className="text-md font-bold text-black dark:text-white p-2" href={"/"}>OpenCharacter</Link>
                <div className="flex items-center space-x-2">
                  <Link href={"https://github.com/bobcoi03/opencharacter"} target='_blank'>
                    <GithubIcon className='w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-gray-900'/>
                  </Link>
                  <DynamicThemeToggler />
                  <Button
                    onClick={toggleSidebar}
                    variant="ghost"
                    size="icon"
                    className="md:hidden p-0 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  >
                    <ChevronsLeft className='w-4 h-4'/>
                  </Button>
                </div>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button className="w-auto inline-flex py-2 px-4 bg-gray-100 dark:bg-neutral-800 text-black dark:text-white rounded-full text-center mb-4 items-center text-md hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors">
                    <Plus className="w-6 h-6 mr-2" />
                    <span className='mr-4'>Create</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-48 p-0 bg-white dark:bg-neutral-900"
                  side='right'
                  align='start'
                >
                  <Link href="/new" passHref>
                    <Button
                      className="bg-neutral-100 dark:bg-neutral-800 w-full justify-start rounded-none text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    >
                      <PersonStanding className="w-4 h-4 mr-2" />
                      Create Character
                    </Button>
                  </Link>
                  <Link href="/room/create" passHref>
                    <Button
                      className="bg-neutral-100 dark:bg-neutral-800 w-full justify-start rounded-none text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Create Room
                    </Button>
                  </Link>
                  <Link href="/twitter" passHref>
                    <Button
                      className="bg-neutral-100 dark:bg-neutral-800 w-full justify-start rounded-none text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    >
                      <Twitter className="w-4 h-4 mr-2" />
                      Twitter Profile
                    </Button>
                  </Link>
                </PopoverContent>
              </Popover>
              
              <Link href={"/"} className="w-full py-2 px-4 text-left mb-4 flex items-center text-sm text-black dark:text-white hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-md">
                <Compass className="w-6 h-6 mr-2" />
                Discover
              </Link>
            
              <CharacterSearchBar searchCharacters={search} />

            </div>
            
            <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
              <h2 className="text-xs font-semibold text-gray-500 mb-2 px-2">Recent Conversations</h2>
              <div className="space-y-2">
                {conversations && conversations.map((conversation) => (
                  <Link href={`/chat/${conversation.character_id}?`} key={conversation.id} className="flex items-center space-x-2 py-2 px-2 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 cursor-pointer">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      {conversation.character_avatar && (
                        <img src={conversation.character_avatar} alt={conversation.character_name || 'Character'} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <span className="text-sm text-black dark:text-white">{conversation.character_name || 'Unnamed Character'}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-neutral-800">
              {status === "authenticated" ? (
                <>
                <Dialog open={isProDialogOpen} onOpenChange={setIsProDialogOpen}>
                    <DialogTrigger asChild>
                      <button className="w-full py-3 border px-4 bg-gray-50 dark:bg-neutral-800 text-black dark:text-white rounded-full text-center text-sm hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors mb-4">
                        Pro<span className='text-yellow-300 font-normal'>+</span>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white dark:bg-neutral-800 p-6 shadow-xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Interested in Pro features?</DialogTitle>
                        <DialogDescription className="text-gray-600 dark:text-gray-300 text-base">
                          DM <Link href="https://x.com/justwrapapi" target="_blank" className="text-blue-500 hover:text-blue-700 underline font-medium">@justwrapapi</Link> for feature suggestions or interest in a paid plan
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-6 flex justify-end">
                        <Button 
                          onClick={() => setIsProDialogOpen(false)}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-full transition-colors"
                        >
                          Close
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs">
                            {session.user?.name?.[0] || 'U'}
                          </div>
                          <span className="text-xs text-black dark:text-white">{session.user?.name || 'User'}</span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 dark:bg-neutral-800">
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Public Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => signOut()}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <button
                  onClick={() => signIn('google')}
                  className="w-full py-3 px-4 bg-gray-100 dark:bg-neutral-800 text-black dark:text-white rounded-full text-center text-sm hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    <path d="M1 1h22v22H1z" fill="none"/>
                  </svg>
                  Sign in with Google
                </button>
              )}
            </div>
          </div>
        </div>
        {isOpen && isMobile && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={toggleSidebar}
          ></div>
        )}
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(155, 155, 155, 0.5);
            border-radius: 20px;
            border: transparent;
          }
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(155, 155, 155, 0.5) transparent;
          }
        `}</style>
      </>
    )
  }

function SideBar({ search }: { search: (query: string) => Promise<Character[]> }) {
    return (
        <AuthProvider>
            <SideBarContent search={search} />
        </AuthProvider>
    )
}

export default SideBar;