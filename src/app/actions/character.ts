"use server"

import { db } from "@/server/db";
import { characters } from "@/server/db/schema";
import { auth } from "@/server/auth";
import { z } from "zod";
import { sql } from "drizzle-orm";
import FileStorage from "@/lib/r2_storage";


const CreateCharacterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tagline: z.string().min(1, "Tagline is required"),
  description: z.string().min(1, "Description is required"),
  greeting: z.string().min(1, "Greeting is required"),
  visibility: z.enum(["public", "private"]).optional().default("public"),
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
  
  const formDataObject = Object.fromEntries(formData.entries());

  const validationResult = CreateCharacterSchema.safeParse(formDataObject);

  if (!validationResult.success) {
    console.error("Validation errors:", validationResult.error.errors);
    return { 
      success: false, 
      error: "Invalid form data", 
      details: validationResult.error.errors 
    };
  }

  const { name, tagline, description, greeting, visibility } = validationResult.data;

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
    }).returning();

    return { success: true, character: newCharacter[0] };
  } catch (error) {
    console.error("Error creating character:", error);
    return { success: false, error: "Failed to create character", details: error };
  }
}