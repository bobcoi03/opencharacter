'use client'

import { useState } from 'react';
import SignInButton from "@/components/signin-button"
import Link from "next/link"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

// Define the expected response structure from the API
interface MagicLinkApiResponse {
    message?: string;
    error?: string;
}

const SignInPageClient = () => {    
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleMagicLinkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);
        setError(null);

        try {
            const response = await fetch('/api/auth/send-magic-link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            // Type the response data
            const data: MagicLinkApiResponse = await response.json();

            if (!response.ok) {
                // Use optional chaining for safer access
                throw new Error(data?.error || `Failed with status: ${response.status}`);
            }

            // Success - use optional chaining
            setMessage(data?.message || 'Magic link sent! Check your email.');
            setEmail(''); // Clear input on success

        } catch (err) {
            console.error('Magic link submission error:', err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col bg-neutral-900 text-gray-100 p-8 mx-auto max-w-xl mt-24 rounded-lg shadow-xl">
            <main className="flex-grow flex flex-col items-center mx-auto w-full">
                <div className="text-center w-full">
                    <div className="mb-8 flex justify-center">
                        <Image
                          src="/opencharacter_icon.png"
                          alt="OpenCharacter Logo"
                          width={80}
                          height={80}
                          priority
                        />
                    </div>

                    <h1 className="text-5xl font-bold mb-4"><span className="text-blue-500">welcome</span></h1>
                    <p className="text-gray-400 mb-8">Sign in to continue to OpenCharacter.</p>
                    
                    <div className="mb-6">
                        <SignInButton />
                    </div>
                    
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-neutral-700" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-neutral-900 px-2 text-neutral-500">
                                Or continue with email
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleMagicLinkSubmit} className="space-y-4 w-full">
                         <div>
                             <Label htmlFor="email" className="sr-only">Email Address</Label>
                             <Input
                                 id="email"
                                 name="email"
                                 type="email"
                                 autoComplete="email"
                                 placeholder="Enter your email"
                                 value={email}
                                 onChange={(e) => setEmail(e.target.value)}
                                 required
                                 disabled={isLoading}
                                 className="bg-neutral-800 border-neutral-700 placeholder-neutral-500 focus:ring-blue-500 focus:border-blue-500"
                             />
                         </div>
                         <Button
                             type="submit"
                             disabled={isLoading || !email}
                             className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                         >
                             {isLoading ? 'Sending...' : 'Send Magic Link'}
                         </Button>
                    </form>

                    {message && <p className="mt-4 text-sm text-green-400">{message}</p>}
                    {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

                    <p className="text-xs text-gray-500 mt-8 mb-4">
                        By continuing, you agree to the{' '}
                        <Link href="/terms-of-service" className="text-blue-400 hover:underline">
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy-policy" className="text-blue-400 hover:underline">
                            Privacy Policy
                        </Link>
                    </p>

                    <p className="text-[9px] text-gray-500">
                        By signing in, you also agree to receive emails from us about product updates, news, and promotional offers. You can unsubscribe at any time.
                    </p>
                </div>
            </main>
        </div>
    )
}

export default SignInPageClient