import React from "react";
import { ArrowLeft, MessageSquare, Share2, Clock } from "lucide-react";
import Link from "next/link";
import { characters, users, chat_sessions } from "@/server/db/schema";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { db } from "@/server/db";
import { eq, and, or, desc } from "drizzle-orm";
import { auth } from "@/server/auth";
import { ChatBubbleIcon } from "@radix-ui/react-icons";
import { User, Calendar } from "lucide-react";
import ExpandableDescription from "@/components/expandable-description";
import { Metadata, ResolvingMetadata } from 'next/types'

type Props = {
  params: { character_id: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Fetch character data
  const character = await db.select({
    name: characters.name,
    greeting: characters.greeting,
    avatar_image_url: characters.avatar_image_url,
  })
  .from(characters)
  .where(eq(characters.id, params.character_id))
  .limit(1)
  .then(res => res[0]);

  if (!character) {
    return {
      title: 'Character Not Found',
    }
  }

  return {
    title: character.name,
    description: character.greeting,
    openGraph: {
      title: character.name,
      description: character.greeting,
      images: [character.avatar_image_url || '/default-avatar.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: character.name,
      description: character.greeting,
      images: [character.avatar_image_url || '/default-avatar.jpg'],
    },
  }
}

export const runtime = "edge";

const MAX_DESCRIPTION_LENGTH = 500;
const MAX_MESSAGE_LENGTH = 100;

export default async function CharacterProfilePage({
  params,
}: {
  params: { character_id: string };
}) {
  const session = await auth();
  const userId = session?.user?.id;

  let whereClause;
  if (userId) {
    // If there's a session, allow access to public characters and user's private characters
    whereClause = and(
      eq(characters.id, params.character_id),
      or(
        eq(characters.visibility, "public"),
        and(
          eq(characters.visibility, "private"),
          eq(characters.userId, userId),
        ),
      ),
    );
  } else {
    // If there's no session, only allow access to public characters
    whereClause = and(
      eq(characters.id, params.character_id),
      eq(characters.visibility, "public"),
    );
  }

  let result = await db.select({
    character: characters,
    userName: users.name,
  })
  .from(characters)
  .leftJoin(users, eq(characters.userId, users.id))
  .where(whereClause)
  .limit(1);

  if (result.length === 0) {
    return <div>No character found</div>;
  }

  const { character, userName } = result[0];

  // Fetch public chat sessions for this character
  const publicChats = await db.select({
    id: chat_sessions.id,
    last_message_timestamp: chat_sessions.last_message_timestamp,
    interaction_count: chat_sessions.interaction_count,
    messages: chat_sessions.messages,
  })
  .from(chat_sessions)
  .where(and(
    eq(chat_sessions.character_id, character.id),
    eq(chat_sessions.share, true)
  ))
  .orderBy(desc(chat_sessions.last_message_timestamp))
  .limit(5);

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  const getLatestMessage = (messages: any) => {
    if (!Array.isArray(messages) || messages.length === 0) return "No messages";
    const latestMessage = messages[messages.length - 1];
    return latestMessage.content || "Empty message";
  };

  return (
    <div className="bg-white dark:bg-neutral-900 min-h-screen max-w-2xl mx-auto">
      {/* Banner Image */}
      <div className="relative h-48 bg-gray-200 dark:bg-neutral-800">
        {character.banner_image_url && (
          <img
            src={character.banner_image_url}
            alt="Profile banner"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Profile Section */}
      <div className="relative px-4">
        {/* Avatar */}
        <div className="absolute -top-16 left-4 border-4 border-white dark:border-neutral-900 rounded-full">
          <Avatar className="w-32 h-32 rounded-full">
            <img
              src={character.avatar_image_url || "/default-avatar.jpg"}
              alt={character.name}
              className="w-full h-full object-cover rounded-full"
            />
          </Avatar>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end pt-4 pb-4">
          <Button className="bg-black dark:bg-white text-white dark:text-black rounded-full font-semibold">
            <Link href={`/chat/${character.id}`}>Chat</Link>
          </Button>
        </div>

        {/* Profile Info */}
        <div className="mt-2">
          <h2 className="text-xl font-bold text-black dark:text-white">{character.name}</h2>
          <Link className="text-blue-400" href={`/public-profile/${character.userId}`}>by @{userName || "unknown"}</Link>
          
          <ExpandableDescription 
            description={character.greeting}
          />

          <div className="flex items-center gap-4 mt-3 text-gray-500 dark:text-gray-400 text-sm">
            <div className="flex items-center">
              <Calendar size={16} className="mr-1" />
              <span>Created {new Date(character.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          <div className="flex gap-4 mt-3 text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              <strong className="text-black dark:text-white">{character.interactionCount}</strong> Chats
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {JSON.parse(character.tags).map((tag: string, index: number) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-gray-200 dark:bg-neutral-700 text-gray-800 dark:text-gray-200"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-neutral-800 mt-4">
          <nav className="flex">
            <button className="px-4 py-4 text-sm font-medium border-b-2 border-black dark:border-white text-black dark:text-white">
              Public Chats
            </button>
          </nav>
        </div>

        {/* Public Chats */}
        <div className="py-4">
          {publicChats.length > 0 ? (
            <div className="space-y-4">
              {publicChats.map((chat) => (
                <Link 
                  key={chat.id} 
                  href={`/share/${chat.id}/`}
                  className="block"
                >
                  <div className="p-4 border border-gray-200 dark:border-neutral-800 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                    <div className="flex gap-3">
                      <Avatar className="w-10 h-10 rounded-full">
                        <img src={character.avatar_image_url || "/default-avatar.jpg"} alt={character.name} />
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-black dark:text-white">{character.name}</span>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                            Public
                          </Badge>
                        </div>
                        <p className="mt-1 text-gray-600 dark:text-gray-300">
                          {truncateText(getLatestMessage(chat.messages), MAX_MESSAGE_LENGTH)}
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            <MessageSquare size={14} className="mr-1" />
                            {chat.interaction_count}
                          </span>
                          <span className="flex items-center">
                            <Clock size={14} className="mr-1" />
                            {new Date(chat.last_message_timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <MessageSquare size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">No public conversations yet</p>
              <p className="text-gray-400 dark:text-gray-500 mt-2">Start chatting with {character.name}!</p>
              <Button className="mt-4" variant="outline">
                <Link href={`/chat/${character.id}`}>Start a Conversation</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}