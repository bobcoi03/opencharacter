import { NextResponse } from 'next/server';
import Stripe from 'stripe'
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { stripe_customer_id } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "edge"

export async function POST(request: Request) {
    const session = await auth();
    const user = session?.user;

    if (!user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json() as { priceId: string };

    if (!body.priceId) {
        return new NextResponse("Price ID is required", { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

    // Check if customer already exists
    const existingCustomer = await db.query.stripe_customer_id.findFirst({
        where: eq(stripe_customer_id.userId, user.id)
    });

    let stripeCustomerId: string;

    if (existingCustomer) {
        stripeCustomerId = existingCustomer.stripeCustomerId;
    } else {
        // Create new customer
        const customer = await stripe.customers.create({
            email: user.email || undefined,
            name: user.name || undefined,
            metadata: {
                userId: user.id
            }
        });

        // Store customer ID
        await db.insert(stripe_customer_id).values({
            userId: user.id,
            stripeCustomerId: customer.id
        });

        stripeCustomerId = customer.id;
    }

    if (!stripeCustomerId) {
        return new NextResponse("Failed to create or retrieve Stripe customer", { status: 500 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
        success_url: 'https://opencharacter.org/subscription',
        customer: stripeCustomerId,
        allow_promotion_codes: true,
        line_items: [
            {
                price: body.priceId,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        metadata: {
            userId: user.id,
            stripeCustomerId: stripeCustomerId,
            userEmail: user.email || '',
            userName: user.name || ''
        },
        subscription_data: {
            trial_period_days: 3
        },
        expires_at: Math.floor(Date.now() / 1000) + (60 * 30), // Configured to expire after 30 minutes
    });
    return NextResponse.json({ url: checkoutSession.url });
}
