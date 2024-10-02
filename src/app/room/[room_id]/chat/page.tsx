import { db } from "@/server/db"
import { auth } from "@/server/auth"
import { group_chat_sessions, rooms, characters, group_chat_session_characters } from "@/server/db/schema"
import { eq, desc, and } from "drizzle-orm"
import MessageBox from "@/components/message-box"
import { CoreMessage } from "ai"
import { continueRoomChat } from "@/app/actions/chat"

export const runtime = "edge"

interface Character {
  id: string;
  name: string;
  description: string;
  avatar_image_url: string | null;
  // Add other properties from your character schema as needed
}

async function getLatestSessionMessages(roomId: string): Promise<CoreMessage[]> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("User must be logged in to fetch messages")
  }

  const latestSession = await db
    .select()
    .from(group_chat_sessions)
    .where(eq(group_chat_sessions.roomId, roomId))
    .orderBy(desc(group_chat_sessions.createdAt))
    .limit(1)

  if (latestSession.length === 0) {
    return []
  }

  return JSON.parse(latestSession[0].messages)
}

async function getRoomDetails(roomId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("User must be logged in to fetch room details")
  }

  const room = await db
    .select()
    .from(rooms)
    .where(
      and(
        eq(rooms.id, roomId),
        eq(rooms.userId, session.user.id)
      )
    )
    .limit(1)

  if (room.length === 0) {
    throw new Error("Room not found or you don't have permission to access it")
  }

  return room[0]
}

async function getGroupChatSessionCharacters(roomId: string): Promise<Character[]> {
  const latestSession = await db
    .select()
    .from(group_chat_sessions)
    .where(eq(group_chat_sessions.roomId, roomId))
    .orderBy(desc(group_chat_sessions.createdAt))
    .limit(1)

  if (latestSession.length === 0) {
    return []
  }

  const sessionCharacters = await db
    .select({
      id: characters.id,
      name: characters.name,
      description: characters.description,
      avatar_image_url: characters.avatar_image_url,
    })
    .from(group_chat_session_characters)
    .innerJoin(
      characters,
      eq(group_chat_session_characters.characterId, characters.id)
    )
    .where(eq(group_chat_session_characters.sessionId, latestSession[0].id))

  return sessionCharacters
}

export default async function RoomChat({
  params,
}: {
  params: { room_id: string };
}) {
  try {
    const roomDetails = await getRoomDetails(params.room_id)
    const messages = await getLatestSessionMessages(params.room_id)
    const sessionCharacters = await getGroupChatSessionCharacters(params.room_id)

    async function continueRoomChatFunc(messages: CoreMessage[], room_id: string, chat_length: number, model_id: string) {
      "use server"
      const res = await continueRoomChat(messages, room_id, chat_length, model_id)
      return res;
    }

    return (
      <div className="mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">{roomDetails.name}</h1>
        {roomDetails.topic && <p className="mb-4">Topic: {roomDetails.topic}</p>}
        
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Characters in this session:</h2>
          <ul className="list-disc list-inside">
            {sessionCharacters.map((character) => (
              <li key={character.id} className="flex items-center justify-center mb-2">
                {character.avatar_image_url && (
                  <img src={character.avatar_image_url} alt={character.name} className="w-8 h-8 rounded-full mr-2" />
                )}
                <span className="text-xs">{character.name} - {character.description}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Messages:</h2>
          {messages.map((message, index) => (
            <div key={index} className="mb-2">
              <strong>{message.content as string}:</strong> 
            </div>
          ))}
        </div>

        <MessageBox action={continueRoomChatFunc} room={roomDetails} messages={messages} />
      </div>
    )
  } catch (error) {
    if (error instanceof Error && error.message === "Room not found or you don't have permission to access it") {
      return (
        <div className="mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
          <p>You do not have permission to access this room or the room does not exist.</p>
        </div>
      )
    }
    // Handle other errors
    return (
      <div className="mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>An unexpected error occurred. Please try again later.</p>
      </div>
    )
  }
}