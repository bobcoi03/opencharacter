import React from 'react';
import { db } from "@/server/db";
import { characters, users } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";
import Image from 'next/image';
import Link from 'next/link';

export const runtime = "edge";

// Define the Character type based on our schema
type Character = {
  id: string;
  name: string;
  tagline: string;
  avatar_image_url: string | null;
  interactionCount: number;
};

// Fetch characters for a given user_id
async function fetchCharacters(userId: string): Promise<Character[]> {
  return db.query.characters.findMany({
    where: (characters, { eq, and }) => and(
      eq(characters.userId, userId),
      eq(characters.visibility, "public")
    ),
    orderBy: (characters, { desc }) => [desc(characters.interactionCount)],
    columns: {
      id: true,
      name: true,
      tagline: true,
      avatar_image_url: true,
      interactionCount: true,
    },
  });
}

// Character Card Component
const CharacterCard: React.FC<{ character: Character }> = ({ character }) => (
  <Link href={`/chat/${character.id}`} className="block">
    <div className="bg-neutral-800 p-4 rounded-lg text-center">
      <Image
        src={character.avatar_image_url || "/default-avatar.jpg"}
        alt={character.name}
        width={100}
        height={100}
        className="rounded-full mx-auto mb-2"
      />
      <h3 className="text-white text-lg font-semibold">{character.name}</h3>
      <p className="text-gray-400 text-sm">{character.tagline}</p>
      <p className="text-gray-500 text-xs mt-2">Interactions: {character.interactionCount}</p>
    </div>
  </Link>
);

export default async function UserProfilePage({ searchParams }: { searchParams: { user_id?: string } }) {
  const userId = searchParams.user_id;

  if (!userId) {
    return <div className="md:ml-16 text-white text-3xl">No user ID provided</div>;
  }

  // Fetch user data
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, userId),
  });

  if (!user) {
    return <div className="md:ml-16 text-white text-3xl">User not found</div>;
  }

  // Fetch characters
  const characters = await fetchCharacters(userId);

  return (
    <div className="md:ml-16 p-8 bg-neutral-900 min-h-screen">
      <h1 className="text-white text-3xl mb-8">Profile: {user.name}</h1>
      
      <h2 className="text-white text-2xl mb-4">Public Characters</h2>
      
      {characters.length === 0 ? (
        <p className="text-gray-400">No public characters found for this user.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {characters.map(character => (
            <CharacterCard key={character.id} character={character} />
          ))}
        </div>
      )}
    </div>
  );
}