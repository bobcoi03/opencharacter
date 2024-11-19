'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
    ArrowUpDown, 
    Clock, 
    MessageSquare, 
    Calendar,
} from 'lucide-react';
import { CharacterOptions } from './character-options';
import { characters } from '@/server/db/schema';

type SortField = {
    id: keyof typeof characters.$inferSelect;
    label: string;
    icon: React.ReactNode;
};

interface CharacterListProps {
    initialCharacters: typeof characters.$inferSelect[];
}

const CharacterList = ({ initialCharacters }: CharacterListProps) => {
    const [sortConfig, setSortConfig] = useState<{
        field: keyof typeof characters.$inferSelect;
        direction: 'asc' | 'desc';
    }>({ field: 'name', direction: 'asc' });

    const sortFields: SortField[] = [
        { id: 'name', label: 'Alphabet A-Z', icon: <ArrowUpDown className="h-4 w-4" /> },
        { id: 'interactionCount', label: 'Most Chatted', icon: <MessageSquare className="h-4 w-4" /> },
        { id: 'createdAt', label: 'Newest', icon: <Calendar className="h-4 w-4" /> },
        { id: 'updatedAt', label: 'Recently Updated', icon: <Clock className="h-4 w-4" /> },
    ];

    const getSortedCharacters = () => {
        return [...initialCharacters].sort((a, b) => {
            const { field, direction } = sortConfig;
            const multiplier = direction === 'asc' ? 1 : -1;

            switch (field) {
                case 'name':
                    return multiplier * a[field].localeCompare(b[field]);
                
                case 'interactionCount':
                    return b[field] - a[field]; // Reverse for "Most" to show highest first
                
                case 'createdAt':
                case 'updatedAt':
                    return multiplier * (new Date(a[field]).getTime() - new Date(b[field]).getTime());
                
                default:
                    return 0;
            }
        });
    };

    const handleSortChange = (field: keyof typeof characters.$inferSelect) => {
        setSortConfig(prev => ({
            field,
            direction: field === 'name' ? (prev.field === field ? (prev.direction === 'asc' ? 'desc' : 'asc') : 'asc') : 'desc'
        }));
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Your Characters</h2>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                            {sortFields.find(opt => opt.id === sortConfig.field)?.icon}
                            <span>{sortFields.find(opt => opt.id === sortConfig.field)?.label}</span>
                            {sortConfig.field === 'name' && (
                                <span className="text-xs text-neutral-500">
                                    ({sortConfig.direction === 'asc' ? '↑' : '↓'})
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {sortFields.map((option) => (
                            <DropdownMenuItem
                                key={option.id}
                                onClick={() => handleSortChange(option.id)}
                                className="flex items-center gap-2"
                            >
                                {option.icon}
                                <span>{option.label}</span>
                                {sortConfig.field === option.id && sortConfig.field === 'name' && (
                                    <span className="ml-2">
                                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {getSortedCharacters().map((character) => (
                <div key={character.id} className="flex items-center justify-between hover:bg-neutral-800 p-2 hover:rounded-xl">
                    <Link href={`/chat/${character.id}`} className="flex items-center space-x-3 min-w-0 flex-grow">
                        {character.avatar_image_url ? (
                            <div className="w-12 h-12 rounded-sm overflow-hidden flex-shrink-0">
                                <Image
                                    src={character.avatar_image_url}
                                    alt={character.name}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold bg-gradient-to-br from-black via-black to-purple-300 flex-shrink-0">
                                {character.name[0]}
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <h2 className="font-semibold text-sm truncate">{character.name}</h2>
                            <p className="text-xs text-neutral-400 truncate">{character.tagline}</p>
                        </div>
                    </Link>
                    <CharacterOptions character={character} />
                </div>
            ))}
        </div>
    );
};

export default CharacterList;