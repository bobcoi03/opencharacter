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
  console.log('Middleware executing for URL:', request.url)
  const response = NextResponse.next()
  
  // Only process if this is a new session (no existing referral cookies)
  const hasReferralCookie = request.cookies.has(REFERRAL_CODE_COOKIE)
  const hasReferrerIdCookie = request.cookies.has(REFERRER_ID_COOKIE)
  
  console.log('Existing cookies check:', { 
    hasReferralCookie, 
    hasReferrerIdCookie,
    referralCookieValue: hasReferralCookie ? request.cookies.get(REFERRAL_CODE_COOKIE)?.value : null
  })
  
  // Get the referral code from the URL query parameter
  const { searchParams } = new URL(request.url)
  const refCode = searchParams.get('ref')
  console.log('Referral code from URL:', refCode)
  
  // If there's a referral code in the URL and no existing referral cookies
  if (refCode && !hasReferralCookie && !hasReferrerIdCookie) {
    console.log('Processing new referral with code:', refCode)
    try {
      // Look up the user with this referral link
      const referralLink = `https://opencharacter.org?ref=${refCode}`
      console.log('Looking up referral link:', referralLink)
      
      const referrer = await db.query.users.findFirst({
        where: eq(users.referral_link, referralLink),
        columns: {
          id: true
        }
      })
      
      console.log('Referrer lookup result:', referrer)
      
      // If we found a valid referrer
      if (referrer && referrer.id) {
        console.log('Valid referrer found, setting cookies for referrer ID:', referrer.id)
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
      } else {
        console.log('No valid referrer found for code:', refCode)
      }
    } catch (error) {
      console.error('Error processing referral:', error)
    }
  } else {
    console.log('Skipping referral processing:', { 
      hasRefCode: !!refCode, 
      hasExistingCookies: hasReferralCookie || hasReferrerIdCookie 
    })
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