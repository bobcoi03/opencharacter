"use server"

import { db } from "@/server/db";
import { characters } from "@/server/db/schema";
import { auth } from "@/server/auth";
import { z } from "zod";
import { sql } from "drizzle-orm";
import FileStorage from "@/lib/r2_storage";
import { eq } from "drizzle-orm";

const CreateCharacterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tagline: z.string().min(1, "Tagline is required"),
  description: z.string().min(1, "Description is required"),
  greeting: z.string().min(1, "Greeting is required"),
  visibility: z.enum(["public", "private"]).optional().default("public"),
  // New AI behavior fields
  temperature: z.coerce.number().min(0).max(2).optional().default(1.0),
  top_p: z.coerce.number().min(0).max(1).optional().default(1.0),
  top_k: z.coerce.number().int().min(0).optional().default(0),
  frequency_penalty: z.coerce.number().min(-2).max(2).optional().default(0.0),
  presence_penalty: z.coerce.number().min(-2).max(2).optional().default(0.0),
  repetition_penalty: z.coerce.number().min(0).max(2).optional().default(1.0),
  min_p: z.coerce.number().min(0).max(1).optional().default(0.0),
  top_a: z.coerce.number().min(0).max(1).optional().default(0.0),
  max_tokens: z.coerce.number().int().min(1).optional().default(600),
});

async function uploadToR2(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer); // Convert ArrayBuffer to Uint8Array
    const uniqueFilename = `${Date.now()}-${file.name}`; // Generate a unique filename
    const res = await FileStorage.put(uniqueFilename, uint8Array); // Use Uint8Array with unique filename
    if (res.status === 200) {
      return `https://pub-ee9c36333afb4a8abe1e26dcc310f8ec.r2.dev/${uniqueFilename}`; // Return the file URL
    }
  } catch (e) {
    console.error(e);
    throw new Error(String(e))
  }
  return ""
}

export async function createCharacter(formData: FormData) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("You must be logged in to create a character");
  }
  
  const formDataObject: { [key: string]: FormDataEntryValue } = Object.fromEntries(formData.entries());

  const validationResult = CreateCharacterSchema.safeParse(formDataObject);

  if (!validationResult.success) {
    console.error("Validation errors:", validationResult.error.errors);
    return { 
      success: false, 
      error: "Invalid form data", 
      details: validationResult.error.errors 
    };
  }

  const { 
    name, tagline, description, greeting, visibility,
    temperature, top_p, top_k, frequency_penalty, presence_penalty,
    repetition_penalty, min_p, top_a, max_tokens
  } = validationResult.data;

  try {
    let avatarImageUrl = null;
    const avatarFile = formData.get('avatar') as File | null;
    if (avatarFile && avatarFile.size > 0) {
      avatarImageUrl = await uploadToR2(avatarFile);
    }

    // @ts-ignore
    const newCharacter = await db.insert(characters).values({
      name,
      tagline,
      description,
      greeting,
      visibility,
      userId: session.user.id,
      tags: "[]", 
      interactionCount: 0,
      likeCount: 0,
      avatar_image_url: avatarImageUrl,
      createdAt: sql`CURRENT_TIMESTAMP`,
      updatedAt: sql`CURRENT_TIMESTAMP`,
      // New AI behavior fields
      temperature,
      top_p,
      top_k,
      frequency_penalty,
      presence_penalty,
      repetition_penalty,
      min_p,
      top_a,
      max_tokens,
    }).returning();

    return { success: true, character: newCharacter[0] };
  } catch (error) {
    console.error("Error creating character:", error);
    return { success: false, error: "Failed to create character", details: error };
  }
}

// Create a partial schema for updates
const UpdateCharacterSchema = CreateCharacterSchema.partial();

export async function updateCharacter(characterId: string, formData: FormData) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("You must be logged in to update a character");
  }
  
  const formDataObject = Object.fromEntries(formData.entries());

  const validationResult = UpdateCharacterSchema.safeParse(formDataObject);

  if (!validationResult.success) {
    console.error("Validation errors:", validationResult.error.errors);
    return { 
      success: false, 
      error: "Invalid form data", 
      details: validationResult.error.errors 
    };
  }

  const validatedData = validationResult.data;

  try {
    // Fetch the existing character to check ownership
    const existingCharacter = await db.select().from(characters).where(eq(characters.id, characterId)).limit(1);

    if (existingCharacter.length === 0) {
      return { success: false, error: "Character not found" };
    }

    if (existingCharacter[0].userId !== session.user.id) {
      return { success: false, error: "You don't have permission to update this character" };
    }

    let avatarImageUrl = existingCharacter[0].avatar_image_url;
    const avatarFile = formData.get('avatar') as File | null;
    if (avatarFile && avatarFile.size > 0) {
      avatarImageUrl = await uploadToR2(avatarFile);
    }

    // Prepare the update object
    const updateData: Partial<typeof characters.$inferSelect> = {
      ...validatedData,
      avatar_image_url: avatarImageUrl,
      updatedAt: new Date()
    };

    const updatedCharacter = await db.update(characters)
      .set(updateData)
      .where(eq(characters.id, characterId))
      .returning();

    return { success: true, character: updatedCharacter[0] };
  } catch (error) {
    console.error("Error updating character:", error);
    return { success: false, error: "Failed to update character", details: error };
  }
}