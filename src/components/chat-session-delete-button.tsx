"use client"

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { chat_sessions } from '@/server/db/schema';
import { deleteChatSession } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

type ChatSession = typeof chat_sessions.$inferSelect;

interface ChatSessionDeleteButtonProps {
    chatSession: ChatSession;
    onDeleteSuccess: () => void;
  }

const ChatSessionDeleteButton: React.FC<ChatSessionDeleteButtonProps> = ({ chatSession, onDeleteSuccess }) => {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteChatSession(chatSession.id);
      if (result.success) {
        onDeleteSuccess();
        setIsDeleteConfirmOpen(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete chat session.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <X className="w-3 h-3" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Chat Session</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this chat session?
            This action cannot be undone. This will permanently delete the chat session.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row justify-between w-full">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            className="bg-red-600 hover:bg-red-700"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ChatSessionDeleteButton;