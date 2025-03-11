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

export async function getPayAsYouGo() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      throw new Error("User not authenticated");
    }

    const userId = session.user.id;

    const result = await db.select({ pay_as_you_go: users.pay_as_you_go })
      .from(users)
      .where(eq(users.id, userId!))
      .get();

    return { 
      success: true, 
      pay_as_you_go: result?.pay_as_you_go || false 
    };
  } catch (error) {
    console.error("Error fetching pay-as-you-go status:", error);
    return { success: false, pay_as_you_go: false };
  }
}

export async function updatePayAsYouGo(payAsYouGo: boolean) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      throw new Error("User not authenticated");
    }

    const userId = session.user.id;

    await db.update(users)
      .set({ pay_as_you_go: payAsYouGo })
      .where(eq(users.id, userId!));

    return { success: true, message: "Pay-as-you-go updated successfully" };
  } catch (error) {
    console.error("Error updating pay-as-you-go:", error);
    return { success: false, message: "Failed to update pay-as-you-go" };
  }
}

export async function deleteUser() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      throw new Error("User not authenticated");
    }

    const userId = session.user.id;

    // Delete the user from the database
    await db.delete(users)
      .where(eq(users.id, userId!));

    return { success: true, message: "User account deleted successfully" };
  } catch (error) {
    console.error("Error deleting user account:", error);
    return { success: false, message: "Failed to delete user account" };
  }
}