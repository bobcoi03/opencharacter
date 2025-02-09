import { db } from "@/server/db";
import { subscriptions } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

export async function isUserPro(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;

  const subscription = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.status, "active"),
    ),
  });

  return !!subscription;
} 