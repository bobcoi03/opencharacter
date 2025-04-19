import { type NextRequest, NextResponse } from 'next/server';
import { sendMagicLinkEmail } from '@/lib/email'; // Ensure this function exists and is edge-compatible

// Define the binding type for Cloudflare KV
interface Env {
  AUTH_KV: KVNamespace;
  NODE_ENV?: string; // Add NODE_ENV for checking development mode
  NEXT_PUBLIC_APP_URL?: string; // Keep this as well
}

// Define expected request body shape
interface SendMagicLinkRequestBody {
    email?: string;
}

// Set expiration time for the token (e.g., 15 minutes in seconds)
const TOKEN_EXPIRATION_SECONDS = 15 * 60;

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  let email: string | undefined;
  try {
    // Type the body based on the interface
    const body: SendMagicLinkRequestBody = await req.json();
    email = body.email;
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const env = process.env as unknown as Env; // Access bindings

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required and must be a string' }, { status: 400 });
  }

  // Basic email format validation (optional but recommended)
  if (!/\S+@\S+\.\S+/.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  if (!env.AUTH_KV) {
     console.error("AUTH_KV namespace not bound.");
     return NextResponse.json({ error: 'Server configuration error: KV namespace not available.' }, { status: 500 });
  }

  // Use the global crypto object available in Edge Runtime
  const token = crypto.randomUUID();
  const expires = Date.now() + TOKEN_EXPIRATION_SECONDS * 1000;

  // Determine appUrl based on environment
  const isDevelopment = env.NODE_ENV === 'development';
  const appUrl = isDevelopment
    ? 'http://localhost:3000' // Explicitly use localhost for dev
    : env.NEXT_PUBLIC_APP_URL || 'https://opencharacter.org'; // Use env var or default for prod/other

  const verificationUrl = `${appUrl}/api/auth/verify-magic-link?token=${token}`;
  const host = new URL(appUrl).host;


  try {
    console.log(`Generating magic link token for ${email} (URL: ${verificationUrl})`);
    // Store token -> {email, expires} in KV with TTL
    await env.AUTH_KV.put(
      token,
      JSON.stringify({ email, expires }),
      { expirationTtl: TOKEN_EXPIRATION_SECONDS }
    );
    console.log(`Token stored in KV for ${email}`);

    // Send the email
    await sendMagicLinkEmail({
      email: email,
      url: verificationUrl,
      host: host,
    });
    console.log(`Magic link email queued for sending to ${email}`);

    // Return a success message to the user
    return NextResponse.json({ message: 'Magic link sent successfully. Check your email.' });

  } catch (error) {
    console.error('Error processing send-magic-link request:', error);
    let errorMessage = 'Failed to send magic link due to an internal error.';
    if (error instanceof Error) {
        // Potentially mask internal details unless safe
        // errorMessage = `Failed to send magic link: ${error.message}`;
        console.error(`Detailed error: ${error.message}`);
    }
     // Consider if cleanup (deleting the token from KV) is needed on failure
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
