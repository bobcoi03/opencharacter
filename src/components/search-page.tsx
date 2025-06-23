"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Globe2, Lock, MessageSquare, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { searchCharacters } from '@/app/actions';
import Link from 'next/link';

type Character = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  visibility: string;
  avatar_image_url: string | null;
  interactionCount: number;
  tags: string;
  greeting: string
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length === 0) {
      setCharacters([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await searchCharacters(searchQuery, 30);
      setCharacters(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Auto-focus the search input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="min-h-screen md:ml-16 overflow-x-hidden mb-24">
      {/* Search Section */}
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-8">
        {!query && (
          <h1 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
            Character Search
          </h1>
        )}
        
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
              placeholder="Search characters..."
              className="w-full h-12 pl-12 pr-4 rounded-full bg-black border 
                       text-white placeholder-gray-400 text-base md:text-lg focus:outline-none focus:ring-2 
                       focus:ring-blue-500/50 focus:border-transparent transition-all"
            />
            {isSearching ? (
              <Loader2 className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
            ) : (
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            )}
          </div>

          {/* Search Suggestions */}
          {!query && (
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {['AI', 'Assistant', 'Friend', 'Expert'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setQuery(tag);
                    handleSearch(tag);
                  }}
                  className="px-4 py-2 rounded-full bg-black hover:bg-gray-700 
                           transition-colors text-sm text-gray-400 border"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Results Section */}
      {query && (
        <div className="w-full max-w-6xl mx-auto py-6 border-t border-gray-800">
          {/* Results Count */}
          {!isSearching && characters.length > 0 && (
            <p className="text-sm text-gray-500 mb-4">
              Found {characters.length} characters
            </p>
          )}

          {/* Results Grid */}
          <div className="grid gap-4 w-full">
            {characters.map((character) => (
              <Link
                key={character.id}
                href={`/chat/${character.id}`}
                target='_blank'
                className="w-full bg-gray-900/0 hover:bg-gray-900/50 rounded-xl cursor-pointer group"
              >
                <div className="flex items-start gap-3 md:gap-4 p-4 w-full">
                  {/* Avatar */}
                  <div className="flex-none"> {/* Changed to flex-none */}
                    {character.avatar_image_url ? (
                      <img
                        src={character.avatar_image_url}
                        alt={character.name}
                        className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover border border-gray-800"
                      />
                    ) : (
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg bg-gray-800 flex items-center justify-center border border-gray-700">
                        <span className="text-lg md:text-xl font-medium text-gray-400">
                          {character.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0"> {/* Changed flex-1 to flex-auto */}
                    <div className="flex items-center gap-2 mb-1 w-full">
                      <h2 className="text-base md:text-lg font-medium text-white group-hover:text-blue-400 truncate">
                        {character.name}
                      </h2>
                      {character.visibility === 'public' ? (
                        <Globe2 className="flex-none w-4 h-4 text-blue-400" />
                      ) : (
                        <Lock className="flex-none w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-2 truncate text-wrap">{character.tagline.slice(0, 100)}</p>
                    <p className="text-sm text-gray-500 mb-3 break-words">{character.greeting.slice(0, 100)}</p>
                    
                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {character.interactionCount.toLocaleString()}
                      </span>
                      {character.tags && (
                        <div className="inline-flex flex-wrap items-center gap-2">
                          {JSON.parse(character.tags).slice(0, 2).map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400 truncate max-w-[120px]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* No Results */}
          {!isSearching && query && characters.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No characters found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}