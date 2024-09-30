import React from 'react';
import Link from 'next/link';
import { MoreVertical } from 'lucide-react';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { eq } from 'drizzle-orm';
import { characters } from '@/server/db/schema';

export const runtime = "edge"

export default async function CharactersPage() {
    const session = await auth()

    if (!session?.user) {
        return <div className="flex justify-center items-center h-screen">Please sign in to view your profile.</div>
    }

    const userId = session.user.id;
    const userName = session.user.name ?? 'User';

    // Get the characters for the user
    const userCharacters = await db
        .select({
            id: characters.id,
            name: characters.name,
            tagline: characters.tagline,
            avatarImageUrl: characters.avatar_image_url,
        })
        .from(characters)
        .where(eq(characters.userId, userId!))
        .all();

    return (
        <div className="space-y-4 mb-24">
            {userCharacters.map((character) => (
                <Link key={character.id} href={`/chat/${character.id}`} className="block">
                    <div className="flex items-center">
                        {character.avatarImageUrl ? (
                            <img src={character.avatarImageUrl} alt={character.name} className="w-12 h-12 rounded-full mr-3 flex-shrink-0" />
                        ) : (
                            <div className="w-12 h-12 bg-neutral-700 rounded-full flex items-center justify-center text-xl font-bold text-white mr-3 flex-shrink-0">
                                {character.name.charAt(0)}
                            </div>
                        )}
                        <div className="flex-grow min-w-0">
                            <h2 className="font-semibold text-sm">{character.name}</h2>
                            <p className="text-xs text-neutral-400 truncate">{character.tagline}</p>
                        </div>
                        <MoreVertical className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                    </div>
                </Link>
            ))}

            <Link href="/new" className="block mx-auto w-32 items-center">
                <button className="w-full bg-neutral-800 text-white py-2 rounded-3xl flex items-center justify-center">
                    <span className="text-2xl mr-2">+</span> New
                </button>
            </Link>
        </div>
    );
}