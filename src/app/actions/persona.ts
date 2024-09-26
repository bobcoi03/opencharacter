"use server"

import { db } from "@/server/db";
import { personas } from "@/server/db/schema";
import { auth } from "@/server/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

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
    if (!background || background.length > 728) {
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