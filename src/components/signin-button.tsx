"use client"

import AuthProvider from './auth-provider';
import { useSession, signIn, signOut } from 'next-auth/react';

function SignIn() {
    const { data: session, status } = useSession()

    if (status == "authenticated") {
        return null
    }

    return (
        <button 
            onClick={() => signIn("google")}
            className="px-4 py-2 rounded-full text-sm font-light transition-colors
                    bg-black text-white 
                    dark:bg-white dark:text-black
                    hover:bg-gray-800 dark:hover:bg-gray-200"
        >
            Sign In
        </button>
    )
}

export default function SignInButton() {
    return (
        <AuthProvider>
            <SignIn />
        </AuthProvider>
    )
}