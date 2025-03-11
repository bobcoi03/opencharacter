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

// Helper function to set cookies in a way that works in both development and production
function setCookie(response: NextResponse, name: string, value: string) {
  // Get the current environment and hostname
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Set the cookie with appropriate settings for the environment
  response.cookies.set({
    name,
    value,
    maxAge: COOKIE_EXPIRATION,
    path: '/',
    // Use 'none' for Cloudflare Pages in production to ensure cross-domain functionality
    sameSite: isProduction ? 'none' : 'lax',
    secure: true, // Always use secure in both environments for consistency
    httpOnly: true,
  })
  
  return response
}

export async function middleware(request: NextRequest) {
  console.log('Middleware executing for URL:', request.url)
  console.log('Environment:', process.env.NODE_ENV)
  console.log('Hostname:', request.headers.get('host'))
  
  let response = NextResponse.next()
  
  // Only process if this is a new session (no existing referral cookies)
  const hasReferralCookie = request.cookies.has(REFERRAL_CODE_COOKIE)
  const hasReferrerIdCookie = request.cookies.has(REFERRER_ID_COOKIE)
  
  console.log('Existing cookies check:', { 
    hasReferralCookie, 
    hasReferrerIdCookie,
    referralCookieValue: hasReferralCookie ? request.cookies.get(REFERRAL_CODE_COOKIE)?.value : null,
    allCookies: Array.from(request.cookies.getAll()).map(c => c.name)
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
        response = setCookie(response, REFERRAL_CODE_COOKIE, refCode)
        
        response = setCookie(response, REFERRER_ID_COOKIE, referrer.id)
        
        console.log(`Referral tracked: code=${refCode}, referrer_id=${referrer.id}`)
        
        // Verify cookies were set in the response
        const cookieHeader = response.headers.get('Set-Cookie')
        console.log('Set-Cookie header:', cookieHeader)
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
  
  // Final check of response headers before returning
  const finalCookieHeader = response.headers.get('Set-Cookie')
  if (finalCookieHeader) {
    console.log('Final Set-Cookie header:', finalCookieHeader)
  } else {
    console.log('No Set-Cookie header in final response')
  }
  
  return response
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}