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
    console.log("[Subscription Check] Session:", session?.user?.id);
    
    if (!session?.user) {
      console.log("[Subscription Check] No authenticated user");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id as string;
    console.log("[Subscription Check] Checking subscription for userId:", userId);
    
    // Query the database for the user's subscription
    const userSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    console.log("[Subscription Check] Found subscriptions:", userSubscription.length);
    console.log("[Subscription Check] Subscription data:", JSON.stringify(userSubscription, null, 2));

    // Check if user has an active subscription (including trialing)
    const validStatuses = ['active', 'trialing'];
    const hasActiveSubscription = userSubscription.length > 0 && 
      validStatuses.includes(userSubscription[0].status) &&
      new Date(userSubscription[0].stripeCurrentPeriodEnd) > new Date();
    
    if (userSubscription.length > 0) {
      console.log("[Subscription Check] Subscription status:", userSubscription[0].status);
      console.log("[Subscription Check] Current period end:", userSubscription[0].stripeCurrentPeriodEnd);
      console.log("[Subscription Check] Current date:", new Date().toISOString());
      console.log("[Subscription Check] Is period valid?", new Date(userSubscription[0].stripeCurrentPeriodEnd) > new Date());
    }
    
    console.log("[Subscription Check] Final hasActiveSubscription:", hasActiveSubscription);
    
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