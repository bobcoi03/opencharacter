"use client"

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { characters } from "@/server/db/schema";

type Character = {
  id: string;
  name: string;
  tagline: string;
  avatar_image_url: string | null;
  interactionCount: number;
  createdAt: Date;
  userName: string | null;
};

type SortOption = "popular" | "new" | "old";

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
      <Card className="bg-neutral-800 overflow-hidden rounded-lg h-full flex flex-col">
        <CardContent className="px-6 py-3 flex flex-col">
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
        </CardContent>
        <p className="text-xs text-gray-400 text-center w-full px-2 flex-grow">
          {truncatedTagline}
        </p>
        <div className="flex items-center text-xs text-gray-500 mt-1 w-full justify-between px-2 py-2">
          <span>@{character.userName}</span>
          <div className="flex items-center">
            <MessageCircle className="w-3 h-3 mr-1" />
            <span>{character.interactionCount}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
};

const AICharacterGrid: React.FC<{ characters: Character[] }> = ({
  characters,
}) => {
  const [sortOption, setSortOption] = useState<SortOption>("popular");

  const sortedCharacters = useMemo(() => {
    switch (sortOption) {
      case "popular":
        return [...characters].sort((a, b) => (b.interactionCount ?? 0) - (a.interactionCount ?? 0));
      case "new":
        return [...characters].sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          return dateB - dateA;
        });
      case "old":
        return [...characters].sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          return dateA - dateB;
        });
      default:
        return characters;
    }
  }, [characters, sortOption]);

  const SortButton: React.FC<{ option: SortOption; label: string }> = ({ option, label }) => (
    <div
      className={`text-sm font-semibold text-white rounded-lg p-3 max-w-24 text-center hover:cursor-pointer ${
        sortOption === option ? "bg-black" : "bg-neutral-800 hover:bg-gray-700"
      }`}
      onClick={() => setSortOption(option)}
    >
      {label}
    </div>
  );

  return (
    <div className="bg-neutral-900">
      <div className="w-full flex gap-2 mb-3">
        <SortButton option="popular" label="Popular" />
        <SortButton option="new" label="New" />
        <SortButton option="old" label="Old" />
      </div>
    
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {sortedCharacters.map((character) => (
          <AICharacterCard key={character.id} character={character} />
        ))}
      </div>
      <div className="border m-8" />
    </div>
  );
};

export default AICharacterGrid;