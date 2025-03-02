import { Suspense } from "react";
import { ChevronLeft, Lock } from "lucide-react";
import EllipsisButton from "@/components/chat-settings-button";
import MessageAndInput from "./messages-and-input";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { characters, chat_sessions, personas, users } from "@/server/db/schema";
import { eq, and, desc, or } from "drizzle-orm";
import { CoreMessage } from "ai";
import Link from "next/link";
import { Metadata } from "next";
import CharacterAvatar from "@/components/ai-avatar";
import dynamic from "next/dynamic";

// Use a regular import for type checking
import type { default as ChatBackgroundWrapperType } from "@/components/chat-background";

// Import the ChatBackgroundWrapper component with dynamic import to avoid SSR issues
const ChatBackgroundWrapper = dynamic(
  () => import("@/components/chat-background"),
  { ssr: false }
) as typeof ChatBackgroundWrapperType;

export const runtime = "edge";

export async function generateMetadata({
  params,
}: {
  params: { character_id: string };
}): Promise<Metadata> {
  const character = await db.query.characters.findFirst({
    where: eq(characters.id, params.character_id),
  });

  if (!character) {
    return {
      title: "Character Not Found",
    };
  }

  const title = `Chat with ${character.name}`;
  const description = character.description.substring(0, 200);
  const imageUrl = character.avatar_image_url || "/default-avatar.png";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
      creator: "@justwrapapi", 
    },
    other: {
      "og:site_name": "OpenCharacter",
      "og:locale": "en_US",
      "og:url": `https://opencharacter.org/chat/${params.character_id}`, 
    },
    alternates: {
      canonical: `https://opecharacter.org/chat/${params.character_id}`,
    },
  };
}

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: { character_id: string };
  searchParams: { [key: string]: string | string[] | undefined };
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

  let character = await db.query.characters.findFirst({
    where: whereClause,
  });

  if (!character) {
    return <div>Character not found</div>;
  }

  let initialMessages: CoreMessage[] = [
    { role: "system", content: character.description },
    { role: "assistant", content: character.greeting },
  ];

  let persona;
  if (session?.user) {
    let chatSession;

    if (searchParams.session) {
      // If a specific session ID is provided in the URL
      console.log("searchParams: session: ", searchParams.session);

      chatSession = await db.query.chat_sessions.findFirst({
        where: and(
          eq(chat_sessions.id, searchParams.session as string),
          eq(chat_sessions.user_id, session.user.id!),
          eq(chat_sessions.character_id, character.id),
        ),
      });
    } else {
      // If no specific session ID is provided, get the most recent session
      chatSession = await db.query.chat_sessions.findFirst({
        where: and(
          eq(chat_sessions.user_id, session.user.id!),
          eq(chat_sessions.character_id, character.id),
        ),
        orderBy: [desc(chat_sessions.updated_at)],
      });
    }

    if (chatSession) {
      initialMessages = [
        { role: "system", content: character.description },
        { role: "assistant", content: character.greeting },
        ...(chatSession.messages as CoreMessage[]).slice(2),
      ];
    }

    persona = await db.query.personas.findFirst({
      where: and(
        eq(personas.userId, session.user.id!),
        eq(personas.isDefault, true),
      ),
    });
  }

  let madeByUsername = "anon";
  if (character.userId) {
    // Fetch the username of the character creator
    const characterCreator = await db.query.users.findFirst({
      where: eq(users.id, character.userId),
      columns: { name: true }
    });
    madeByUsername = characterCreator?.name ?? "anon";
  }

  return (
    <ChatBackgroundWrapper>
      <div className="flex flex-col relative overflow-x-hidden max-w-full">
        <ChatHeader 
          character={character}
          madeByUsername={madeByUsername}
          chatSession={(searchParams.session as string) ?? null}
          messages={initialMessages} 
        />

        {/* Chat Content */}
        <div className="flex-grow overflow-y-auto pt-[72px] pb-4">
          <MessageAndInput
            user={session?.user}
            character={character}
            made_by_name={madeByUsername}
            messages={initialMessages}
            chat_session={(searchParams.session as string) ?? null}
            persona={persona}
          />
        </div>
      </div>
    </ChatBackgroundWrapper>
  );
}

function ChatHeader({
  character,
  madeByUsername,
  chatSession,
  messages,
}: {
  character: typeof characters.$inferSelect;
  madeByUsername: string;
  chatSession: string | null;
  messages: CoreMessage[]
}) {
  return (
    <div className="bg-neutral-900/90 backdrop-blur-md p-4 flex items-center justify-between border-neutral-700 fixed md:fixed top-0 md:top-0 left-0 right-0 z-10">
      <div className="flex items-center">
        <Link href={"/"}>
          <ChevronLeft className="w-8 h-8 text-neutral-700" />
        </Link>

        <CharacterAvatar character={character} />

        <div className="flex items-start flex-col">
          <div className="flex flex-row gap-2 items-center">
            <h2 className="font-light text-white">
              {character.name}
            </h2>
            {character.visibility === "private" && (
              <Lock
                size={12}
                className="ml-2 text-gray-400"
              />
            )}
          </div>
          <Link className="text-xs font-light text-gray-400 hover:underline hover:text-blue-700" href={`/public-profile/${character.userId}`}>
            by {madeByUsername}
          </Link>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Suspense fallback={<div className="w-10 h-10" />}>
          <EllipsisButton
            chat_session={chatSession}
            messages={messages}
            character={character}
            made_by_username={madeByUsername}
          />
        </Suspense>
      </div>
    </div>
  );
}
