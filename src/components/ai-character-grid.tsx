import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle } from 'lucide-react';
import { db } from '@/server/db';
import { characters } from '@/server/db/schema';
import { desc } from 'drizzle-orm';
import Image from 'next/image';

const AICharacterCard: React.FC<{ character: typeof characters.$inferSelect }> = ({ character }) => (
  <Link href={`/chat/${character.id}`} passHref className="block h-full">
    <Card className="w-full h-full bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors">
      <CardContent className="p-3 flex flex-col h-full">
        <div className="flex items-center space-x-3 flex-grow">
          <img src={character.avatar_image_url ?? "/default-avatar.jpg"} alt={character.name} className="w-16 h-16 object-cover rounded-lg" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{character.name}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{character.tagline}</p>
          </div>
        </div>
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-auto pt-2">
          <MessageCircle className="w-3 h-3 mr-1" />
          <span>{character.interactionCount.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  </Link>
);

async function getLatestCharacters() {
  return await db.query.characters.findMany({
    orderBy: [desc(characters.interactionCount)],
    limit: 50, // Adjust this number as needed
  });
}

export async function AICharacterGrid() {
  const latestCharacters = await getLatestCharacters();

  return (
    <div className="space-y-6 bg-white dark:bg-neutral-900 p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Most Popular</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {latestCharacters.map((character) => (
          <AICharacterCard key={character.id} character={character} />
        ))}
      </div>
    </div>
  );
}