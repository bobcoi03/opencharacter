import { db } from "@/server/db";
import { user_daily_requests } from "@/server/db/schema";
import { and, eq, sql } from "drizzle-orm";

const FREE_TIER_DAILY_LIMIT = 200;

export async function checkAndIncrementRequestCount(userId: string) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  // Get or create today's record
  let record = await db.query.user_daily_requests.findFirst({
    where: and(
      eq(user_daily_requests.userId, userId),
      eq(user_daily_requests.date, today)
    ),
  });

  if (!record) {
    // Create new record for today
    [record] = await db.insert(user_daily_requests)
      .values({
        userId,
        date: today,
        requestCount: 1,
      })
      .returning();
    
    return {
      remainingRequests: FREE_TIER_DAILY_LIMIT - 1,
      totalRequests: 1
    };
  }

  if (record.requestCount >= FREE_TIER_DAILY_LIMIT) {
    throw new Error("Daily request limit exceeded. Go touch grass or upgrade to continue.");
  }

  // Increment count
  const [updated] = await db.update(user_daily_requests)
    .set({
      requestCount: sql`${user_daily_requests.requestCount} + 1`,
      updatedAt: new Date()
    })
    .where(eq(user_daily_requests.id, record.id))
    .returning();

  return {
    remainingRequests: FREE_TIER_DAILY_LIMIT - updated.requestCount,
    totalRequests: updated.requestCount
  };
}

export async function getRemainingRequests(userId: string) {
  const today = new Date().toISOString().split('T')[0];

  const record = await db.query.user_daily_requests.findFirst({
    where: and(
      eq(user_daily_requests.userId, userId),
      eq(user_daily_requests.date, today)
    ),
  });

  const currentCount = record?.requestCount ?? 0;
  
  return {
    remainingRequests: Math.max(0, FREE_TIER_DAILY_LIMIT - currentCount),
    totalRequests: currentCount
  };
} 