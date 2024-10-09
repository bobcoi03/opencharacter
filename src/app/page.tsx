import { searchCharacters } from "./actions/index";
import { db } from "@/server/db";
import { desc, eq } from "drizzle-orm";
import { characters } from "@/server/db/schema";
import AICharacterGrid from "@/components/ai-character-grid";
import Link from "next/link";

export const runtime = "edge";

export default async function Page() {
  const popularCharacters = await getPopularCharacters();

  async function getPopularCharacters() {
    return await db.query.characters.findMany({
      where: eq(characters.visibility, "public"),
      orderBy: [desc(characters.interactionCount)],
      limit: 500, // Reduced for better horizontal scrolling experience
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
      <div className="text-gray-500 flex gap-4 mb-24">
        <Link href={"/about"}>
          About 
        </Link>
        <Link href={"/blog"}>
          Blog
        </Link>
        <Link href={"/privacy-policy"}>
          Privacy Policy         
        </Link>
        <Link href={"https://github.com/bobcoi03/opencharacter"} target="_blank">
          Github
        </Link>
        <Link href={"https://buymeacoffee.com/luongquangn"} target="_blank">
          Donate
        </Link>
      </div>
    </div>
  );
}
