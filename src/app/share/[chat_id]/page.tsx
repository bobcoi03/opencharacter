import { db } from "@/server/db";
import { chat_sessions, characters, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import MessageAndInput from "@/app/chat/[character_id]/messages-and-input";
import { auth } from "@/server/auth";
import { CoreMessage } from "ai";
export const runtime = "edge";

export default async function PublicChat({ params }: { params: { chat_id: string } }) {
  const session = await auth()

  const { chat_id } = params;

  // Fetch the chat session
  const chatSession = await db.query.chat_sessions.findFirst({
    where: eq(chat_sessions.id, chat_id),
    columns: {
      id: true,
      share: true,
      messages: true,
      character_id: true,
    },
  });

  // If chat session doesn't exist or isn't shared, return 404
  if (!chatSession || !chatSession.share) {
    notFound();
  }

  // Fetch the character details and the user who created it
  const characterWithCreator = await db
    .select({
      character: characters,
      creatorName: users.name,
    })
    .from(characters)
    .leftJoin(users, eq(users.id, characters.userId))
    .where(eq(characters.id, chatSession.character_id))
    .limit(1)
    .then((rows) => rows[0]);

  // If character doesn't exist, return 404
  if (!characterWithCreator) {
    notFound();
  }

  const { character, creatorName } = characterWithCreator;

  return (
    <div className="md:ml-16 text-white">
      <MessageAndInput 
        user={undefined}
        messages={chatSession.messages as CoreMessage[]}
        character={character}
        made_by_name={creatorName || "Unknown"}
        chat_session={chat_id}
        share
      />
    </div>
  );
}