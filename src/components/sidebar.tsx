"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import dynamic from 'next/dynamic';
import { AlignLeft, ChevronsLeft, Plus, Compass, Search, ChevronDown, User, Settings, LogOut } from 'lucide-react'
import Link from 'next/link';
import AuthProvider from './auth-provider';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"

const DynamicThemeToggler = dynamic(() => import('@/lib/theme/get-theme-button').then(mod => mod.getThemeToggler()), {
  ssr: false,
});

function SideBarContent() {
    const [isOpen, setIsOpen] = useState(true)
    const { data: session, status } = useSession()
  
    const toggleSidebar = () => {
      setIsOpen(!isOpen)
    }
  
    return (
      <div 
        className={`${isOpen ? 'w-64 border-r' : 'w-0'} h-full bg-white dark:bg-neutral-900 transition-all duration-500 ease-in-out overflow-hidden border-gray-200 dark:border-neutral-800`}
      >
        {isOpen ? (
          <div className="h-full flex flex-col">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <Link className="text-xl font-bold text-black dark:text-white p-2" href={"/"}>OpenCharacter</Link>
                <div className="flex items-center space-x-2">
                  <DynamicThemeToggler />
                  <Button
                    onClick={toggleSidebar}
                    variant="ghost"
                    size="icon"
                    className="p-0 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    <ChevronsLeft className='w-4 h-4'/>
                  </Button>
                </div>
              </div>
              
              <Link
                href="/new"
                className="w-full py-2 px-4 bg-gray-100 dark:bg-neutral-800 text-black dark:text-white rounded-full text-center mb-4 flex items-center justify-center text-sm hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" /> Create
              </Link>
              
              <button className="w-full py-2 px-4 text-left mb-4 flex items-center text-sm text-black dark:text-white">
                <Compass className="w-4 h-4 mr-2" />
                Discover
              </button>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for Characters"
                  className="w-full py-2 px-4 pl-10 bg-gray-100 dark:bg-neutral-800 text-black dark:text-white rounded-full text-sm"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <h2 className="text-xs font-semibold text-gray-500 mb-2">Today</h2>
              <div className="space-y-2">
                {['Character Assistant', 'Android apps', 'AI critic', 'DecisionHelper', 'Peni Parker', 'School Bully', 'Nicki Minaj', 'Dry Texter'].map((char, index) => (
                  <div key={index} className="flex items-center space-x-2 py-2 px-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer">
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <span className="text-sm text-black dark:text-white">{char}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-neutral-800">
              {status === "authenticated" ? (
                <>
                  <button className="w-full py-3 border px-4 bg-gray-50 dark:bg-neutral-800 text-black dark:text-white rounded-full text-center text-sm hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors mb-4">
                    Try Pro<span className='text-yellow-300'>+</span>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
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
        ) : null}
        {!isOpen && (
          <Button
            onClick={toggleSidebar}
            variant="ghost"
            size="icon"
            className="absolute z-50 top-4 left-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <AlignLeft className='w-6 h-6'/>
          </Button>
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
      </div>
    )
  }
function SideBar() {
    return (
        <AuthProvider>
            <SideBarContent />
        </AuthProvider>
    )
}

export default SideBar;