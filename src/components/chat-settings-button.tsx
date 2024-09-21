"use client";

import React, { useState, useEffect } from 'react';
import { Ellipsis, Share, Flag, Edit, MessageSquarePlus } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { characters } from '@/server/db/schema';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createChatSession, getAllConversationsByCharacter } from '@/app/actions/index';

export default function EllipsisButton({ character, made_by_username }: { character: typeof characters.$inferSelect, made_by_username: string }) {
  const [shareMessage, setShareMessage] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchConversations = async () => {
      const fetchedConversations = await getAllConversationsByCharacter(character.id);
      setConversations(fetchedConversations);
    };
    fetchConversations();
  }, [character.id]);

  useEffect(() => {
    console.log(conversations)
  }, [conversations])

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

  const handleNewChat = async () => {
    setIsCreatingSession(true);
    try {
      const sessionId = await createChatSession(character);
      router.push(`/chat/${character.id}?session=${sessionId}`);
      window.location.reload()
    } catch (error) {
      console.error('Failed to create chat session:', error);
      setShareMessage('Failed to create new chat. Please try again.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleContinueChat = (conversationId: string) => {
    console.log("going to conversation session: ", conversationId);
    // Navigate to the chat page with a timestamp to force a reload
    const timestamp = new Date().getTime();
    window.location.href = `/chat/${character.id}?session=${conversationId}&t=${timestamp}`;
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
          <div className="flex items-center mb-4 gap-4">
            <div className="w-16 h-16 overflow-hidden rounded-full">
              <div className="w-full h-full relative">
                <Image 
                  src={character.avatar_image_url ?? "/default-avatar.jpg"} 
                  alt={character.name} 
                  layout="fill"
                  objectFit="cover"
                  className="rounded-full"
                />
              </div>
            </div>
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
            <Link href={`/character/${character.id}/edit`} passHref>
              <Button variant="ghost" size="icon" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700">
                <Edit className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Button>
            </Link>
          </div>
          <Link href={`/chat/${character.id}`} passHref>
            <Button 
              onClick={handleNewChat}
              disabled={isCreatingSession}
              className="w-full mb-4 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-800 dark:text-gray-200 flex items-center justify-center py-2 rounded-full transition-colors"
            >
              {isCreatingSession ? (
                'Creating...'
              ) : (
                <>
                  <MessageSquarePlus className="w-5 h-5 mr-2" />
                  New Chat
                </>
              )}
            </Button>
          </Link>
          {shareMessage && (
            <p className="text-sm text-green-500 mb-4">{shareMessage}</p>
          )}

          <div className="mt-6">
            <h3 className="font-semibold text-lg mb-2 text-black dark:text-white">Recent Conversations</h3>
            {conversations.map((conversation) => {
              const latestMessage = conversation.messages[conversation.messages.length - 1];
              return (
                <div key={conversation.id} className="mb-4 p-3 bg-gray-100 dark:bg-neutral-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(conversation.last_message_timestamp), 'MMM d, yyyy')}
                  </p>
                  <p className="text-sm font-medium text-black dark:text-white mt-1">
                    {latestMessage.role === 'assistant' ? character.name : 'You'}: {latestMessage.content}
                  </p>
                  <Button 
                    variant="link" 
                    className="mt-2 p-0 h-auto text-blue-500 dark:text-blue-400"
                    onClick={() => handleContinueChat(conversation.id)}
                  >
                    Continue Chat
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}