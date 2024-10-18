import React from 'react';
import { db } from "@/server/db"
import { sql } from 'drizzle-orm';
import { characters, users } from "@/server/db/schema"
import { Card, CardContent } from "@/components/ui/card";
import Link from 'next/link';
import { Users, MessageCircle } from 'lucide-react';

export const runtime = "edge";

type LeaderboardUser = {
    id: string;
    name: string | null;
    image: string | null;
    totalChats: number;
    characterCount: number;
};

async function getLeaderboardData(): Promise<LeaderboardUser[]> {
    const leaderboardData = await db
        .select({
            id: users.id,
            name: users.name,
            image: users.image,
            totalChats: sql<number>`SUM(${characters.interactionCount})`,
            characterCount: sql<number>`COUNT(${characters.id})`
        })
        .from(users)
        .leftJoin(characters, sql`${users.id} = ${characters.userId}`)
        .where(sql`${characters.visibility} = 'public'`)
        .groupBy(users.id)
        .orderBy(sql`SUM(${characters.interactionCount}) DESC`)
        .limit(100)
        .all();

    return leaderboardData;
}

export default async function LeaderBoard() {
    const leaderboardData = await getLeaderboardData();

    return (
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 mb-24 w-full">
            <h1 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center text-white">🏆 Creator Leaderboard Top 100 🏆</h1>
            <div className="flex flex-col gap-2 sm:gap-4 w-full items-center">
                {leaderboardData.map((user, index) => (
                    <Card key={user.id} className="bg-neutral-800 text-white p-2 sm:p-4 w-full max-w-xl">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-md overflow-hidden mr-2 sm:mr-4 flex-shrink-0">
                                    <img
                                        src={user.image ?? '/default-avatar.jpg'}
                                        alt={user.name ?? 'User'}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <div className="text-xs sm:text-sm text-gray-400 mb-0.5 sm:mb-1">#{index + 1}</div>
                                    <Link className="text-base sm:text-lg md:text-xl font-bold mb-0.5 sm:mb-1 hover:underline hover:text-blue-600" href={`/public-profile/${user.id}`}>
                                        {user.name || `User_${user.id.slice(0, 8)}`}
                                    </Link>
                                    <div className="flex items-center text-xs sm:text-sm text-gray-400">
                                        <Users size={12} className="mr-1" />
                                        <span>{user.characterCount} public characters</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-500">
                                    {user.totalChats.toLocaleString()}
                                </div>
                                <div className="flex items-center text-xs sm:text-sm text-gray-400">
                                    <MessageCircle size={12} className="mr-1" />
                                    <span>chats</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}