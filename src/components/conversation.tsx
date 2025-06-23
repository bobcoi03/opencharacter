"use client"

import React, { useState, useEffect } from 'react';
import { getConversations, deleteChatSession } from "@/app/actions/index"
import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle, Clock, Calendar, Trash2, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

type Conversation = {
  id: string;
  character_id: string;
  character_name: string | null;
  character_avatar: string | null;
  last_message_timestamp: string;
  updated_at: string;
  interaction_count: number;
  title?: string | null;
};

export default function Conversation() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchConversations() {
      setIsLoading(true);
      try {
        const result = await getConversations();
        if (result.error) {
          setError(result.message || "An error occurred while fetching conversations");
        } else {
          setConversations(result.conversations ?? []); // Use fallback to empty array
        }
      } catch (err) {
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchConversations();
  }, []);

  const handleDeleteClick = (conversation: Conversation, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Prevent event bubbling
    setConversationToDelete(conversation);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!conversationToDelete) return;

    setDeletingId(conversationToDelete.id);
    try {
      const result = await deleteChatSession(conversationToDelete.id);
      
      if (result.success) {
        // Remove the deleted conversation from the state
        setConversations(prev => prev.filter(conv => conv.id !== conversationToDelete.id));
        toast({
          title: "Conversation deleted",
          description: "The conversation has been successfully deleted.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete conversation",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the conversation",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8 mb-12 md:pl-16">
        {conversations.length === 0 ? (
          <p>You haven{"'"}t started any conversations yet.</p>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <div key={conversation.id} className="bg-neutral-900 rounded-lg p-4 hover:bg-neutral-800 transition-colors duration-200 flex items-center group">
                <Link href={`/chat/${conversation.character_id}`} className="flex items-center w-full">
                  {/* Character Avatar */}
                  <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 mr-4">
                    {conversation.character_avatar ? (
                      <Image
                        src={conversation.character_avatar}
                        alt={conversation.character_name || "Character"}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-700"></div>
                    )}
                  </div>
                  
                  {/* Conversation Details */}
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start">
                      <h2 className="text-md font-semibold text-white truncate">
                        {conversation.character_name || "Unnamed Character"}
                      </h2>
                      <div className="flex items-center text-xs text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{formatDistanceToNow(new Date(conversation.last_message_timestamp), { addSuffix: true })}</span>
                      </div>
                    </div>
                    
                    {/* Conversation Title */}
                    {conversation.title && (
                      <p className="text-sm text-gray-300 mt-1 truncate">
                        {conversation.title}
                      </p>
                    )}
                    
                    {/* Last Message Time */}
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-400 truncate">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {new Date(conversation.last_message_timestamp).toLocaleDateString()}
                      </p>
                      
                      {/* Chat Count */}
                      <div className="flex items-center bg-neutral-800 px-2 py-1 rounded-full">
                        <MessageCircle className="h-3 w-3 mr-1 text-blue-400" />
                        <span className="text-xs text-blue-400">{conversation.interaction_count}</span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Delete Button - Only visible on hover */}
                <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-neutral-700"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        onClick={(e) => handleDeleteClick(conversation, e)}
                        disabled={deletingId === conversation.id}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deletingId === conversation.id ? "Deleting..." : "Delete conversation"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation with{" "}
              <span className="font-semibold">
                {conversationToDelete?.character_name || "this character"}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={deletingId !== null}
            >
              {deletingId ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}