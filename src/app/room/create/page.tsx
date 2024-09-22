import { auth } from "@/server/auth";
import CreateRoomForm from "@/components/create-room-form";
import { searchCharacters } from "@/app/actions";

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
      // You can use the session here if needed
      // For example, to filter characters based on user permissions
      const characters = await searchCharacters(query, 30);
      // You might want to filter or process the results here
      // based on the session or other server-side logic
      return characters;
    }

    return <CreateRoomForm searchCharacters={search} />
}