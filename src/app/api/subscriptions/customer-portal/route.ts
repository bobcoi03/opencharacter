import { NextResponse } from 'next/server';
import Stripe from 'stripe'
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { stripe_customer_id } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "edge"

export async function POST() {
    const session = await auth();
    const user = session?.user;

    if (!user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

    // Check if customer exists in our database
    const customerData = await db.query.stripe_customer_id.findFirst({
        where: eq(stripe_customer_id.userId, user.id)
    });

    if (!customerData?.stripeCustomerId) {
        return new NextResponse("No Stripe customer found", { status: 404 });
    }

    // Create customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerData.stripeCustomerId,
        return_url: `http://localhost:3000/subscription`,
    });

    return NextResponse.json({ url: portalSession.url });
}
