"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Ellipsis, Share, Flag, Edit, MessageSquarePlus, UserPlus, MoreVertical } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { characters, chat_sessions } from '@/server/db/schema';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createChatSession, getAllConversationsByCharacter, getAllUserPersonas, getDefaultPersona, setDefaultPersona } from '@/app/actions/index';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { personas as PersonaType } from '@/server/db/schema';
import { toast, useToast } from "@/hooks/use-toast"
import ChatSessionDeleteButton from './chat-session-delete-button';

export default function EllipsisButton({ character, made_by_username }: { character: typeof characters.$inferSelect, made_by_username: string }) {
  const [shareMessage, setShareMessage] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [conversations, setConversations] = useState<typeof chat_sessions.$inferSelect[]>([]);
  const [personas, setPersonas] = useState<typeof PersonaType.$inferSelect[]>([]);
  const [defaultPersona, setDefaultPersonaState] = useState<typeof PersonaType.$inferSelect | null>(null);
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(false);
  const [isSettingDefault, setIsSettingDefault] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchConversations = async () => {
      const fetchedConversations = await getAllConversationsByCharacter(character.id);
      setConversations(fetchedConversations);
    };
    fetchConversations();
    fetchDefaultPersona();
  }, [character.id]);

  const fetchDefaultPersona = async () => {
    const result = await getDefaultPersona();
    if (result.success && result.persona) {
      setDefaultPersonaState(result.persona);
    }
  };

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

  const fetchPersonas = async () => {
    setIsLoadingPersonas(true);
    try {
      const result = await getAllUserPersonas();
      if (result.success) {
        setPersonas(result.personas);
      } else {
        console.error(result.error);
        // You might want to show an error message to the user here
      }
    } catch (error) {
      console.error("Failed to fetch personas:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsLoadingPersonas(false);
    }
  };

  const handleSetDefaultPersona = async (persona: typeof PersonaType.$inferSelect) => {
    setIsSettingDefault(true);
    try {
      const result = await setDefaultPersona(persona.id);
      if (result.success) {
        // Update the local state to reflect the change
        setDefaultPersonaState(persona);
        setPersonas(prevPersonas => prevPersonas.map(p => ({
          ...p,
          isDefault: p.id === persona.id
        })));
        toast({
          title: `Set ${persona.displayName} as default character`,
        })
        setTimeout(() => window.location.reload(), 1000)
      } else {
        console.error(result.error);
      }
    } catch (error) {
      console.error("Failed to set default persona:", error);
    } finally {
      setIsSettingDefault(false);
    }
  };

  const handleDeleteSuccess = useCallback((deletedSessionId: string) => {
    setConversations(prevConversations => 
      prevConversations.filter(conversation => conversation.id !== deletedSessionId)
    );
    toast({
      title: "Chat session deleted",
      description: "The chat session has been successfully deleted.",
    });
  }, []);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="p-2 w-[24] h-[24] rounded-full hover:bg-neutral-800 transition-colors border border-neutral-700">
          <Ellipsis className='text-gray-400' />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-80 bg-neutral-800 border-l border-neutral-700 overflow-y-auto">
        <div className="py-4">
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
              <h2 className="font-bold text-xl text-white">{character.name}</h2>
              <p className="text-xs text-gray-400">By {made_by_username}</p>
              <p className="text-xs text-gray-400">{character.interactionCount} chats</p>
            </div>
          </div>
          <div className="flex justify-between mb-4 items-center">
            <Button variant="ghost" size="icon" className="p-2 rounded-full hover:bg-neutral-700" onClick={handleShare}>
              <Share className="w-5 h-5 text-gray-400" />
            </Button>
            <Button variant="ghost" size="icon" className="p-2 rounded-full hover:bg-neutral-700">
              <Flag className="w-5 h-5 text-gray-400" />
            </Button>
            <Link href={`/character/${character.id}/edit`} passHref>
              <Button variant="ghost" size="icon" className="p-2 rounded-full hover:bg-neutral-700">
                <Edit className="w-5 h-5 text-gray-400" />
              </Button>
            </Link>
          </div>
          <Link href={`/chat/${character.id}`} passHref>
            <Button 
              onClick={handleNewChat}
              disabled={isCreatingSession}
              className="w-full mb-4 bg-gray-100 bg-neutral-700 hover:bg-neutral-600 text-gray-200 flex items-center justify-center py-2 rounded-full transition-colors"
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
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                className="w-full mb-4 bg-neutral-700 hover:bg-neutral-600 text-gray-200 flex items-center justify-between py-2 px-4 rounded-full transition-colors"
                onClick={fetchPersonas}
              >
                <div className="flex items-center textpxs">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Personas
                </div>
                {defaultPersona && (
                  <span className="text-xs text-gray-400">{defaultPersona.displayName}</span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-neutral-900 text-white h-[30rem] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Personas</DialogTitle>
                <DialogDescription>
                  Select a default persona
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                {isLoadingPersonas ? (
                  <p>Loading personas...</p>
                ) : personas.length > 0 ? (
                  <div className="space-y-4 mb-6">
                    {personas.map((persona) => (
                      <div
                        key={persona.id}
                        className="flex items-center justify-between hover:cursor-pointer hover:bg-neutral-800 p-2 hover:rounded-xl max-w-sm"
                        onClick={() => handleSetDefaultPersona(persona)}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          {persona.image ? (
                            <img src={persona.image} alt={persona.displayName} className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold bg-gradient-to-br from-black via-black to-purple-300">
                              {persona.displayName[0]}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h2 className="font-semibold flex items-center text-sm">
                              <span className="truncate">{persona.displayName}</span>
                              {persona.isDefault && (
                                <span className="ml-2 flex-shrink-0 text-xs bg-neutral-700 text-neutral-300 px-2 py-1 rounded">Default</span>
                              )}
                            </h2>
                            <p className="text-xs text-neutral-400 truncate break-words text-wrap ">{persona.background.slice(0, 100)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No personas found. Create one to get started!</p>
                )}
                <Link href={"/profile/persona/create"}>
                  <Button className="mt-4 w-full max-w-sm">Create New Persona</Button>                
                </Link>
              </div>
            </DialogContent>
          </Dialog>
          {shareMessage && (
            <p className="text-sm text-green-500 mb-4">{shareMessage}</p>
          )}

          <div className="mt-6">
            <h3 className="font-semibold text-lg mb-2 text-white">Recent Conversations</h3>
            {conversations.map((conversation) => {
              const latestMessage = conversation.messages[conversation.messages.length - 1];
              return (
                <div key={conversation.id} className="mb-4 p-3 bg-neutral-700 rounded-lg">
                  <div className='w-full flex justify-between items-center'>
                    <p className="text-sm text-gray-400">
                      {format(new Date(conversation.last_message_timestamp), 'MMM d, yyyy')}
                    </p>
                    <ChatSessionDeleteButton 
                      chatSession={conversation} 
                      onDeleteSuccess={() => handleDeleteSuccess(conversation.id)}
                    />
                  </div>

                  <p className="text-sm font-medium text-white mt-1">
                    {latestMessage.role === 'assistant' ? character.name : 'You'}: {latestMessage.content}
                  </p>
                  <Button 
                    variant="link" 
                    className="mt-2 p-0 h-auto text-blue-400"
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