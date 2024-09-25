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
  const truncatedTagline = React.useMemo(() => safeTruncate(character.tagline, 50), [character.tagline]);

  return (
    <Link href={`/chat/${character.id}`} passHref className="block h-full">
      <Card className="transition-colors duration-300 overflow-hidden rounded-lg h-full bg-neutral-50 dark:bg-neutral-900">
        <CardContent className="p-3 flex flex-col h-full">
          <div className="relative w-full pb-[100%] rounded-lg overflow-hidden">
            <Image 
              src={character.avatar_image_url ?? "/default-avatar.jpg"} 
              alt={character.name} 
              layout="fill"
              objectFit="cover"
            />
          </div>
          <div className="flex flex-col justify-between flex-grow mt-2">
            <div>
              <h3 className="text-sm font-semibold truncate text-gray-700 dark:text-gray-200 text-center">{character.name}</h3>
              <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                {truncatedTagline}
              </p>
            </div>
            <div className="flex items-center text-xs text-gray-500 mt-2">
              <span className="mr-1">@anon</span>
              <MessageCircle className="w-3 h-3 ml-2 mr-1" />
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
    <div className="p-6 md:p-8">
      <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-gray-100">Recommended</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {popularCharacters.map((character) => (
          <AICharacterCard key={character.id} character={character} />
        ))}
      </div>
    </div>
  );
}