import React from 'react';
import Link from 'next/link';
import { MessageCircle, MoreVertical } from 'lucide-react';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { sql } from 'drizzle-orm';
import { chat_sessions } from '@/server/db/schema';

export const runtime = "edge"

export default async function ProfilePage() {
    const session = await auth()

    if (!session?.user) {
        return <div className="flex justify-center items-center h-screen">Please sign in to view your profile.</div>
    }

    const userId = session.user.id;
    const userName = session.user.name ?? 'User';

    // Get the number of chats for the user
    const chatCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(chat_sessions)
        .where(sql`user_id = ${userId}`)
        .get();

    const chatCount = chatCountResult?.count ?? 0;

    return (
        <div className="flex justify-center bg-neutral-900">
            <div className="bg-neutral-900 text-white p-4 w-full max-w-lg">
                <div className="flex flex-col items-center mb-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl text-white font-semibold bg-gradient-to-br from-black via-black to-purple-300`}>
                        {session.user.name![0].toUpperCase()}
                    </div>
                    <h1 className="text-xl font-bold mt-2 mb-1">{userName}</h1>
                    <p className="text-sm text-neutral-400 mb-2">
                        <MessageCircle className="inline w-4 h-4 mr-1" /> {chatCount} Chats
                    </p>
                </div>

                <div className="flex justify-between mb-4 border-b border-neutral-700 pb-2">
                    <button className="text-neutral-400 text-sm">Characters</button>
                    <button className="text-white border-b-2 border-white pb-2 text-sm">Personas</button>
                    <button className="text-neutral-400 text-sm">Voices</button>
                </div>

                <div className="space-y-4">
                    <Link href="/persona/create" className="block">
                        <div className="flex items-center">
                            <img src="/api/placeholder/48/48" alt="Minh" className="w-12 h-12 rounded-full mr-3 flex-shrink-0" />
                            <div className="flex-grow min-w-0">
                                <h2 className="font-semibold flex items-center text-sm">
                                    Minh <span className="ml-2 text-xs bg-neutral-700 text-neutral-300 px-2 py-1 rounded">Default</span>
                                </h2>
                                <p className="text-xs text-neutral-400 truncate">Minh 21 years old startup founder likes to be alo...</p>
                            </div>
                            <MoreVertical className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                        </div>
                    </Link>

                    <Link href="/persona/create" className="block">
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-pink-400 rounded-full flex items-center justify-center text-xl font-bold text-white mr-3 flex-shrink-0">
                                J
                            </div>
                            <div className="flex-grow min-w-0">
                                <h2 className="font-semibold text-sm">Jeff</h2>
                                <p className="text-xs text-neutral-400 truncate">I am Jeff Bezos the famous billionaire</p>
                            </div>
                            <MoreVertical className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                        </div>
                    </Link>

                    <Link href="/persona/create" className="block mx-auto w-32 items-center">
                        <button className="w-full bg-neutral-800 text-white py-2 rounded-3xl flex items-center justify-center">
                            <span className="text-2xl mr-2">+</span> New
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}