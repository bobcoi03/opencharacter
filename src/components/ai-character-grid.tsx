import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Star } from 'lucide-react';
import { db } from '@/server/db';
import { characters } from '@/server/db/schema';
import { desc } from 'drizzle-orm';

const safeTruncate = (str: string, n: number) => {
  if (str.length <= n) return str;
  const subString = str.slice(0, n - 1);
  return (subString.match(/[\uD800-\uDBFF]$/) ? subString.slice(0, -1) : subString) + '…';
};

const AICharacterCard: React.FC<{ character: typeof characters.$inferSelect }> = ({ character }) => {
  const truncatedTagline = React.useMemo(() => safeTruncate(character.tagline, 80), [character.tagline]);

  return (
    <Link href={`/chat/${character.id}`} passHref className="block">
      <Card className="h-full bg-white dark:bg-neutral-800 hover:shadow-md transition-all duration-300 overflow-hidden">
        <CardContent className="p-4 flex flex-col h-full">
          <div className="relative w-full pb-[100%] mb-4 rounded-lg overflow-hidden">
            <Image 
              src={character.avatar_image_url ?? "/default-avatar.jpg"} 
              alt={character.name} 
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 hover:scale-105"
            />
          </div>
          <div className="flex-grow">
            <h3 className="text-lg font-semibold truncate mb-2 text-gray-800 dark:text-gray-200">{character.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
              {truncatedTagline}
            </p>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-4">
            <div className="flex items-center">
              <MessageCircle className="w-4 h-4 mr-1" />
              <span>{character.interactionCount.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

async function getPopularCharacters() {
  return await db.query.characters.findMany({
    orderBy: [desc(characters.interactionCount)],
    limit: 500,
  });
}

export async function AICharacterGrid() {
  const popularCharacters = await getPopularCharacters();

  return (
    <div className="bg-gray-100 dark:bg-neutral-900 p-6 md:p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Most Popular Characters</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {popularCharacters.map((character) => (
          <AICharacterCard key={character.id} character={character} />
        ))}
      </div>
    </div>
  );
}