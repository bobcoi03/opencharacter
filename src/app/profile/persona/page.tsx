import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { personas } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import PersonaOptions from '@/components/persona-options';

export const runtime = "edge"

export default async function PersonaPage() {
    const session = await auth();

    if (!session?.user) {
        return <div className="flex justify-center items-center h-screen">Please sign in to view your profile.</div>
    }

    const userPersonas = await db.select()
        .from(personas)
        .where(eq(personas.userId, session.user.id!))
        .all();

    return (
        <div className="bg-neutral-900 text-white w-full mx-auto mb-24">
            <div className="space-y-4 mb-6">
                {userPersonas.map((persona) => (
                    <div key={persona.id} className="flex items-center justify-between hover:bg-neutral-800 p-2 hover:rounded-xl">
                        <Link href={`/profile/persona/${persona.id}/edit`} className="flex items-center space-x-3 min-w-0 flex-grow">
                            {persona.image ? (
                                <div className="w-12 h-12 rounded-sm overflow-hidden flex-shrink-0">
                                    <Image
                                        src={persona.image}
                                        alt={persona.displayName}
                                        width={48}
                                        height={48}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold bg-gradient-to-br from-black via-black to-purple-300 flex-shrink-0">
                                    {persona.displayName[0]}
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <h2 className="font-semibold flex items-center text-sm">
                                    <span className="truncate">{persona.displayName}</span>
                                    {persona.isDefault && (
                                        <span className="ml-2 flex-shrink-0 text-xs bg-neutral-700 text-neutral-300 px-2 py-1 rounded">Default</span>
                                    )}
                                </h2>
                                <p className="text-xs text-neutral-400 truncate">{persona.background}</p>
                            </div>
                        </Link>
                        <PersonaOptions persona={persona} />
                    </div>
                ))}
            </div>

            <Link href="/profile/persona/create" className="block mx-auto w-32 items-center">
                <button className="w-full bg-neutral-800 text-white py-2 rounded-3xl flex items-center justify-center">
                    <span className="text-2xl mr-2">+</span> New
                </button>
            </Link>
        </div>
    );
}