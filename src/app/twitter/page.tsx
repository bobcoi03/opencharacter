import React from 'react';
import { auth } from '@/server/auth';
import SignInButton from "@/components/signin-button"
import TwitterPageClient from "./twitter-page-client" // We'll create this next

export const runtime = "edge"

export default async function TwitterProfilePage() {
    const session = await auth();

    if (!session?.user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <h1 className="text-2xl font-bold mb-8">Twitter Page</h1>
                <div className="text-center">
                    <p className="mb-4 text-lg">To make a Twitter character, please sign in.</p>
                    <SignInButton />
                </div>
            </div>
        );
    }

    return <TwitterPageClient />;
}