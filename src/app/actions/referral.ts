"use server"

import { auth } from "@/server/auth"
import { users, referrals } from "@/server/db/schema"
import { db } from "@/server/db"
import { eq, desc } from "drizzle-orm"
import { nanoid } from "nanoid"

/**
 * Interface for referral user data
 */
interface ReferralUserData {
  referralLink: string | null;
  paypalEmail: string | null;
  referralCode: string | null;
}

/**
 * Gets the current user's referral data including referral link and PayPal email
 * @returns Object with success status, message, and referral data
 */
export async function getUserReferralData(): Promise<{ 
  success: boolean; 
  message: string; 
  data?: ReferralUserData 
}> {
  try {
    // Get the current user session
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return { success: false, message: "User not authenticated" }
    }

    const userId = session.user.id

    // Get user's referral data
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        referral_link: true,
        paypal_email: true
      }
    })

    if (!user) {
      return { success: false, message: "User not found" }
    }

    // Extract referral code from the link if it exists
    let referralCode = null
    if (user.referral_link) {
      const codeMatch = user.referral_link.match(/\?ref=(.+)$/);
      if (codeMatch && codeMatch[1]) {
        referralCode = codeMatch[1];
      }
    }

    return { 
      success: true, 
      message: "Referral data retrieved successfully", 
      data: {
        referralLink: user.referral_link || null,
        paypalEmail: user.paypal_email || null,
        referralCode: referralCode
      }
    }
  } catch (error) {
    console.error("Error getting referral data:", error)
    return { success: false, message: "Failed to get referral data" }
  }
}

/**
 * Sets a unique referral link for the authenticated user
 * @returns Object with success status and message
 */
export async function setUserReferralLink() {
  try {
    // Get the current user session
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return { success: false, message: "User not authenticated" }
    }

    const userId = session.user.id

    // Check if user already has a referral link
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        referral_link: true,
        name: true,
        email: true
      }
    })

    // If user already has a referral link, return it
    if (user?.referral_link) {
      return { 
        success: true, 
        message: "Referral link already exists", 
        referralLink: user.referral_link 
      }
    }

    // Generate a referral code based on username or email
    let referralCode = ""
    
    if (user?.name) {
      // Use the user's name, removing spaces and special characters
      referralCode = user.name.toLowerCase().replace(/[^a-z0-9]/g, "")
    } else if (user?.email) {
      // Use the part of the email before @ symbol
      referralCode = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, "")
    } else {
      // Fallback to a random code if no name or email is available
      referralCode = nanoid(8)
    }
    
    const referralLink = `https://opencharacter.org/?ref=${referralCode}`

    // Update user with the new referral link
    await db.update(users)
      .set({ referral_link: referralLink })
      .where(eq(users.id, userId))

    return { 
      success: true, 
      message: "Referral link created successfully", 
      referralLink 
    }
  } catch (error) {
    console.error("Error setting referral link:", error)
    return { success: false, message: "Failed to set referral link" }
  }
}

/**
 * Updates the user's PayPal email
 * @param paypalEmail - The PayPal email to set
 * @returns Object with success status and message
 */
export async function updatePaypalEmail(paypalEmail: string) {
  try {
    // Get the current user session
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return { success: false, message: "User not authenticated" }
    }

    const userId = session.user.id

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(paypalEmail)) {
      return { success: false, message: "Invalid email format" }
    }

    // Update user with the new PayPal email
    await db.update(users)
      .set({ paypal_email: paypalEmail })
      .where(eq(users.id, userId))

    return { 
      success: true, 
      message: "PayPal email updated successfully" 
    }
  } catch (error) {
    console.error("Error updating PayPal email:", error)
    return { success: false, message: "Failed to update PayPal email" }
  }
}

/**
 * Updates the user's referral code
 * @param referralCode - The custom referral code to set
 * @returns Object with success status, message, and updated referral link
 */
export async function updateReferralCode(referralCode: string) {
  try {
    // Get the current user session
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return { success: false, message: "User not authenticated" }
    }

    const userId = session.user.id

    // Validate referral code format (alphanumeric only)
    const codeRegex = /^[a-zA-Z0-9]+$/
    if (!codeRegex.test(referralCode)) {
      return { success: false, message: "Referral code can only contain letters and numbers" }
    }

    // Create the new referral link
    const referralLink = `https://opencharacter.org/?ref=${referralCode}`

    // Update user with the new referral link
    await db.update(users)
      .set({ referral_link: referralLink })
      .where(eq(users.id, userId))

    return { 
      success: true, 
      message: "Referral code updated successfully",
      referralLink
    }
  } catch (error) {
    console.error("Error updating referral code:", error)
    return { success: false, message: "Failed to update referral code" }
  }
}

/**
 * Updates the user's referral settings (both referral link and PayPal email)
 * @param data - Object containing referral settings
 * @returns Object with success status and message
 */
export async function updateReferralSettings(data: { paypalEmail: string, referralCode?: string }) {
  try {
    // Get the current user session
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return { success: false, message: "User not authenticated" }
    }

    const userId = session.user.id
    
    // Get current user data
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        referral_link: true
      }
    })
    
    // Handle referral code/link
    let referralLink = user?.referral_link
    
    if (data.referralCode) {
      // Validate referral code format (alphanumeric only)
      const codeRegex = /^[a-zA-Z0-9]+$/
      if (!codeRegex.test(data.referralCode)) {
        return { success: false, message: "Referral code can only contain letters and numbers" }
      }
      
      // Create new referral link with custom code
      referralLink = `https://opencharacter.org/?ref=${data.referralCode}`
    } else if (!referralLink) {
      // Generate referral link if it doesn't exist
      const result = await setUserReferralLink()
      if (result.success) {
        referralLink = result.referralLink
      }
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.paypalEmail)) {
      return { success: false, message: "Invalid email format" }
    }

    // Update user with the new settings
    await db.update(users)
      .set({ 
        paypal_email: data.paypalEmail,
        referral_link: referralLink
      })
      .where(eq(users.id, userId))

    return { 
      success: true, 
      message: "Referral settings updated successfully",
      referralLink
    }
  } catch (error) {
    console.error("Error updating referral settings:", error)
    return { success: false, message: "Failed to update referral settings" }
  }
}

/**
 * Gets the referral statistics and history for the current user
 * @returns Object with success status, message, and referral statistics/history
 */
export async function getUserReferralStats(): Promise<{
  success: boolean;
  message: string;
  stats?: {
    totalReferred: number;
    proSubscribers: number;
    totalEarnings: number;
    pendingPayment: number;
    lastPaymentDate: string | null;
    lastPaymentAmount: number | null;
  };
  referralHistory?: Array<{
    id: string;
    user?: string; // Now optional
    date: string;
    status: 'free' | 'pro';
    earnings: number;
  }>;
  paymentHistory?: Array<{
    id: string;
    date: string;
    amount: number;
    status: string;
  }>;
}> {
  try {
    console.log("Starting getUserReferralStats function")
    
    // Get the current user session
    const session = await auth()
    console.log("User session:", session?.user?.id ? `User ID: ${session.user.id}` : "No user session")
    
    if (!session || !session.user || !session.user.id) {
      console.log("Authentication failed: No valid user session")
      return { success: false, message: "User not authenticated" }
    }

    const userId = session.user.id
    console.log("Fetching referrals for user ID:", userId)

    // Get referrals from the database
    const referralsData = await db.query.referrals.findMany({
      where: eq(referrals.referrer_id, userId),
      orderBy: (referrals, { desc }) => [desc(referrals.signup_date)],
      with: {
        referred: true
      }
    }).catch(error => {
      console.error("Error querying referrals with relations:", error);
      // Fallback to query without relations if there's an error
      return db.query.referrals.findMany({
        where: eq(referrals.referrer_id, userId),
        orderBy: (referrals, { desc }) => [desc(referrals.signup_date)]
      });
    });
    
    console.log(`Found ${referralsData.length} referrals for user`)

    if (!referralsData || referralsData.length === 0) {
      console.log("No referrals found for user")
      return { 
        success: true, 
        message: "No referrals found",
        stats: {
          totalReferred: 0,
          proSubscribers: 0,
          totalEarnings: 0,
          pendingPayment: 0,
          lastPaymentDate: null,
          lastPaymentAmount: null
        },
        referralHistory: [],
        paymentHistory: []
      }
    }

    // Calculate statistics
    const totalReferred = referralsData.length
    const proSubscribers = referralsData.filter(ref => ref.status === 'active').length
    const totalEarnings = referralsData.reduce((sum, ref) => sum + (ref.total_earnings || 0), 0)
    
    console.log("Stats calculated:", { totalReferred, proSubscribers, totalEarnings })
    
    // Get payment history (most recent payments first)
    const paymentHistory = referralsData
      .filter(ref => ref.last_payment_date && ref.last_payment_amount && ref.last_payment_status === 'paid')
      .map(ref => ({
        id: ref.id,
        date: new Date(ref.last_payment_date!).toISOString().split('T')[0],
        amount: ref.last_payment_amount!,
        status: ref.last_payment_status!
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    console.log(`Found ${paymentHistory.length} payment records`)
    
    // Calculate pending payment (earnings not yet paid)
    const pendingPayment = totalEarnings - paymentHistory.reduce((sum, payment) => sum + payment.amount, 0)
    
    // Get last payment info
    const lastPayment = paymentHistory[0] || null
    console.log("Last payment:", lastPayment)
    
    // Format referral history
    console.log("Building referral history")
    const referralHistory = await Promise.all(referralsData.map(async (ref) => {
      // Determine status based on the referral status
      const status: 'free' | 'pro' = ref.status === 'active' ? 'pro' : 'free';
      
      return {
        id: ref.id,
        user: '', // No longer sending user email data
        date: new Date(ref.signup_date).toISOString().split('T')[0],
        status,
        earnings: ref.total_earnings || 0
      };
    }));

    console.log("Referral history built, returning complete stats")
    return {
      success: true,
      message: "Referral statistics retrieved successfully",
      stats: {
        totalReferred,
        proSubscribers,
        totalEarnings,
        pendingPayment,
        lastPaymentDate: lastPayment?.date || null,
        lastPaymentAmount: lastPayment?.amount || null
      },
      referralHistory,
      paymentHistory
    }
  } catch (error) {
    console.error("Error getting referral statistics:", error)
    return { success: false, message: "Failed to get referral statistics" }
  }
}
