import { auth } from "@/server/auth";
import CreateRoomForm from "@/components/create-room-form";
import { searchCharacters, createRoom } from "@/app/actions/index";

export const runtime = "edge"

export default async function CreateRoomPage() {
    const session = await auth()

    if (!session || !session.user) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Sign In Required</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You must be signed in to create a room
            </p>
          </div>
        </div>
      );
    }
  
    async function search(query: string) {
      'use server'
      const characters = await searchCharacters(query, 30);
      return characters;
    }

    async function createRoomFunc(roomName: string, roomTopic: string | null, selectedCharacterIds: string[]) {
      'use server'
      const res = await createRoom(roomName, roomTopic, selectedCharacterIds);
      return res;
    }

    return <CreateRoomForm searchCharacters={search} createRoom={createRoomFunc} />
}