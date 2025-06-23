"use server"

import { db } from "@/server/db";
import { personas } from "@/server/db/schema";
import { auth } from "@/server/auth";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { uploadToR2 } from "@/lib/r2_storage";

export async function CreatePersona(formData: FormData) {
    const session = await auth();
    if (!session?.user) {
        throw new Error("You must be logged in to create a persona.");
    }

    const displayName = formData.get("displayName") as string;
    const background = formData.get("background") as string;
    const isDefault = formData.get("isDefault") === "on";
    const avatarFile = formData.get("avatar") as File | null;

    // Validate input
    if (!displayName || displayName.length > 20) {
        throw new Error("Display name is required and must be 20 characters or less.");
    }
    if (!background || background.length > 1456) {
        throw new Error("Background is required and must be 1456 characters or less.");
    }

    try {
        // Upload avatar if provided
        let avatarImageUrl = null;
        if (avatarFile && avatarFile.size > 0) {
            avatarImageUrl = await uploadToR2(avatarFile);
        }

        // If this persona is set as default, unset any existing default
        if (isDefault) {
            await db.update(personas)
                .set({ isDefault: false })
                .where(eq(personas.userId, session.user.id!));
        }

        // Create the new persona
        const newPersona = await db.insert(personas).values({
            userId: session.user.id!,
            displayName,
            background,
            isDefault,
            image: avatarImageUrl, // Add the image URL to the persona
        }).returning().get();

        // Revalidate the profile page to show the new persona
        revalidatePath("/profile/persona");

        return { success: true, persona: newPersona };
    } catch (error) {
        console.error("Failed to create persona:", error);
        return { success: false, error: "Failed to create persona. Please try again." };
    }
}

export async function updatePersona(formData: FormData) {
    const session = await auth();
    if (!session?.user) {
        throw new Error("You must be logged in to update a persona.");
    }

    const personaId = formData.get("personaId") as string;
    const displayName = formData.get("displayName") as string;
    const background = formData.get("background") as string;
    const isDefault = formData.get("isDefault") === "on";
    const avatarFile = formData.get("avatar") as File | null;

    // Validate input
    if (!personaId) {
        throw new Error("Persona ID is required.");
    }
    if (!displayName || displayName.length > 20) {
        throw new Error("Display name is required and must be 20 characters or less.");
    }
    if (!background || background.length > 1456) {
        throw new Error("Background is required and must be 1456 characters or less.");
    }

    try {
        // Check if the persona belongs to the user
        const existingPersona = await db.query.personas.findFirst({
            where: and(
                eq(personas.id, personaId!),
                eq(personas.userId, session.user.id!)
            ),
        });

        if (!existingPersona) {
            throw new Error("Persona not found or you don't have permission to edit it.");
        }

        // If this persona is being set as default, unset any existing default
        if (isDefault) {
            await db.update(personas)
                .set({ isDefault: false })
                .where(eq(personas.userId, session.user.id!));
        }

        // Upload avatar if provided
        let avatarImageUrl = existingPersona.image;
        if (avatarFile && avatarFile.size > 0) {
            avatarImageUrl = await uploadToR2(avatarFile);
        }

        // Update the persona
        const updatedPersona = await db.update(personas)
            .set({
                displayName,
                background,
                isDefault,
                image: avatarImageUrl,
            })
            .where(eq(personas.id, personaId))
            .returning()
            .get();

        // Revalidate the profile page to show the updated persona
        revalidatePath("/profile/persona");

        return { success: true, persona: updatedPersona };
    } catch (error) {
        console.error("Failed to update persona:", error);
        return { success: false, error: "Failed to update persona. Please try again." };
    }
}

export async function getDefaultPersona() {
    const session = await auth();
    if (!session?.user) {
        throw new Error("You must be logged in to get the default persona.");
    }

    try {
        const defaultPersona = await db.query.personas.findFirst({
            where: and(
                eq(personas.userId, session.user.id!),
                eq(personas.isDefault, true)
            ),
        });

        if (!defaultPersona) {
            return { success: false, error: "No default persona found." };
        }

        return { success: true, persona: defaultPersona };
    } catch (error) {
        console.error("Failed to get default persona:", error);
        return { success: false, error: "Failed to retrieve default persona. Please try again." };
    }
}

export interface GetAllUserPersonasResult {
    success: boolean;
    personas: typeof personas.$inferSelect[];
    message?: string;
    error?: string;
  }
  
  export async function getAllUserPersonas(): Promise<GetAllUserPersonasResult> {
      const session = await auth();
      if (!session?.user) {
          throw new Error("You must be logged in to get your personas.");
      }
  
      try {
          const userPersonas = await db.query.personas.findMany({
              where: eq(personas.userId, session.user.id!),
              orderBy: (personas, { desc }) => [desc(personas.createdAt)],
          });
  
          if (userPersonas.length === 0) {
              return { success: true, personas: [], message: "No personas found for this user." };
          }
  
          return { success: true, personas: userPersonas };
      } catch (error) {
          console.error("Failed to get user personas:", error);
          return { success: false, personas: [], error: "Failed to retrieve user personas. Please try again." };
      }
}

interface SetDefaultPersonaResult {
    success: boolean;
    message?: string;
    error?: string;
}

export async function setDefaultPersona(personaId: string): Promise<SetDefaultPersonaResult> {
    const session = await auth();
    if (!session?.user) {
        return { success: false, error: "You must be logged in to set a default persona." };
    }

    try {
        // Check if the persona belongs to the user
        const persona = await db.query.personas.findFirst({
            where: and(
                eq(personas.id, personaId),
                eq(personas.userId, session.user.id!)
            ),
        });

        if (!persona) {
            return { success: false, error: "Persona not found or doesn't belong to the user." };
        }

        // Unset any existing default persona
        await db.update(personas)
            .set({ isDefault: false })
            .where(eq(personas.userId, session.user.id!));

        // Set the new default persona
        await db.update(personas)
            .set({ isDefault: true })
            .where(eq(personas.id, personaId));

        return { success: true, message: "Default persona set successfully." };
    } catch (error) {
        console.error("Failed to set default persona:", error);
        return { success: false, error: "Failed to set default persona. Please try again." };
    }
}

export async function clearDefaultPersona(): Promise<SetDefaultPersonaResult> {
    const session = await auth();
    if (!session?.user) {
        return { success: false, error: "You must be logged in to clear the default persona." };
    }

    try {
        // Unset all default personas for the user
        await db.update(personas)
            .set({ isDefault: false })
            .where(eq(personas.userId, session.user.id!));

        return { success: true, message: "Default persona cleared successfully." };
    } catch (error) {
        console.error("Failed to clear default persona:", error);
        return { success: false, error: "Failed to clear default persona. Please try again." };
    }
}

export async function deletePersona(personaId: string) {
    // Step 1: Authenticate the user
    const session = await auth();
    if (!session?.user) {
        return { success: false, error: "You must be logged in to delete a persona." };
    }

    try {
        // Step 2: Find the persona and verify ownership
        const personaToDelete = await db.query.personas.findFirst({
            where: and(
                eq(personas.id, personaId),
                eq(personas.userId, session.user.id!)
            ),
        });

        if (!personaToDelete) {
            return { success: false, error: "Persona not found or you don't have permission to delete it." };
        }

        // Step 3: Delete the persona
        await db.delete(personas).where(eq(personas.id, personaId));

        // Step 5: Revalidate the profile page
        revalidatePath("/profile/persona");

        // Step 6: Return success result
        return { success: true, message: "Persona deleted successfully." };
    } catch (error) {
        // Step 4: Handle any errors
        console.error("Failed to delete persona:", error);
        return { success: false, error: "Failed to delete persona. Please try again." };
    }
}