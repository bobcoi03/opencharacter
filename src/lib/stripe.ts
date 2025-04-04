import Stripe from 'stripe';

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