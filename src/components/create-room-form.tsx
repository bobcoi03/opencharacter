"use client"

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type Character = {
  id: string;
  name: string;
  tagline: string;
  avatar_image_url: string | null;
};

type SearchCharactersFunction = (query: string) => Promise<Character[]>;

export default function CreateRoomForm({ searchCharacters }: { searchCharacters: SearchCharactersFunction }) {
    const [roomName, setRoomName] = useState('');
  const [selectedCharacters, setSelectedCharacters] = useState<Character[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Character[]>([]);
  const [roomTopic, setRoomTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.length < 2) {
        setSuggestions([]);
        return;
      }
      setIsLoading(true);
      try {
        console.log("searching...", inputValue)
        const results = await searchCharacters(inputValue);
        setSuggestions(results.filter(char => 
          !selectedCharacters.some(selected => selected.id === char.id)
        ));
      } catch (error) {
        console.error('Error fetching character suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [inputValue, selectedCharacters]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSelectCharacter = (character: Character) => {
    setSelectedCharacters(prev => [...prev, character]);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleRemoveCharacter = (id: string) => {
    setSelectedCharacters(prev => prev.filter(char => char.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault();
      handleSelectCharacter(suggestions[0]);
    }
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCharacters.length < 2) {
      alert('Please select at least 2 characters.');
      return;
    }
    console.log('Room created:', { 
      roomName, 
      characters: selectedCharacters, 
      roomTopic 
    });
  };

  return (
    <div className="w-full bg-white dark:bg-neutral-900 min-h-screen p-6 overflow-y-auto mt-12">
      <header>
        <Link href="/" className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 inline-block">
          <ArrowLeft size={16} />
        </Link>
      </header>

      <div className="max-w-3xl mx-auto p-4">
        <form className="space-y-4" onSubmit={handleCreateRoom}>
          <div className="space-y-3">
            <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Room Name (EXPERIMENTAL FEATURE!)</label>
            <input
              id="roomName"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. Lincoln-Einstein, Music Lovers, Sci-Fi discuss"
              className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-neutral-900"
              required
            />
          </div>
          
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Add Characters (select at least 2, max is 10)</label>
            <div className="border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-neutral-900">
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedCharacters.map(char => (
                  <div key={char.id} className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-md flex items-center text-sm">
                    {char.avatar_image_url && (
                      <img src={char.avatar_image_url} alt={char.name} className="w-6 h-6 rounded-full mr-2" />
                    )}
                    {char.name}
                    <button type="button" onClick={() => handleRemoveCharacter(char.id)} className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type character names..."
                className="w-full p-2 text-sm bg-transparent"
              />
              {isLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading suggestions...</p>
              ) : suggestions.length > 0 && (
                <ul className="mt-1 max-h-40 overflow-auto">
                  {suggestions.map(char => (
                    <li 
                      key={char.id}
                      onClick={() => handleSelectCharacter(char)}
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 text-sm flex items-center"
                    >
                      {char.avatar_image_url && (
                        <img src={char.avatar_image_url} alt={char.name} className="w-8 h-8 rounded-full mr-2" />
                      )}
                      <div>
                        <div>{char.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{char.tagline}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Please select at least 2 characters to add to this room. Note: Only the top 5000 public characters are available for now.
            </p>
          </div>
          
          <div className="space-y-3">
            <label htmlFor="roomTopic" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Room Topic (optional)</label>
            <textarea
              id="roomTopic"
              value={roomTopic}
              onChange={(e) => setRoomTopic(e.target.value)}
              placeholder="What should happen in this room. Characters will try to follow it. Examples: Play by play superhero battle, Discuss the latest episode of Game of Thrones."
              className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-neutral-900 h-24"
            />
          </div>
          
          <div className='w-full flex justify-end'>
            <button 
                type="submit"
                className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition duration-200 text-sm font-medium"
            >
                Create Room!
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}