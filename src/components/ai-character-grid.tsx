import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { MessageCircle } from 'lucide-react';
import { db } from '@/server/db';
import { characters } from '@/server/db/schema';
import { desc } from 'drizzle-orm';

const AICharacterCard: React.FC<{ character: typeof characters.$inferSelect }> = ({ character }) => (
  <Link href={`/chat/${character.id}`} passHref className="block">
    <Card className="w-full bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors">
      <CardContent className="p-3 flex items-center space-x-3">
        <Avatar className="w-12 h-12 rounded-lg flex-shrink-0">
          {/* Note: You might need to add an avatar_url field to your schema if it's not present */}
          <img src={`https://api.dicebear.com/6.x/adventurer/svg?seed=${character.name}`} alt={character.name} className="rounded-lg" />
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{character.name}</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{character.tagline}</p>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-4">
            <MessageCircle className="w-2 h-2 mr-1" />
            <span className='text-xs'>{character.interactionCount.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </Link>
);

async function getLatestCharacters() {
  return await db.query.characters.findMany({
    orderBy: [desc(characters.createdAt)],
    limit: 8, // Adjust this number as needed
  });
}

export async function AICharacterGrid() {
  const latestCharacters = await getLatestCharacters();

  return (
    <div className="space-y-6 bg-white dark:bg-neutral-900 p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Latest Characters</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {latestCharacters.map((character) => (
          <AICharacterCard key={character.id} character={character} />
        ))}
      </div>
    </div>
  );
}