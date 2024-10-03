"use server"

import { db } from "@/server/db"
import { auth } from "@/server/auth"
import { group_chat_session_characters, group_chat_sessions, roomCharacters, rooms } from "@/server/db/schema"
import { eq, sql } from "drizzle-orm"

export async function getRandomCharacterFromRoom(room: typeof rooms.$inferSelect) {
  // Ensure the user is authenticated
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("User not authenticated")
  }

  try {
    // Query to get a random character ID from the room
    const randomCharacter = await db
      .select({ characterId: roomCharacters.characterId })
      .from(roomCharacters)
      .where(eq(roomCharacters.roomId, room.id))
      .orderBy(sql`RANDOM()`)
      .limit(1)
      .execute()

    // Check if a character was found
    if (randomCharacter.length === 0) {
      throw new Error("No characters found in this room")
    }

    // Return the random character ID
    return randomCharacter[0]
  } catch (error) {
    console.error("Error fetching random character from room:", error)
    throw error
  }
}

export async function createRoom(
  roomName: string,
  roomTopic: string | null,
  selectedCharacterIds: string[]
) {
  try {
    const session = await auth()
    console.log("Session at roomCreate: ", session)
    if (!session?.user?.id) {
      throw new Error("User must be logged in to create a room")
    }

    const userId = session.user.id

    // Try to insert a room without a transaction first
    const [newRoom] = await db
      .insert(rooms)
      .values({
        name: roomName,
        topic: roomTopic,
        userId: userId,
        visibility: "private", 
      })
      .returning()

    console.log("Room created:", newRoom)

    // If the above succeeds, try to insert room characters
    if (newRoom) {
      const roomCharacterValues = selectedCharacterIds.map((characterId) => ({
        roomId: newRoom.id,
        characterId: characterId,
      }))

      await db.insert(roomCharacters).values(roomCharacterValues)
      console.log("Room characters inserted")
    }

    // Create an initial group chat session for the room
    const [newSession] = await db
      .insert(group_chat_sessions)
      .values({
        roomId: newRoom.id,
        userId: userId,
        messages: [] // Initialize with an empty array of messages
      })
      .returning()

    console.log("Group chat session created:", newSession)

    // Associate characters with the group chat session
    if (newSession) {
      const sessionCharacterValues = selectedCharacterIds.map((characterId) => ({
        sessionId: newSession.id,
        characterId: characterId,
      }))

      await db.insert(group_chat_session_characters).values(sessionCharacterValues)
      console.log("Session characters inserted")
    }

    return newRoom
  } catch (error) {
    console.error("Error in createRoom:", error)
    throw new Error("Failed to create room: " + (error instanceof Error ? error.message : String(error)))
  }
}

export async function getUserRooms() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("User must be logged in to fetch rooms")
  }

  const userRooms = await db
    .select()
    .from(rooms)
    .where(eq(rooms.userId, session.user.id))
    .orderBy(rooms.createdAt)

  return userRooms
}