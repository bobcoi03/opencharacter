"use server"

import { auth } from "@/server/auth"
import { users } from "@/server/db/schema";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { uploadToR2 } from "@/lib/r2_storage";

export async function saveUser(formData: FormData) {
  try {
    // Get the current user session
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("User not authenticated");
    }

    const userId = session.user.id;

    // Extract data from formData
    const name = formData.get("name") as string;
    const bio = formData.get("bio") as string;
    const avatarFile = formData.get("avatar") as File | null;

    // Upload avatar if provided
    let avatarImageUrl = null;
    if (avatarFile && avatarFile.size > 0) {
      avatarImageUrl = await uploadToR2(avatarFile);
    }

    // Prepare update data
    const updateData: Partial<typeof users.$inferSelect> = {
      name,
      bio,
    };

    // Only include image if a new one was uploaded
    if (avatarImageUrl) {
      updateData.image = avatarImageUrl;
    }

    // Update user in the database
    await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId!));

    return { success: true, message: "User updated successfully" };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, message: "Failed to update user" };
  }
}