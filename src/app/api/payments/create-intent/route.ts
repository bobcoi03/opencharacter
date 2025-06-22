import { NextResponse } from 'next/server';
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { user_credits } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { ensureStripeCustomer, stripe } from "@/lib/stripe";
import Stripe from 'stripe';

export const runtime = "edge";

export async function POST(request: Request) {
    const session = await auth();
    const user = session?.user;

    if (!user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as { amount: number };

    if (!body.amount || body.amount < 5 || body.amount > 100000) {
        return NextResponse.json({ error: "Amount must be between $5 and $100000" }, { status: 400 });
    }

    try {
        // Ensure a valid Stripe customer exists
        const stripeCustomerId = await ensureStripeCustomer(
            user.id,
            user.email || undefined,
            user.name || undefined
        );

        // Get customer's payment methods
        const paymentMethods = await stripe.paymentMethods.list({
            customer: stripeCustomerId,
            type: 'card',
        });
        
        if (paymentMethods.data.length === 0) {
            return NextResponse.json({ error: "No payment method on file" }, { status: 400 });
        }

        // Create a payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(body.amount * 100), // Convert to cents
            currency: 'usd',
            customer: stripeCustomerId,
            payment_method: paymentMethods.data[0].id, // Use the first payment method
            off_session: true,
            confirm: true, // Confirm the payment immediately
            metadata: {
                userId: user.id,
                userEmail: user.email || '',
                userName: user.name || '',
                creditAmount: body.amount.toString()
            }
        });

        // If payment is successful, update user's credit balance
        if (paymentIntent.status === 'succeeded') {
            // Check if user has a credit record
            const userCredit = await db.query.user_credits.findFirst({
                where: eq(user_credits.userId, user.id),
            });

            if (userCredit) {
                // Update existing record
                await db.update(user_credits)
                    .set({ 
                        balance: userCredit.balance + body.amount,
                        lastUpdated: new Date()
                    })
                    .where(eq(user_credits.userId, user.id));
            } else {
                // Create new record
                await db.insert(user_credits).values({
                    userId: user.id,
                    balance: body.amount,
                });
            }
        }

        return NextResponse.json({ 
            success: true,
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        if (error instanceof Stripe.errors.StripeError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to process payment" }, { status: 500 });
    }
} 