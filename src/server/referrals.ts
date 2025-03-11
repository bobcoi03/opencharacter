import { db } from './db';
import { referrals, users } from './db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';

// Cookie names (must match those in middleware.ts)
const REFERRAL_CODE_COOKIE = 'referral_code';
const REFERRER_ID_COOKIE = 'referrer_id';

// Attribution window in milliseconds (30 days)
const ATTRIBUTION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Tracks a referral when a new user signs up
 * @param newUserId The ID of the newly registered user
 * @returns Promise<boolean> True if a referral was tracked, false otherwise
 */
export async function trackReferralOnSignup(newUserId: string): Promise<boolean> {
  try {
    // Get the cookie store
    const cookieStore = cookies();
    
    // Check if referral cookies exist
    const referralCode = cookieStore.get(REFERRAL_CODE_COOKIE)?.value;
    const referrerId = cookieStore.get(REFERRER_ID_COOKIE)?.value;
    
    // If no referral information, exit early
    if (!referralCode || !referrerId) {
      console.log('No referral cookies found for new user:', newUserId);
      return false;
    }
    
    // Verify the referrer exists
    const referrer = await db.query.users.findFirst({
      where: eq(users.id, referrerId),
      columns: {
        id: true,
        referral_link: true
      }
    });
    
    if (!referrer) {
      console.log('Referrer not found for ID:', referrerId);
      return false;
    }
    
    // Check if this referral already exists
    const existingReferral = await db.query.referrals.findFirst({
      where: and(
        eq(referrals.referrer_id, referrerId),
        eq(referrals.referred_id, newUserId)
      )
    });
    
    if (existingReferral) {
      console.log(`Referral already exists for user ${newUserId} referred by ${referrerId}`);
      return true;
    }
    
    // Calculate attribution expiration date (30 days from now)
    const now = Date.now();
    const attributionExpires = now + ATTRIBUTION_WINDOW_MS;
    
    // Create a new referral record using DrizzleORM with proper SQL types
    // @ts-ignore
    await db.insert(referrals).values({
      referrer_id: referrerId,
      referred_id: newUserId,
      signup_date: sql`${now}`,
      attribution_expires: sql`${attributionExpires}`,
      status: 'pending',
      total_earnings: 0,
      payment_history: '[]'
    });
    
    console.log(`Referral recorded: User ${newUserId} was referred by ${referrerId}`);
    return true;
  } catch (error) {
    console.error('Error tracking referral on signup:', error);
    return false;
  }
} 