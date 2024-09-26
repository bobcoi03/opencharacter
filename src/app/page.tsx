import { auth } from "@/server/auth";
import CreateCharacterCardMarketing from "@/components/create-character-card-marketing";
import { searchCharacters } from "./actions/index";
import Navbar from "@/components/navbar";
import { db } from "@/server/db";
import { desc } from "drizzle-orm";
import { characters } from "@/server/db/schema";
import AICharacterGrid from "@/components/ai-character-grid";

export const runtime = "edge";

export default async function Page() {
  const session = await auth();
  const popularCharacters = await getPopularCharacters()

  async function getPopularCharacters() {
    return await db.query.characters.findMany({
      orderBy: [desc(characters.interactionCount)],
      limit: 500, // Reduced for better horizontal scrolling experience
    });
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
  
  return (
    <div className="text-white w-full overflow-y-auto overflow-x-hidden">

      <AICharacterGrid characters={popularCharacters} />

    </div>
  );
}