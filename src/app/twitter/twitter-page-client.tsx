'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from 'next/image';

export default function TwitterPageClient() {
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (username) {
            setIsLoading(true);
            // Simulate a delay (remove this in production)
            await new Promise(resolve => setTimeout(resolve, 2000));
            router.push(`/chat/${username}`);
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen p-4">
            <Image
                src={"/twitter-x.png"}
                width={300}
                height={300}
                alt='X'
            />

            <h1 className="text-2xl font-bold mb-4">Create a Twitter Character</h1>
            <form onSubmit={handleSubmit} className="w-full max-w-md">
                <div className="flex items-center space-x-2">
                    <Input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Twitter username... (e.g., elonmusk)"
                        className="flex-grow bg-neutral-200 dark:bg-neutral-800 justify-start rounded-full text-left px-4 py-4 text-sm text-black dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 h-14"
                        disabled={isLoading}
                    />
                    <Button 
                        type="submit"
                        className="bg-neutral-200 text-gray-300 dark:bg-neutral-800 hover:bg-neutral-600 rounded-full p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 h-14 w-14 flex items-center justify-center"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        )}
                    </Button>
                </div>
            </form>
            <div className="mt-8 text-sm text-gray-600 dark:text-gray-400 max-w-md text-center">
                <p>Our AI will analyze the Twitter profile and create a character that mimics their style and personality. You{"'"}ll be able to chat with this character and even customize it further!</p>
            </div>
        </div>
    );
}