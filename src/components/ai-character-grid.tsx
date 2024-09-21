import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle } from 'lucide-react';
import { db } from '@/server/db';
import { characters } from '@/server/db/schema';
import { desc } from 'drizzle-orm';

// Helper function to safely truncate text with emojis
const safeTruncate = (str: string, n: number) => {
  if (str.length <= n) return str;
  const subString = str.slice(0, n - 1);
  return (subString.match(/[\uD800-\uDBFF]$/) ? subString.slice(0, -1) : subString) + '…';
};

const AICharacterCard: React.FC<{ character: typeof characters.$inferSelect }> = ({ character }) => {
  const truncatedTagline = React.useMemo(() => safeTruncate(character.tagline, 100), [character.tagline]);

  return (
    <Link href={`/chat/${character.id}`} passHref className="block">
      <Card className="w-full bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors overflow-hidden">
        <CardContent className="p-6">
          <div className="w-32 h-32 mx-auto relative mb-4 rounded-lg overflow-hidden">
            <img src={character.avatar_image_url ?? "/default-avatar.jpg"} alt={character.name} className="w-full h-full object-cover" />
          </div>
          <div className="text-black dark:text-white">
            <h3 className="text-md font-semibold truncate text-center mb-2">{character.name}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 break-words overflow-hidden text-center h-12">
              {truncatedTagline}
            </p>
            <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 mt-2">
              <MessageCircle className="w-4 h-4 mr-1" />
              <span>{character.interactionCount.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

async function getLatestCharacters() {
  return await db.query.characters.findMany({
    orderBy: [desc(characters.interactionCount)],
    limit: 500, // Adjust this number as needed
  });
}

export async function AICharacterGrid() {
  const latestCharacters = await getLatestCharacters();

  return (
    <div className="space-y-6 bg-white dark:bg-neutral-900 p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Most Popular</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {latestCharacters.map((character) => (
          <AICharacterCard key={character.id} character={character} />
        ))}
      </div>
    </div>
  );
}