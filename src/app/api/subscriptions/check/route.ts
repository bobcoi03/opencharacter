import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { subscriptions } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/server/auth";

export const runtime = "edge";

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      console.log("No authenticated user found");
      return NextResponse.json(
        { subscribed: false },
        { status: 401 }
      );
    }
    // Check if user has an active subscription
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, session.user.id),
    });

    const isSubscribed = subscription?.status === "active" || subscription?.status === "trialing";

    return NextResponse.json(
      { 
        subscribed: isSubscribed,
        subscription: isSubscribed ? subscription : null
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking subscription:", error);
    console.error("Error details:", {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 