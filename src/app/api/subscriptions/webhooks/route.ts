import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from "@/server/db";
import { subscriptions } from "@/server/db/schema";
import { eq } from 'drizzle-orm';

export const runtime = 'edge';

export async function POST(request: Request) {
  console.log('Webhook received');
  
  try {
    // Get the raw body as text
    const text = await request.text();
    
    // Retrieve the Stripe signature from the headers
    const sig = request.headers.get('stripe-signature') || '';
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    // Use the raw text directly with Stripe's webhook construction
    const event = await stripe.webhooks.constructEventAsync(
      text,
      sig,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider()
    );

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Checkout session completed: ${session.id}`);

        if (!session.subscription || !session.customer || !session.metadata?.userId) {
          console.error('Missing required subscription data');
          return new NextResponse('Missing required subscription data', { status: 400 });
        }

        // Retrieve the subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        
        // Upsert subscription record
        await db
          .insert(subscriptions)
          .values({
            userId: session.metadata.userId,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodStart: new Date(subscription.current_period_start * 1000),
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            status: subscription.status as string,
            planType: "basic",
            cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end)
          } as typeof subscriptions.$inferInsert)
          .onConflictDoUpdate({
            target: subscriptions.userId,
            set: {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: subscription.id,
              stripePriceId: subscription.items.data[0].price.id,
              stripeCurrentPeriodStart: new Date(subscription.current_period_start * 1000),
              stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
              status: subscription.status as string,
              planType: "basic",
              cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
              updatedAt: new Date()
            }
          });

        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription updated: ${JSON.stringify(subscription)}`);

        // Update subscription in database
        await db
          .update(subscriptions)
          .set({
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodStart: new Date(subscription.current_period_start * 1000),
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            status: subscription.status,
            cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
            updatedAt: new Date()
          })
          .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

        break;
      }
      default:
        console.warn(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
    
  } catch (err: any) {
    console.error(`Error message: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }
}
