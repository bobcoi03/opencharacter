import { type NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/server/auth'; // Import signIn from our auth config
import { AuthError } from 'next-auth';

// Define the binding type for Cloudflare KV
interface Env {
  AUTH_KV: KVNamespace;
}

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const env = process.env as unknown as Env;

  if (!token) {
    // Redirect to an error page or sign-in page
    return NextResponse.redirect(new URL('/signin?error=VerificationMissingToken', req.url));
  }

   if (!env.AUTH_KV) {
     console.error("AUTH_KV namespace not bound.");
     // Redirect to an error page or sign-in page
     return NextResponse.redirect(new URL('/signin?error=ServerConfigurationError', req.url));
  }

  try {
    // 1. Verify token in KV
    const storedValue = await env.AUTH_KV.get(token);
    if (!storedValue) {
      console.log(`Verification token not found or expired: ${token}`);
      // Optionally delete here just in case, although TTL should handle expiration
      await env.AUTH_KV.delete(token);
      return NextResponse.redirect(new URL('/signin?error=VerificationInvalidToken', req.url));
    }

    // Immediately delete the token after retrieval to prevent reuse
    await env.AUTH_KV.delete(token);

    const { email, expires } = JSON.parse(storedValue);

    if (Date.now() > expires) {
       console.log(`Verification token expired: ${token}`);
       return NextResponse.redirect(new URL('/signin?error=VerificationExpiredToken', req.url));
    }

    // 2. Token is valid, attempt sign in using Credentials provider
    console.log(`Attempting sign in for verified email: ${email}`);
    await signIn('credentials', {
      email: email,
      redirect: false, // Handle redirect manually after sign-in
    });

    // 3. Redirect to a protected page or dashboard upon successful sign-in
    // Adjust the redirect URL as needed
    const redirectUrl = new URL('/', req.url);
    console.log(`Sign in successful, redirecting to: ${redirectUrl.toString()}`);
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Error verifying magic link or signing in:', error);

    if (error instanceof AuthError) {
        // Handle specific AuthErrors if needed
        console.error('AuthError during sign in:', error.type, error.cause);
        switch (error.type) {
          case 'CredentialsSignin':
          case 'CallbackRouteError': // Catch errors from authorize function
             return NextResponse.redirect(new URL('/signin?error=CredentialsSigninFailed', req.url));
          default:
             return NextResponse.redirect(new URL('/signin?error=AuthError', req.url));
        }
    }

    // Generic error
    return NextResponse.redirect(new URL('/signin?error=VerificationFailed', req.url));
  }
} 