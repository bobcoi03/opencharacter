"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { MoreVertical, Trash, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { personas } from '@/server/db/schema';
import { deletePersona } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

type Persona = typeof personas.$inferSelect;

interface PersonaOptionsProps {
  persona: Persona;
}

const PersonaOptions: React.FC<PersonaOptionsProps> = ({ persona }) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deletePersona(persona.id);
      if (result.success) {
        toast({
          title: "Success",
          description: "Persona deleted successfully.",
        });
        setIsOptionsOpen(false);
        setIsDeleteConfirmOpen(false);
        setTimeout(() => {
            router.refresh(); // Refresh the page to update the personas list
        }, 1000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete persona.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Persona Options</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Link href={`/profile/persona/${persona.id}/edit`} passHref>
              <Button variant="outline" className="w-full justify-start">
                <Edit className="w-4 h-4 mr-2" />
                Edit Persona
              </Button>
            </Link>
            <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full justify-start">
                  <Trash className="w-4 h-4 mr-2" />
                  Delete Persona
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to delete this persona?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the persona
                    {persona.displayName} and remove all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:space-y-0 sm:space-x-2">
                  <AlertDialogCancel className="sm:order-1">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete} 
                    className="bg-red-600 hover:bg-red-700 sm:order-2"
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PersonaOptions;