import { NextResponse } from 'next/server';
import Stripe from 'stripe'

export const runtime = "edge"

export async function POST() {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

    const session = await stripe.checkout.sessions.create({
        success_url: 'https://example.com/success',
        line_items: [
            {
                price: "price_1QeXFIAT8u0C5FCyFREFPlYJ",
                quantity: 1,
            },
        ],
        mode: 'subscription',
    });

    return NextResponse.json({ url: session.url });
}
