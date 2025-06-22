import { NextResponse } from 'next/server';
import { auth } from "@/server/auth";
import { ensureStripeCustomer, stripe } from "@/lib/stripe";

export const runtime = "edge";

export async function POST() {
    const session = await auth();
    const user = session?.user;

    if (!user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Ensure a valid Stripe customer exists
        const stripeCustomerId = await ensureStripeCustomer(
            user.id,
            user.email || undefined,
            user.name || undefined
        );

        // Create customer portal session
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: `https://opencharacter.org/subscription`,
        });

        return NextResponse.json({ url: portalSession.url });
    } catch (error) {
        console.error('Error creating customer portal session:', error);
        return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
    }
}
