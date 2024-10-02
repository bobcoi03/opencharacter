import { auth } from "@/server/auth"
import Link from "next/link"
import { db } from "@/server/db"
import { rooms, roomCharacters, characters } from "@/server/db/schema"
import { eq, and, desc } from "drizzle-orm"

export const runtime = "edge"

export default async function RoomPage() {
    const session = await auth()
    
    if (!session || !session.user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
                <p className="mb-4">You must be signed in to view your rooms.</p>
                <Link href="/api/auth/signin" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Sign In
                </Link>
            </div>
        )
    }

    let userRoomsWithCharacters
    try {
        userRoomsWithCharacters = await db
            .select({
                room: rooms,
                character: characters,
            })
            .from(rooms)
            .leftJoin(
                roomCharacters,
                and(
                    eq(rooms.id, roomCharacters.roomId),
                    eq(rooms.userId, session.user.id!)
                )
            )
            .leftJoin(
                characters,
                eq(roomCharacters.characterId, characters.id)
            )
            .orderBy(desc(rooms.createdAt))

        // Group characters by room
        const roomsMap = new Map()
        userRoomsWithCharacters.forEach(({ room, character }) => {
            if (!roomsMap.has(room.id)) {
                roomsMap.set(room.id, { ...room, characters: [] })
            }
            if (character) {
                roomsMap.get(room.id).characters.push(character)
            }
        })

        userRoomsWithCharacters = Array.from(roomsMap.values())
    } catch (error) {
        console.error("Failed to fetch rooms:", error)
        return (
            <div className="md:ml-16 p-4">
                <h1 className="text-2xl font-bold mb-4">Rooms</h1>
                <p className="text-red-500">Failed to load rooms. Please try again later.</p>
            </div>
        )
    }

    return (
        <div className="md:ml-16 p-4">
            <h1 className="text-2xl font-bold mb-4">Rooms</h1>
            {userRoomsWithCharacters.length === 0 ? (
                <p>You haven't created any rooms yet.</p>
            ) : (
                <ul className="space-y-4">
                    {userRoomsWithCharacters.map((room) => (
                        <li key={room.id} className="border p-4 rounded-lg">
                            <h2 className="text-xl font-semibold">{room.name}</h2>
                            {room.topic && <p className="text-gray-600">{room.topic}</p>}
                            <p className="text-sm text-gray-500">
                                Created: {new Date(room.createdAt).toLocaleDateString()}
                            </p>
                            <div className="mt-2 flex space-x-2">
                                {room.characters.map((character: typeof characters.$inferSelect) => (
                                    <img 
                                        key={character.id}
                                        src={character.avatar_image_url || '/default-avatar.png'}
                                        alt={character.name}
                                        className="w-8 h-8 rounded-full"
                                        title={character.name}
                                    />
                                ))}
                            </div>
                            <Link href={`/room/${room.id}/chat`} className="mt-2 inline-block text-blue-500 hover:underline">
                                Enter Room
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
            <div className="mt-8">
                <Link href="/room/create" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                    Create New Room
                </Link>
            </div>
        </div>
    )
}