"use client"

import React, { useState, useEffect } from 'react';
import { getConversations } from "@/app/actions/index"
import Link from 'next/link';
import Image from 'next/image';

type Conversation = {
  id: string;
  character_id: string;
  character_name: string | null;
  character_avatar: string | null;
  last_message_timestamp: string;
  updated_at: string;
  interaction_count: number;
};

export default function Conversation() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConversations() {
      setIsLoading(true);
      try {
        const result = await getConversations();
        if (result.error) {
          setError(result.message || "An error occurred while fetching conversations");
        } else {
          setConversations(result.conversations ?? []); // Use fallback to empty array
        }
      } catch (err) {
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchConversations();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 mb-12">
      <h1 className="text-xl font-semibold mb-6">Your Conversations</h1>
      {conversations.length === 0 ? (
        <p>You haven{"'"}t started any conversations yet.</p>
      ) : (
        <div className="space-y-4">
          {conversations.map((conversation) => (
            <Link href={`/chat/${conversation.character_id}`} key={conversation.id} className="block">
              <div className="bg-neutral-900 rounded-lg p-4 hover:bg-neutral-800 transition-colors duration-200 h-24 flex items-center">
                <div className="flex items-center w-full">
                  <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 mr-4">
                    {conversation.character_avatar ? (
                      <Image
                        src={conversation.character_avatar}
                        alt={conversation.character_name || "Character"}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-700"></div>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <h2 className="text-sm font-semibold text-white truncate">
                      {conversation.character_name || "Unnamed Character"}
                    </h2>
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      Last message: {new Date(conversation.last_message_timestamp).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Interactions: {conversation.interaction_count}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}