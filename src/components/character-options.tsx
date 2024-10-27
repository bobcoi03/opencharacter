"use client"

import { useState } from "react"
import { MoreVertical, Trash2, Pencil } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { deleteCharacter } from "@/app/actions/character"
import { characters } from "@/server/db/schema"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function CharacterOptions({ character } : { character: typeof characters.$inferSelect }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleDelete = async (characterId: string) => {
    const result = await deleteCharacter(characterId);
    if (result.success) {
      toast({
        title: "Character deleted successfully",
        description: "The character has been removed from your list.",
      })
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } else {
      toast({
        title: "Error",
        description: "Failed to delete character. Please try again.",
        variant: "destructive",
      })
      console.error(result.error);
    }
    setIsConfirmDialogOpen(false)
    setIsDialogOpen(false)
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-5 h-5 text-neutral-400 flex-shrink-0" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Character Options</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/character/${character.id}/edit`)}
            className="flex items-center"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit Character
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsConfirmDialogOpen(true)}
            className="flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Character
          </Button>
        </div>
      </DialogContent>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this character? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleDelete(character.id)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}