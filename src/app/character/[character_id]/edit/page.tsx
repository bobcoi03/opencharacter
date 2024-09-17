import { CreateCharacterForm } from "@/components/create-character-form"
import { auth } from "@/server/auth"
import { characters } from "@/server/db/schema";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { updateCharacter } from "@/app/actions/character";
import { redirect } from "next/navigation";

export const runtime = "edge"

export default async function EditCharacterPage({ params }: { params: { character_id: string }}) {
    const session = await auth();
    if (!session?.user) {
        return <div>Must be logged in to edit user</div>
    }

    // grab the character by id
    const character = await db.query.characters.findFirst({
        where: eq(characters.id, params.character_id)
    })

    if (!character) {
        return <div>No character found with id: {params.character_id}</div>
    }

    if (character.userId != session.user.id) {
        return <div>Unathorized to edit character</div>
    }

    async function handleSubmit(formData: FormData) {
        "use server"
        const avatar = formData.get('avatar')
        if (!avatar) {
            formData.delete('avatar')
        }    
        const result = await updateCharacter(character!.id, formData);
        if (result.success && result.character) {
          redirect(`/chat/${result.character.id}`);
        } else {
          console.error("Error creating character:", result.error, result.details);
          throw new Error(result.error || 'Failed to create character');
        }
    }

    return (
        <CreateCharacterForm action={handleSubmit} character={character} editMode={true} />
    )
}