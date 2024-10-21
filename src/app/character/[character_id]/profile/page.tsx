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
import { User } from "lucide-react";

export const runtime = "edge";

const MAX_DESCRIPTION_LENGTH = 1000;
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
    <div className="bg-white dark:bg-neutral-900 min-h-screen p-4 lg:p-6 overflow-y-auto mb-24 md:ml-16">
      <header className="">
        <Link
          href={`/chat/${character.id}`}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 inline-block"
        >
          <ArrowLeft size={24} className="text-black dark:text-white" />
        </Link>
      </header>

      <div className="max-w-6xl mx-auto lg:flex lg:space-x-8 overflow-x-hidden">
        {/* Left column (Profile info) */}
        <div className="lg:w-1/3 mb-6 lg:mb-0">
          <div className="flex flex-col items-center mb-6">
            <Avatar className="w-72 h-72 mb-4 rounded-md">
              <img
                src={character.avatar_image_url || "/default-avatar.jpg"}
                alt={character.name}
                className="w-full h-full object-cover rounded-md"
              />
            </Avatar>
            <h1 className="text-2xl font-bold text-center text-black dark:text-white">
              {character.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              By @{userName || "unknown"}
            </p>
          </div>

          <div className="flex justify-center space-x-4 mb-6">
            <Button className="bg-black dark:bg-white text-white dark:text-black px-10 sm:px-16 max-w-[180px] rounded-full px-10 sm:px-16 py-6">
              <Link href={`/chat/${character.id}`} className="font-semibold">
                Chat
              </Link>
            </Button>

            <Button
              variant="outline"
              className="p-2 rounded-full border-gray-300 dark:border-gray-700 py-6 px-6"
            >
              <Share2 size={26} className="text-black dark:text-white" />
            </Button>
          </div>

          <div className="flex justify-center space-x-8 mb-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <MessageSquare size={20} className="mr-2" />
              <span>{character.interactionCount} Chats</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6 justify-center">
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

        {/* Right column (About and Public Chats) */}
        <div className="lg:w-2/3">
          <div className="mb-8">
            <div className="bg-gray-100 dark:bg-neutral-800 px-4 py-2 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-2 text-black dark:text-white">
                About {character.name}
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                {truncateText(character.description, MAX_DESCRIPTION_LENGTH)}
              </p>

              <h3 className="text-md font-semibold mb-2 text-black dark:text-white">
                Greeting Message from {character.name}
              </h3>
              <p className="text-md text-gray-700 dark:text-gray-300 mb-4">
                {character.tagline}
              </p>
            </div>
          </div>

          {/* Public Chats Section */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-6 text-black dark:text-white">
              Public chats
            </h3>
            {publicChats.length > 0 ? (
              <div className="space-y-6">
                {publicChats.map((chat) => (
                  <Link 
                    key={chat.id} 
                    href={`/share/${chat.id}/`}
                    className="block"
                  >
                    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                      <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-8 h-8 rounded-md">
                              <img src={character.avatar_image_url || "/default-avatar.jpg"} alt={character.name} />
                            </Avatar>
                            <span className="font-medium text-gray-800 dark:text-gray-200">{character.name}</span>
                          </div>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                            Public
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {truncateText(getLatestMessage(chat.messages), MAX_MESSAGE_LENGTH)}
                        </p>
                      </div>
                      <div className="px-4 py-2 bg-gray-50 dark:bg-neutral-900 text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <MessageSquare size={14} className="mr-1" />
                            {chat.interaction_count} messages
                          </span>
                        </div>
                        <span className="flex items-center">
                          <Clock size={14} className="mr-1" />
                          {new Date(chat.last_message_timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-100 dark:bg-neutral-800 rounded-lg">
                <MessageSquare size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">No public conversations available yet.</p>
                <p className="text-gray-400 dark:text-gray-500 mt-2">Be the first to start a public chat with {character.name}!</p>
                <Button className="mt-4" variant="outline">
                  <Link href={`/chat/${character.id}`}>Start a Conversation</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}