import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from "@/server/db";
import { user_credits } from "@/server/db/schema";
import { eq } from 'drizzle-orm';

export const runtime = 'edge';

export async function POST(request: Request) {
  console.log('Payment webhook received');
  
  try {
    // Get the raw body as text
    const text = await request.text();
    
    // Retrieve the Stripe signature from the headers
    const sig = request.headers.get('stripe-signature') || '';
    const webhookSecret = process.env.STRIPE_PAYMENT_WEBHOOK_SECRET!;

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
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment intent succeeded: ${paymentIntent.id}`);

        // Extract user and credit information from metadata
        const userId = paymentIntent.metadata?.userId;
        const creditAmount = parseFloat(paymentIntent.metadata?.creditAmount || '0');

        if (!userId || !creditAmount) {
          console.error('Missing required payment data');
          return new NextResponse('Missing required payment data', { status: 400 });
        }

        // Update user's credit balance
        // Check if user has a credit record
        const userCredit = await db.query.user_credits.findFirst({
          where: eq(user_credits.userId, userId),
        });

        if (userCredit) {
          // Update existing record
          await db.update(user_credits)
            .set({ 
              balance: userCredit.balance + creditAmount,
              lastUpdated: new Date()
            })
            .where(eq(user_credits.userId, userId));
        } else {
          // Create new record
          await db.insert(user_credits).values({
            userId: userId,
            balance: creditAmount,
          });
        }

        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment failed: ${paymentIntent.id}`);
        // You could implement additional logic here, like notifying the user
        break;
      }
      default:
        console.warn(`Unhandled payment event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
    
  } catch (err: any) {
    console.error(`Payment webhook error: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }
} 