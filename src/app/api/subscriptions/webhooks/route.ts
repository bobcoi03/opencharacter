import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from "@/server/db";
import { subscriptions, referrals, type PaymentRecord } from "@/server/db/schema";
import { eq, and } from 'drizzle-orm';
import { sendAbandonedCartEmail } from '@/lib/email';
import { createRecoveryCoupon } from '@/lib/stripe';

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
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Checkout session expired: ${session.id}`);
        
        // Check if we have user email and userId in the session metadata
        if ((session.customer_email || session.metadata?.userEmail) && session.metadata?.userId) {
          try {
            // Generate a coupon code (e.g., 20% discount)
            const couponCode = await createRecoveryCoupon(stripe, session.metadata.userId);
            
            // Send recovery email with the coupon code
            await sendAbandonedCartEmail({
              email: session.customer_email ? session.customer_email : session.metadata?.userEmail,
              userId: session.metadata.userId,
              couponCode,
              sessionId: session.id
            });
            
            console.log(`Recovery email sent to ${session.customer_email} with coupon ${couponCode}`);
          } catch (error) {
            console.error('Error sending recovery email:', error);
            // Don't fail the webhook if email sending fails
          }
        }
        
        break;
      }
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

        // Handle referral commission if this user was referred
        try {
          // Find if this user was referred by someone
          const referral = await db.query.referrals.findFirst({
            where: eq(referrals.referred_id, session.metadata.userId),
          });

          if (referral) {
            console.log(`User ${session.metadata.userId} was referred by ${referral.referrer_id}`);
            
            // Calculate commission amount (e.g., 20% of the first payment)
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
            const amount = lineItems.data[0]?.amount_total || 0;
            const commissionRate = 0.20; // 20% commission
            const commissionAmount = (amount / 100) * commissionRate; // Convert from cents and apply rate
            
            // Create payment record
            const paymentRecord: PaymentRecord = {
              amount: commissionAmount,
              date: Date.now(),
              status: 'pending' as const, // Mark as pending until payout is processed
              transaction_id: session.id
            };
            
            // Get current payment history
            const currentPaymentHistory = referral.payment_history || [];
            
            // Update referral record with new payment and update total earnings
            await db
              .update(referrals)
              .set({
                payment_history: [...currentPaymentHistory, paymentRecord],
                total_earnings: referral.total_earnings + commissionAmount,
                pro_conversion_date: referral.pro_conversion_date || new Date(Date.now()), // Set conversion date if not already set
                status: 'active', // Update status to active since the referred user is now a paying customer
                updated_at: new Date()
              })
              .where(eq(referrals.id, referral.id));
              
            console.log(`Added commission payment of $${commissionAmount} to referrer ${referral.referrer_id}`);
          }
        } catch (error) {
          console.error('Error processing referral commission:', error);
          // Don't fail the webhook if referral processing fails
        }

        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.resumed':
      case 'customer.subscription.paused':
      case 'customer.subscription.pending_update_applied':
      case 'customer.subscription.pending_update_expired':
      case 'customer.subscription.trial_will_end':
      {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription ${event.type}: ${subscription.id}`);

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
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription deleted: ${subscription.id}`);

        // Update subscription status to cancelled in database
        await db
          .update(subscriptions)
          .set({
            status: subscription.status,
            cancelAtPeriodEnd: true,
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
