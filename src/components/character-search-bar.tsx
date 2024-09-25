"use client"

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

type Character = {
  id: string;
  name: string;
  tagline: string;
  avatar_image_url: string | null;
};

type SearchCharactersFunction = (query: string) => Promise<Character[]>;

export function CharacterSearchBar({ searchCharacters }: { searchCharacters: SearchCharactersFunction }) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.length < 1) {
        setSuggestions([]);
        return;
      }
      setIsLoading(true);
      try {
        console.log("searching...", inputValue);
        const results = await searchCharacters(inputValue);
        setSuggestions(results);
      } catch (error) {
        console.error('Error fetching character suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [inputValue, searchCharacters]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSelectCharacter = (character: Character) => {
    router.push(`/chat/${character.id}`);
  };

  return (
    <div className="relative w-full md:w-auto">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Search Characters"
        className="w-full py-2 px-10 bg-gray-100 dark:bg-neutral-800 text-black dark:text-white rounded-full text-sm"
      />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      )}
      {suggestions.length > 0 && (
        <ul className="absolute z-[9999] mt-1 w-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map(char => (
            <li 
              key={char.id}
              onClick={() => handleSelectCharacter(char)}
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 text-sm flex items-start"
            >
              {char.avatar_image_url && (
                <img src={char.avatar_image_url} alt={char.name} className="w-8 h-8 rounded-full mr-2 flex-shrink-0" />
              )}
              <div className="flex-grow min-w-0">
                <div className="font-medium text-black dark:text-white truncate">{char.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 break-words overflow-wrap-anywhere">{char.tagline}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}