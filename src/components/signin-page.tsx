'use client'

import { useState, useEffect } from 'react'
import SignInButton from "@/components/signin-button"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

const SignInPageClient = () => {
    const [isAgeVerified, setIsAgeVerified] = useState(false)
    
    return (
        <div className="flex flex-col bg-neutral-900 text-gray-100 p-8 mx-auto max-w-xl mt-24">      
            <main className="flex-grow flex lg:items-center mx-auto">
                <div className="">
                    <h1 className="text-3xl font-bold mb-4">Hello, <span className="text-blue-600">welcome to OpenCharacter!</span></h1>
                    <p className="text-gray-400 mb-8">Create any chatbots for any purpose.</p>
                    
                    <div className="mb-6">
                        <label className="flex items-center gap-2 text-sm text-gray-300 mb-4">
                            <input 
                                type="checkbox" 
                                checked={isAgeVerified}
                                onChange={(e) => setIsAgeVerified(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                            />
                            I confirm that I am 18 years or older
                        </label>
                    </div>

                    <div className="mb-10">
                        {isAgeVerified ? (
                            <SignInButton />
                        ) : (
                            <button 
                                disabled
                                className="w-full px-4 py-2 bg-gray-600 text-gray-300 rounded cursor-not-allowed opacity-50"
                            >
                                Please confirm you are 18 or older
                            </button>
                        )}
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-4">
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