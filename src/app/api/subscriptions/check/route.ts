import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { subscriptions } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "edge";

export async function GET() {
  try {
    // Get the authenticated user
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id as string;
    
    // Query the database for the user's subscription
    const userSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);



    // Check if user has an active subscription (including trialing)
    const validStatuses = ['active', 'trialing'];
    const hasActiveSubscription = userSubscription.length > 0 && 
      validStatuses.includes(userSubscription[0].status) &&
      new Date(userSubscription[0].stripeCurrentPeriodEnd) > new Date();
        
    return NextResponse.json({
      hasActiveSubscription,
      subscription: hasActiveSubscription ? {
        status: userSubscription[0].status,
        planType: userSubscription[0].planType,
        currentPeriodEnd: userSubscription[0].stripeCurrentPeriodEnd,
        cancelAtPeriodEnd: userSubscription[0].cancelAtPeriodEnd
      } : null
    });
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return NextResponse.json(
      { hasActiveSubscription: false },
      { status: 200 }
    );
  }
} 