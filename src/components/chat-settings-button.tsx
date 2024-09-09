"use client";

import { useState } from 'react';
import { Ellipsis } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Share, ThumbsUp, ThumbsDown, Flag, MoreHorizontal, Edit, Mic, History, Pin, User } from 'lucide-react';

export default function EllipsisButton() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="p-2 w-[24] h-[24] rounded-full hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors border border-gray-200 dark:border-neutral-700">
          <Ellipsis className='text-gray-600 dark:text-gray-400' />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-80 bg-white dark:bg-neutral-800 border-l border-gray-200 dark:border-neutral-700 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center mb-4">
            <Image src="/andy-demo.webp" alt="Dry Texter" width={64} height={64} className="rounded-full mr-4" />
            <div>
              <h2 className="font-bold text-xl text-black dark:text-white">Dry Texter</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">By @Palace321</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">47.4m chats</p>
            </div>
          </div>
          <div className="flex justify-between mb-4">
            <Button variant="ghost" size="icon" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700">
              <Share className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Button>
            <Button variant="ghost" size="icon" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700">
              <ThumbsUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm ml-1">15.9k</span>
            </Button>
            <Button variant="ghost" size="icon" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700">
              <ThumbsDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Button>
            <Button variant="ghost" size="icon" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700">
              <Flag className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Button>
            <Button variant="ghost" size="icon" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700">
              <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Dry texter</p>
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start">
              <Edit className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-400" />
              <span>New chat</span>
            </Button>
            <Button variant="ghost" className="w-full justify-between">
              <div className="flex items-center">
                <Mic className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-400" />
                <span>Voice</span>
              </div>
              <span className="text-sm text-gray-500">Default</span>
            </Button>
            <Button variant="ghost" className="w-full justify-between">
              <div className="flex items-center">
                <History className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-400" />
                <span>History</span>
              </div>
              <span className="text-sm text-gray-500">&gt;</span>
            </Button>
            <Button variant="ghost" className="w-full justify-between">
              <div className="flex items-center">
                <Pin className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-400" />
                <span>Pinned</span>
              </div>
              <span className="text-sm text-gray-500">&gt;</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <User className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-400" />
              <span>Persona</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
