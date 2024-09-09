"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from 'lucide-react';

interface AICharacter {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  category: string;
  duration: string;
}

const fakeCharacters: AICharacter[] = [
  { id: '1', name: 'Annie Affirmations', description: "I'm Daily Affirmations and my job is to help you stay positive, motivated, and inspire...", avatarUrl: 'https://api.dicebear.com/6.x/adventurer/svg?seed=Annie', category: "For you", duration: "47.4m" },
  { id: '2', name: 'Get Advice', description: "I'm here to offer thoughtful recommendations for everything from daily life hacks to complex...", avatarUrl: 'https://api.dicebear.com/6.x/adventurer/svg?seed=Advice', category: "For you", duration: "18.7m" },
  { id: '3', name: 'Practice interviewing', description: "Practice your interview skills with a virtual interviewer", avatarUrl: 'https://api.dicebear.com/6.x/adventurer/svg?seed=Interview', category: "Try these", duration: "12.4m" },
  { id: '4', name: 'Brainstorm ideas', description: "Generate creative ideas with an AI brainstorming partner", avatarUrl: 'https://api.dicebear.com/6.x/adventurer/svg?seed=Brainstorm', category: "Try these", duration: "206.9m" },
  { id: '5', name: 'Plan a trip', description: "Get help planning your next vacation or travel adventure", avatarUrl: 'https://api.dicebear.com/6.x/adventurer/svg?seed=Trip', category: "Try these", duration: "32.5m" },
  { id: '6', name: 'Write a story', description: "Collaborate with an AI to write a short story or creative piece", avatarUrl: 'https://api.dicebear.com/6.x/adventurer/svg?seed=Story', category: "Try these", duration: "66.2m" },
];

const AICharacterCard: React.FC<{ character: AICharacter; isLoading: boolean }> = ({ character, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="w-full bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700">
        <CardContent className="p-4">
          <Skeleton className="h-12 w-12 rounded-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5 mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href={`/chat/${character.id}`} passHref>
      <Card className="w-full bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            <Avatar className="w-12 h-12">
              <img src={character.avatarUrl} alt={character.name} className="rounded-full" />
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{character.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{character.description}</p>
            </div>
          </div>
          <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3 h-3 mr-1" />
            <span>{character.duration}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export const AICharacterGrid: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const groupedCharacters = fakeCharacters.reduce((acc, character) => {
    if (!acc[character.category]) {
      acc[character.category] = [];
    }
    acc[character.category].push(character);
    return acc;
  }, {} as Record<string, AICharacter[]>);

  return (
    <div className="space-y-6 bg-white dark:bg-neutral-900 p-6">
      {Object.entries(groupedCharacters).map(([category, characters]) => (
        <div key={category}>
          <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {characters.map((character) => (
              <AICharacterCard key={character.id} character={character} isLoading={isLoading} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
