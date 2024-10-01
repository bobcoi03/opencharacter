import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

type Character = {
  id: string;
  name: string;
  tagline: string;
  avatar_image_url: string | null;
  userId: string;
  interactionCount: number;
};

const safeTruncate = (str: string, n: number) => {
  if (str.length <= n) return str;
  const subString = str.slice(0, n - 1);
  return (
    (subString.match(/[\uD800-\uDBFF]$/) ? subString.slice(0, -1) : subString) +
    "…"
  );
};

const AICharacterCard: React.FC<{ character: Character }> = ({ character }) => {
  const truncatedTagline = React.useMemo(
    () => safeTruncate(character.tagline, 50),
    [character.tagline],
  );

  return (
    <Link
      href={`/chat/${character.id}`}
      passHref
      className="block w-full h-full"
    >
      <Card className="bg-neutral-800 border-none overflow-hidden rounded-lg h-full flex flex-col">
        <CardContent className="px-6 py-3 flex flex-col flex-grow">
          <div className="relative w-full pb-[100%] rounded-lg overflow-hidden max-h-24 h-full">
            <Image
              src={character.avatar_image_url ?? "/default-avatar.jpg"}
              alt={character.name}
              layout="fill"
              objectFit="cover"
              className="overflow-hidden border"
            />
          </div>
          <h3 className="mt-2 text-sm font-semibold text-gray-200 truncate text-center">
            {character.name}
          </h3>
          <p className="text-xs text-gray-400 line-clamp-2 mt-1 flex-grow">
            {truncatedTagline}
          </p>
          <div className="flex items-center text-xs text-gray-500 mt-2 w-full justify-between">
            <span className="mr-1">@anon</span>
            <div className="flex items-center">
              <MessageCircle className="w-3 h-3 ml-2 mr-1" />
              <span>{character.interactionCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

const AICharacterGrid: React.FC<{ characters: Character[] }> = ({
  characters,
}) => {
  return (
    <div className="py-6 bg-neutral-900">
      <h2 className="text-sm font-medium text-gray-100 mb-4">Popular</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {characters.map((character) => (
          <AICharacterCard key={character.id} character={character} />
        ))}
      </div>
      <div className="border m-8" />
    </div>
  );
};

export default AICharacterGrid;
