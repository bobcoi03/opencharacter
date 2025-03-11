import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/server/db'
import { users } from '@/server/db/schema'
import { eq } from 'drizzle-orm'

// Cookie names
const REFERRAL_CODE_COOKIE = 'referral_code'
const REFERRER_ID_COOKIE = 'referrer_id'

// Cookie expiration (30 days in seconds)
const COOKIE_EXPIRATION = 60 * 60 * 24 * 30

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Only process if this is a new session (no existing referral cookies)
  const hasReferralCookie = request.cookies.has(REFERRAL_CODE_COOKIE)
  const hasReferrerIdCookie = request.cookies.has(REFERRER_ID_COOKIE)
  
  // Get the referral code from the URL query parameter
  const { searchParams } = new URL(request.url)
  const refCode = searchParams.get('ref')
  
  // If there's a referral code in the URL and no existing referral cookies
  if (refCode && !hasReferralCookie && !hasReferrerIdCookie) {
    try {
      // Look up the user with this referral link
      const referralLink = `https://opencharacter.org?ref=${refCode}`
      const referrer = await db.query.users.findFirst({
        where: eq(users.referral_link, referralLink),
        columns: {
          id: true
        }
      })
      
      // If we found a valid referrer
      if (referrer && referrer.id) {
        // Set cookies with the referral information
        response.cookies.set({
          name: REFERRAL_CODE_COOKIE,
          value: refCode,
          maxAge: COOKIE_EXPIRATION,
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
        
        response.cookies.set({
          name: REFERRER_ID_COOKIE,
          value: referrer.id,
          maxAge: COOKIE_EXPIRATION,
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
        
        console.log(`Referral tracked: code=${refCode}, referrer_id=${referrer.id}`)
      }
    } catch (error) {
      console.error('Error processing referral:', error)
    }
  }
  
  return response
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - API routes (/api/*)
     * - Static files (/_next/*)
     * - Public files (/public/*)
     * - Favicon (favicon.ico)
     */
    '/((?!api|_next|public|favicon.ico).*)',
  ],
}