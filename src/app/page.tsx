import { auth } from "@/server/auth";
import CreateCharacterCardMarketing from "@/components/create-character-card-marketing";
import { searchCharacters } from "./actions/index";
import Navbar from "@/components/navbar";
import { db } from "@/server/db";
import { desc, eq } from "drizzle-orm";
import { characters } from "@/server/db/schema";
import AICharacterGrid from "@/components/ai-character-grid";

export const runtime = "edge";

export default async function Page() {
  const session = await auth();
  const popularCharacters = await getPopularCharacters();

  async function getPopularCharacters() {
    return await db.query.characters.findMany({
      where: eq(characters.visibility, "public"),
      orderBy: [desc(characters.interactionCount)],
      limit: 200, // Reduced for better horizontal scrolling experience
    });
  }

  async function search(query: string) {
    "use server";
    // You can use the session here if needed
    // For example, to filter characters based on user permissions
    const characters = await searchCharacters(query, 30);
    // Filter the results to only include public characters
    return characters.filter((character) => character.visibility === "public");
  }

  return (
    <div className="text-white w-full overflow-y-auto overflow-x-hidden md:pl-16">
      <AICharacterGrid characters={popularCharacters} />
    </div>
  );
}
