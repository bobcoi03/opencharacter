import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { stripe_customer_id, user_credits } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "edge";

export async function POST(request: Request) {
    const session = await auth();
    const user = session?.user;

    if (!user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json() as { amount: number };

    if (!body.amount || body.amount < 5 || body.amount > 100000) {
        return new NextResponse("Amount must be between $5 and $100000", { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    // Check if customer already exists
    const existingCustomer = await db.query.stripe_customer_id.findFirst({
        where: eq(stripe_customer_id.userId, user.id)
    });

    if (!existingCustomer?.stripeCustomerId) {
        return new NextResponse("No payment method on file", { status: 400 });
    }

    // Create a payment intent without specifying a payment method
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(body.amount * 100), // Convert to cents
            currency: 'usd',
            customer: existingCustomer.stripeCustomerId,
            // Don't specify payment_method here to support Link
            // Don't use off_session or confirm for Link compatibility
            setup_future_usage: 'off_session', // This allows reusing the payment method later
            automatic_payment_methods: {
                enabled: true, // This enables all payment methods including Link
            },
            metadata: {
                userId: user.id,
                userEmail: user.email || '',
                userName: user.name || '',
                creditAmount: body.amount.toString()
            }
        });

        // Return the client secret so the frontend can handle the payment flow
        return NextResponse.json({ 
            success: true,
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
            status: paymentIntent.status
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        if (error instanceof Stripe.errors.StripeError) {
            return new NextResponse(error.message, { status: 400 });
        }
        return new NextResponse("Failed to process payment", { status: 500 });
    }
} 