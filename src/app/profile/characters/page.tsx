import React from 'react';
import Link from 'next/link';
import { MoreVertical } from 'lucide-react';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { eq } from 'drizzle-orm';
import { characters } from '@/server/db/schema';
import { CharacterOptions } from '@/components/character-options';
import Image from 'next/image';

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
        .select()
        .from(characters)
        .where(eq(characters.userId, userId!))
        .all();

    return (
        <div className="space-y-4 mb-24">
            {userCharacters.map((character) => (
                <div key={character.id} className="flex items-center justify-between hover:bg-neutral-800 p-2 hover:rounded-xl">
                    <Link href={`/chat/${character.id}`} className="flex items-center space-x-3 min-w-0 flex-grow">
                        {character.avatar_image_url ? (
                            <div className="w-12 h-12 rounded-sm overflow-hidden flex-shrink-0">
                                <Image
                                    src={character.avatar_image_url}
                                    alt={character.name}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold bg-gradient-to-br from-black via-black to-purple-300 flex-shrink-0">
                                {character.name[0]}
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <h2 className="font-semibold text-sm truncate">{character.name}</h2>
                            <p className="text-xs text-neutral-400 truncate">{character.tagline}</p>
                        </div>
                    </Link>
                    <CharacterOptions character={character} />
                </div>
            ))}

            <Link href="/new" className="block mx-auto w-32 items-center">
                <button className="w-full bg-neutral-800 text-white py-2 rounded-3xl flex items-center justify-center">
                    <span className="text-2xl mr-2">+</span> New
                </button>
            </Link>
        </div>
    );
}