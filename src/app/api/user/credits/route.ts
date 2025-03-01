import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { user_credits } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "edge";

export async function GET() {
  const session = await auth();
  const user = session?.user;

  if (!user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Check if user has a credit record
    let userCredit = await db.query.user_credits.findFirst({
      where: eq(user_credits.userId, user.id),
    });

    // If no record exists, create one with 0 balance
    if (!userCredit) {
      await db.insert(user_credits).values({
        userId: user.id,
        balance: 0,
      });

      userCredit = {
        id: "",
        userId: user.id,
        balance: 0,
        lastUpdated: new Date(),
      };
    }

    return NextResponse.json({
      success: true,
      balance: userCredit.balance,
    });
  } catch (error) {
    console.error("Error fetching user credits:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 