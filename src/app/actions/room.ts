"use server"
import { db } from "@/server/db"
import { auth } from "@/server/auth"
import { group_chat_session_characters, group_chat_sessions, roomCharacters, rooms } from "@/server/db/schema"

export async function createRoom(
  roomName: string,
  roomTopic: string | null,
  selectedCharacterIds: string[]
) {
  // Get the current user's session
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("User must be logged in to create a room")
  }

  const userId = session.user.id

  // Start a transaction
  return await db.transaction(async (tx) => {
    // Create the room
    const [newRoom] = await tx
      .insert(rooms)
      .values({
        name: roomName,
        topic: roomTopic,
        userId: userId,
        visibility: "public", // You might want to make this configurable
      })
      .returning()

    // Associate characters with the room
    const roomCharacterValues = selectedCharacterIds.map((characterId) => ({
      roomId: newRoom.id,
      characterId: characterId,
    }))

    await tx.insert(roomCharacters).values(roomCharacterValues)

    // Create an initial group chat session for the room
    const [newSession] = await tx
      .insert(group_chat_sessions)
      .values({
        roomId: newRoom.id,
        userId: userId,
        messages: JSON.stringify([]) // Initialize with an empty array of messages
      })
      .returning()

    // Associate characters with the group chat session
    const sessionCharacterValues = selectedCharacterIds.map((characterId) => ({
      sessionId: newSession.id,
      characterId: characterId,
    }))

    await tx.insert(group_chat_session_characters).values(sessionCharacterValues)

    return newRoom
  })
}