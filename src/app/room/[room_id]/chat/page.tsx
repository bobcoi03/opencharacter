import { db } from "@/server/db"
import { auth } from "@/server/auth"
import { group_chat_sessions, rooms, characters, group_chat_session_characters, ChatMessageArray } from "@/server/db/schema"
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
}

async function getLatestSessionMessages(roomId: string): Promise<ChatMessageArray> {
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

  return latestSession[0].messages
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

async function continueRoomChatFunc(messages: CoreMessage[], room_id: string, chat_length: number, model_id: string) {
  "use server"
  const res = await continueRoomChat(messages, room_id, chat_length, model_id)
  return res;
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

    return (
      <div className="mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">{roomDetails.name}</h1>
        
        {roomDetails.topic && (
          <div className="mb-6 p-4 rounded-lg">
            <h2 className="text-md font-semibold mb-2">Topic:</h2>
            <p>{roomDetails.topic}</p>
          </div>
        )}
        
        <div className="mb-6">
          <div className="flex flex-row justify-center space-x-4">
            {sessionCharacters.map((character) => (
              <div key={character.id} className="flex flex-col items-center">
                <img 
                  src={character.avatar_image_url || '/default-avatar.png'} 
                  alt={character.name} 
                  className="w-16 h-16 rounded-full mb-2"
                />
                <span className="text-sm font-medium">{character.name}</span>
              </div>
            ))}
          </div>
        </div>

        <MessageBox action={continueRoomChatFunc} room={roomDetails} initialMessages={messages} />
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