import Stripe from 'stripe';
import { db } from "@/server/db";
import { stripe_customer_id } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Ensures a valid Stripe customer exists for the given user.
 * If the stored customer ID doesn't exist in Stripe, creates a new customer and updates the DB.
 */
export async function ensureStripeCustomer(userId: string, userEmail?: string, userName?: string): Promise<string> {
  // Check if customer exists in our database
  const existingCustomer = await db.query.stripe_customer_id.findFirst({
    where: eq(stripe_customer_id.userId, userId)
  });

  if (existingCustomer) {
    // Verify the customer still exists in Stripe
    try {
      await stripe.customers.retrieve(existingCustomer.stripeCustomerId);
      return existingCustomer.stripeCustomerId;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError && error.code === 'resource_missing') {
        console.log(`Customer ${existingCustomer.stripeCustomerId} not found in Stripe, creating new customer for user ${userId}`);
        
        // Create new customer in Stripe
        const newCustomer = await stripe.customers.create({
          email: userEmail || undefined,
          name: userName || undefined,
          metadata: {
            userId: userId
          }
        });

        // Update the database with the new customer ID
        await db.update(stripe_customer_id)
          .set({ stripeCustomerId: newCustomer.id })
          .where(eq(stripe_customer_id.userId, userId));

        return newCustomer.id;
      }
      // Re-throw other errors
      throw error;
    }
  } else {
    // No customer record exists, create both customer and database record
    const newCustomer = await stripe.customers.create({
      email: userEmail || undefined,
      name: userName || undefined,
      metadata: {
        userId: userId
      }
    });

    // Store customer ID in database
    await db.insert(stripe_customer_id).values({
      userId: userId,
      stripeCustomerId: newCustomer.id
    });

    return newCustomer.id;
  }
}

export async function createRecoveryCoupon(stripe: Stripe, userId: string): Promise<string> {
  // Generate a unique code with user ID and timestamp
  const uniqueId = `${userId.substring(0, 6)}-${Date.now().toString(36)}`;
  const id = `COMEBACK-${uniqueId}`.toUpperCase();
  
  // Create a coupon in Stripe that gives 20% off and expires in 48 hours
  const coupon = await stripe.coupons.create({
    id: id,
    percent_off: 20,
    duration: 'repeating',
    duration_in_months: 3,
    max_redemptions: 1, // Can only be used once
    redeem_by: Math.floor(Date.now() / 1000) + (48 * 60 * 60), // 48 hours from now
    metadata: {
      userId,
      recoveryType: 'abandoned_checkout'
    },
  });

  const promotionCode = await stripe.promotionCodes.create({
    coupon: coupon.id,
  })
  return promotionCode.code;
} 