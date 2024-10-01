import { getUserRooms } from "@/app/actions/index"
import { auth } from "@/server/auth"
import Link from "next/link"

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

    let rooms
    try {
        rooms = await getUserRooms()
    } catch (error) {
        console.error("Failed to fetch rooms:", error)
        return (
            <div className="md:ml-16 p-4">
                <h1 className="text-2xl font-bold mb-4">Your Rooms</h1>
                <p className="text-red-500">Failed to load rooms. Please try again later.</p>
            </div>
        )
    }

    return (
        <div className="md:ml-16 p-4">
            <h1 className="text-2xl font-bold mb-4">Your Rooms</h1>
            {rooms.length === 0 ? (
                <p>You haven't created any rooms yet.</p>
            ) : (
                <ul className="space-y-4">
                    {rooms.map((room) => (
                        <li key={room.id} className="border p-4 rounded-lg">
                            <h2 className="text-xl font-semibold">{room.name}</h2>
                            {room.topic && <p className="text-gray-600">{room.topic}</p>}
                            <p className="text-sm text-gray-500">
                                Created: {new Date(room.createdAt).toLocaleDateString()}
                            </p>
                            <Link href={`/room/${room.id}`} className="text-blue-500 hover:underline">
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