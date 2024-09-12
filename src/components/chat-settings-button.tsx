"use client";

import React, { useState } from 'react';
import { Ellipsis } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Share, Flag } from 'lucide-react';
import { characters } from '@/server/db/schema';
import { format } from 'date-fns';

export default function EllipsisButton({ character, made_by_username }: { character: typeof characters.$inferSelect, made_by_username: string }) {
  const [shareMessage, setShareMessage] = useState('');

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareMessage('URL copied to clipboard!');
      setTimeout(() => setShareMessage(''), 3000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      setShareMessage('Failed to copy URL');
    }
  };

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
            <Image src={character.avatar_image_url ?? "/default-avatar.jpg"} alt={character.name} width={64} height={64} className="rounded-full mr-4" />
            <div>
              <h2 className="font-bold text-xl text-black dark:text-white">{character.name}</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">By {made_by_username}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{character.interactionCount} chats</p>
            </div>
          </div>
          <div className="flex justify-between mb-4 items-center">
            <Button variant="ghost" size="icon" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700" onClick={handleShare}>
              <Share className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Button>
            <Button variant="ghost" size="icon" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700">
              <Flag className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Button>
          </div>
          {shareMessage && (
            <p className="text-sm text-green-500 mb-4">{shareMessage}</p>
          )}
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <p className="font-semibold">{character.tagline}</p>
            <p>{character.description}</p>
            <p>Created on: {format(new Date(character.createdAt), 'MMMM d, yyyy')}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}