import React from 'react';
import { MessageCircle } from 'lucide-react';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { sql } from 'drizzle-orm';
import { chat_sessions } from '@/server/db/schema';
import ProfileNav from '@/components/profile-nav';

export const runtime = "edge"

export default async function ProfileLaout({ children }: { children: React.ReactNode }) {
    const session = await auth()

    if (!session?.user) {
        return <div className="flex justify-center items-center h-screen">Please sign in to view your profile.</div>
    }

    const userId = session.user.id;
    const userName = session.user.name ?? 'User';

    // Get the number of chats for the user
     // Get the sum of interaction_count for the user
    const chatCount = await db
    .select({
        totalInteractions: sql<number>`sum(${chat_sessions.interaction_count})`
    })
    .from(chat_sessions)
    .where(sql`${chat_sessions.user_id} = ${userId}`)
    .get();

    const chatCountDisplay = chatCount?.totalInteractions ?? 0;

    return (
        <div className="flex justify-center bg-neutral-900">
            <div className="bg-neutral-900 text-white p-4 w-full max-w-lg">
                <div className="flex flex-col items-center mb-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl text-white font-semibold bg-gradient-to-br from-black via-black to-purple-300`}>
                        {session.user.name![0].toUpperCase()}
                    </div>
                    <h1 className="text-xl font-bold mt-2 mb-1">{userName}</h1>
                    <p className="text-sm text-neutral-400 mb-2">
                        <MessageCircle className="inline w-4 h-4 mr-1" /> {chatCountDisplay} Chats
                    </p>
                </div>

                <ProfileNav />

                {children}

            </div>
        </div>
    );
}