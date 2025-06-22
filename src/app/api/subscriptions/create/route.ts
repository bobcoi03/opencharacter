import { NextResponse } from 'next/server';
import { auth } from "@/server/auth";
import { ensureStripeCustomer, stripe } from "@/lib/stripe";

export const runtime = "edge"

export async function POST(request: Request) {
    const session = await auth();
    const user = session?.user;

    if (!user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as { priceId: string };

    if (!body.priceId) {
        return NextResponse.json({ error: "Price ID is required" }, { status: 400 });
    }

    try {
        // Ensure a valid Stripe customer exists
        const stripeCustomerId = await ensureStripeCustomer(
            user.id,
            user.email || undefined,
            user.name || undefined
        );

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
    } catch (error) {
        console.error('Error creating checkout session:', error);
        return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }
}
