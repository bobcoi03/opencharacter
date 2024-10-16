import React from "react";
import { ArrowLeft, MessageSquare, Share2 } from "lucide-react";
import Link from "next/link";
import { characters, users } from "@/server/db/schema";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { db } from "@/server/db";
import { eq, and, or } from "drizzle-orm";
import { auth } from "@/server/auth";

export const runtime = "edge";

const MAX_DESCRIPTION_LENGTH = 25000;

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

  const truncateDescription = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <div className="bg-white dark:bg-neutral-900 min-h-screen p-4 lg:p-6 overflow-y-auto mt-12 mb-24 md:ml-12">
      <header className="">
        <Link
          href="/"
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 inline-block"
        >
          <ArrowLeft size={24} className="text-black dark:text-white" />
        </Link>
      </header>

      <div className="max-w-5xl mx-auto lg:flex lg:space-x-8 overflow-x-hidden">
        {/* Left column (Profile info) */}
        <div className="lg:w-1/3 mb-6 lg:mb-0">
          <div className="flex flex-col items-center mb-6">
            <Avatar className="w-64 h-64 mb-4">
              <img
                src={character.avatar_image_url || "/default-avatar.jpg"}
                alt={character.name}
                className="w-full h-full object-cover rounded-full"
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

        {/* Right column (About and Chat Starters) */}
        <div className="lg:w-2/3">
          <div className="mb-8">
            <div className="bg-gray-100 dark:bg-neutral-800 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-2 text-black dark:text-white">
                About {character.name}
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                {truncateDescription(
                  character.description,
                  MAX_DESCRIPTION_LENGTH,
                )}
              </p>

              <h3 className="text-md font-semibold mb-2 text-black dark:text-white">
                Greeting Message from {character.name}
              </h3>
              <p className="text-md text-gray-700 dark:text-gray-300 mb-4">
                {character.tagline}
              </p>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}