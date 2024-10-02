import { db } from "@/server/db"
import { auth } from "@/server/auth"
import { group_chat_sessions, rooms } from "@/server/db/schema"
import { eq, desc } from "drizzle-orm"
import MessageBox from "@/components/message-box"

export const runtime = "edge"

// Define a type for the message structure
interface ChatMessage {
  sender: string;
  content: string;
  // Add other properties as needed, e.g., timestamp, id, etc.
}

async function getLatestSessionMessages(roomId: string): Promise<ChatMessage[]> {
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

  return JSON.parse(latestSession[0].messages) as ChatMessage[]
}

async function getRoomDetails(roomId: string) {
  const room = await db
    .select()
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .limit(1)

  if (room.length === 0) {
    throw new Error("Room not found")
  }

  return room[0]
}

export default async function RoomChat({
  params,
}: {
  params: { room_id: string };
}) {
  const messages = await getLatestSessionMessages(params.room_id)
  const roomDetails = await getRoomDetails(params.room_id)

  return (
    <div className="mx-auto text-center">
      <h1 className="text-2xl font-bold mb-4">{roomDetails.name}</h1>
      {roomDetails.topic && <p className="mb-4">Topic: {roomDetails.topic}</p>}
      
      <div className="mb-4">
        {messages.map((message, index) => (
          <div key={index} className="mb-2">
            <strong>{message.sender}:</strong> {message.content}
          </div>
        ))}
      </div>

      <MessageBox />
    </div>
  )
}