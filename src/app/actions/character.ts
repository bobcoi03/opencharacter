import { db } from "@/server/db";
import { characters } from "@/server/db/schema";
import { auth } from "@/server/auth";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const runtime = "edge";

const CreateCharacterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tagline: z.string().min(1, "Tagline is required"),
  description: z.string().min(1, "Description is required"),
  greeting: z.string().min(1, "Greeting is required"),
  visibility: z.enum(["public", "private"]).optional().default("public"),
});

export async function createCharacter(formData: FormData) {
  "use server"
  const session = await auth();
  console.log("Session:", JSON.stringify(session, null, 2));

  if (!session || !session.user) {
    throw new Error("You must be logged in to create a character");
  }

  const formDataObject = Object.fromEntries(formData.entries());
  console.log("Form data:", formDataObject);

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
      createdAt: sql`CURRENT_TIMESTAMP`,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    }).returning();

    return { success: true, character: newCharacter[0] };
  } catch (error) {
    console.error("Error creating character:", error);
    return { success: false, error: "Failed to create character" };
  }
}