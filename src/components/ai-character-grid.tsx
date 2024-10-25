"use client"

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { AllCharacterTags, CharacterTag, CharacterTags, NSFWCharacterTags, SFWCharacterTags } from "@/types/character-tags";
import { searchCharactersByTags } from "@/app/actions/index"; // Import the server action

type Character = {
  id: string;
  name: string;
  tagline: string;
  avatar_image_url: string | null;
  interactionCount: number;
  createdAt: Date;
  userName: string | null;
  userId: string;
  tags: string | string[] | null; // Updated to handle multiple possible types
};

// Helper function to parse tags
const parseTags = (tags: string | string[] | null): string[] => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [tags]; // If it's a single string and not JSON
  }
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
    () => safeTruncate(character.tagline, 150),
    [character.tagline],
  );
  const [showNSFW, setShowNSFW] = useState(false);

  // Parse tags and check if any NSFW tag is present
  const characterTags = parseTags(character.tags);
  const isNSFW = characterTags.some(tag => NSFWCharacterTags.includes(tag as any));

  // Get NSFW setting from localStorage, default to false if not set
  const [shouldBlur, setShouldBlur] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("nsfw") !== "true" && isNSFW;
    }
    return isNSFW; // Default to blurring NSFW content on initial server-side render
  });

  const handleViewNSFW = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShouldBlur(false);
    setShowNSFW(true);
  };

  return (
    <Link
      href={`/chat/${character.id}`}
      passHref
      className="block w-full h-full"
    >
      <Card className="bg-neutral-800 overflow-hidden rounded-lg h-full flex flex-col">
        <CardContent className="flex flex-col px-0 flex-grow">
          <div className="relative w-full pb-[100%] rounded-lg overflow-hidden">
            <Image
              src={character.avatar_image_url ?? "/default-avatar.jpg"}
              alt={character.name}
              layout="fill"
              objectFit="cover"
              className={`overflow-hidden border h-full w-full transition-all duration-200 ${
                shouldBlur ? 'blur-xl' : ''
              }`}
            />
            {shouldBlur && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={handleViewNSFW}
                  className="bg-black text-white px-2 py-2 rounded-lg text-[8px] font-medium hover:bg-gray-900 transition-colors duration-200"
                >
                  View NSFW Content
                </button>
              </div>
            )}
          </div>
          <div className="px-1">
            <h3 className="mt-2 text-xs font-semibold text-gray-200 truncate text-wrap break-words">
              {character.name}
            </h3>
            {isNSFW && (
              <div className="mt-1 mb-2">
                <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] rounded inline-block">
                  NSFW
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 w-full px-1 flex-grow">
            {truncatedTagline}
          </p>
        </CardContent>
        <div className="flex items-center text-xs text-gray-500 mt-1 w-full justify-between px-2 py-2">
          <Link href={`/public-profile/${character.userId}`} className="hover:underline hover:text-blue-600">@{character.userName}</Link>
          <div className="flex items-center">
            <MessageCircle className="w-3 h-3 mr-1" />
            <span>{character.interactionCount}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
};

const AICharacterGrid: React.FC<{ initialCharacters: Character[] }> = ({
  initialCharacters,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sortOption, setSortOption] = useState<SortOption>("popular");
  const [showTags, setShowTags] = useState(false);
  const [characters, setCharacters] = useState<Character[]>(initialCharacters);

  const activeTags = useMemo(() => {
    const tags = searchParams.get('tags');
    return tags ? tags.split(',') : [];
  }, [searchParams]);

  useEffect(() => {
    const fetchCharacters = async () => {
      if (activeTags.length > 0) {
        const fetchedCharacters = await searchCharactersByTags(activeTags as CharacterTag[]);
        setCharacters(fetchedCharacters as Character[]); // Type assertion if needed
      } else {
        setCharacters(initialCharacters);
      }
    };

    fetchCharacters();
  }, [activeTags, initialCharacters]);

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

  const Button: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <div
      className={`text-sm font-semibold text-white rounded-lg p-2 text-center hover:cursor-pointer transition-colors duration-200 ${
        isActive ? "bg-black" : "bg-neutral-800 hover:bg-gray-700"
      }`}
      onClick={onClick}
    >
      {label}
    </div>
  );

  const CharacterTypeButton: React.FC<{ tag: CharacterTag }> = ({ tag }) => {
    const isActive = activeTags.includes(tag);
    
    const handleClick = () => {
      let newTags: string[];
      if (isActive) {
        newTags = activeTags.filter(t => t !== tag);
      } else {
        newTags = [...activeTags, tag];
      }
      router.push(`/?tags=${newTags.join(',')}`);
    };

    return (
      <div
        className={`text-sm font-semibold text-white rounded-lg p-2 text-center hover:cursor-pointer transition-colors duration-200 ${
          isActive ? "bg-black" : "bg-neutral-800 hover:bg-gray-700"
        }`}
        onClick={handleClick}
      >
        {tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </div>
    );
  };

  const handleReset = () => {
    router.push('/');
  };

  return (
    <div className="bg-neutral-900">
      <div className="w-full flex flex-wrap gap-2 mb-4">
        <Button label="Popular" isActive={sortOption === "popular"} onClick={() => setSortOption("popular")} />
        <Button label="New" isActive={sortOption === "new"} onClick={() => setSortOption("new")} />
        <Button label="Old" isActive={sortOption === "old"} onClick={() => setSortOption("old")} />
        <Button label="Tags" isActive={showTags} onClick={() => setShowTags(!showTags)} />
        <Button label="Leaderboard" onClick={() => router.push("/leaderboard")} isActive={false} />
        {activeTags.length > 0 && (
          <Button label="Reset Tags" isActive={false} onClick={handleReset} />
        )}
      </div>

      {showTags && (
        <div className="w-full flex flex-wrap gap-2 mb-4 overflow-x-auto">
          {AllCharacterTags.map((tag) => (
            <CharacterTypeButton key={tag} tag={tag} />
          ))}
        </div>
      )}
    
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {sortedCharacters.map((character) => (
          <AICharacterCard key={character.id} character={character} />
        ))}
      </div>
      <div className="border-t border-gray-700 mt-8" />
    </div>
  );
};

export default AICharacterGrid;