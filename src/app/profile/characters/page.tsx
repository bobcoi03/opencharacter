import React from 'react';
import Link from 'next/link';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { eq } from 'drizzle-orm';
import { characters } from '@/server/db/schema';
import CharacterList from '@/components/character-list';

export const runtime = "edge"

export default async function CharactersPage() {
    const session = await auth()

    if (!session?.user) {
        return <div className="flex justify-center items-center h-screen">Please sign in to view your profile.</div>
    }

    const userId = session.user.id;

    // Get the characters for the user
    const userCharacters = await db
        .select()
        .from(characters)
        .where(eq(characters.userId, userId!))
        .all();

    return (
        <div className="space-y-4 mb-24">
            <CharacterList initialCharacters={userCharacters} />

            <Link href="/new" className="block mx-auto w-32 items-center">
                <button className="w-full bg-neutral-800 text-white py-2 rounded-3xl flex items-center justify-center">
                    <span className="text-2xl mr-2">+</span> New
                </button>
            </Link>
        </div>
    );
}