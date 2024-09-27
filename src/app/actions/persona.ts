"use server"

import { db } from "@/server/db";
import { personas } from "@/server/db/schema";
import { auth } from "@/server/auth";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

export async function CreatePersona(formData: FormData) {
    const session = await auth();
    if (!session?.user) {
        throw new Error("You must be logged in to create a persona.");
    }

    const displayName = formData.get("displayName") as string;
    const background = formData.get("background") as string;
    const isDefault = formData.get("isDefault") === "on";

    // Validate input
    if (!displayName || displayName.length > 20) {
        throw new Error("Display name is required and must be 20 characters or less.");
    }
    if (!background || background.length > 728*2) {
        throw new Error("Background is required and must be 728 characters or less.");
    }

    try {
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

    // Validate input
    if (!personaId) {
        throw new Error("Persona ID is required.");
    }
    if (!displayName || displayName.length > 20) {
        throw new Error("Display name is required and must be 20 characters or less.");
    }
    if (!background || background.length > 728) {
        throw new Error("Background is required and must be 728 characters or less.");
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

        // Update the persona
        const updatedPersona = await db.update(personas)
            .set({
                displayName,
                background,
                isDefault,
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