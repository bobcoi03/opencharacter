"use server";

import { db } from "@/server/db";
import { socialSubmissions } from "@/server/db/schema";
import { revalidatePath } from "next/cache";

export async function submitContent(formData: FormData) {
  try {
    const name = formData.get("name");
    const email = formData.get("email");
    const socialLinks = formData.get("socialLinks");
    const message = formData.get("message");

    // Validate required fields
    if (!name || !email || !socialLinks) {
      return {
        error: "Please fill in all required fields"
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.toString())) {
      return {
        error: "Please enter a valid email address"
      };
    }

    // Create submission
    await db.insert(socialSubmissions).values({
      name: name.toString(),
      email: email.toString(),
      text: `Links: ${socialLinks.toString()}${message ? `\n\nMessage: ${message.toString()}` : ''}`
    });

    // Revalidate the page to show success message
    revalidatePath("/thank-you-for-submitting");

    return {
      success: "Thanks for your submission! We'll review it and get back to you soon."
    };

  } catch (error) {
    console.error("Error submitting content:", error);
    return {
      error: "Something went wrong. Please try again."
    };
  }
}