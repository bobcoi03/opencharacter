"use client";

import React, { useState, useCallback, useRef } from 'react';
import { Search, Globe2, Lock, MessageSquare, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { searchCharacters } from '@/app/actions';

type Character = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  visibility: string;
  avatar_image_url: string | null;
  interactionCount: number;
  tags: string;
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length === 0) {
      setCharacters([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await searchCharacters(searchQuery);
      setCharacters(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  return (
    <div className="min-h-screen md:ml-16">
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
              className="w-full h-12 pl-12 pr-4 rounded-full bg-gray-900 border border-gray-800 
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
                  className="px-4 py-2 rounded-full bg-gray-800 hover:bg-gray-700 
                           transition-colors text-sm text-gray-400 border border-gray-700"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter Tags - Only show when there are results */}
        {query && characters.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-6 text-sm px-2">
            {['All', 'Public', 'Private', 'Most Popular', 'Recent'].map((filter) => (
              <button
                key={filter}
                className="text-gray-400 hover:text-white transition-colors px-1 py-2 border-b-2 border-transparent hover:border-blue-500 whitespace-nowrap"
              >
                {filter}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Section */}
      {query && (
        <div className="max-w-6xl mx-auto px-4 py-6 border-t border-gray-800">
          {/* Results Count */}
          {!isSearching && characters.length > 0 && (
            <p className="text-sm text-gray-500 mb-4">
              Found {characters.length} characters
            </p>
          )}

          {/* Results Grid */}
          <div className="grid gap-4 w-full">
            {characters.map((character) => (
              <div
                key={character.id}
                onClick={() => router.push(`/chat/${character.id}`)}
                className="w-full bg-gray-900/0 hover:bg-gray-900/50 rounded-xl cursor-pointer group"
              >
                <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 w-full">
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
                  <div className="min-w-0 flex-auto"> {/* Changed flex-1 to flex-auto */}
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
                    <p className="text-sm text-gray-400 mb-2 truncate">{character.tagline}</p>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2 break-words">{character.description}</p>
                    
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
              </div>
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