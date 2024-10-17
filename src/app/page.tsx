import { searchCharacters } from "./actions/index";
import { db } from "@/server/db";
import { desc, eq } from "drizzle-orm";
import { characters, users } from "@/server/db/schema";
import AICharacterGrid from "@/components/ai-character-grid";
import Link from "next/link";

export const runtime = "edge";

export default async function Page({ searchParams }: { searchParams: { tags?: string }} ) {
  const popularCharacters = await getPopularCharacters();

  async function getPopularCharacters() {
    return await db
      .select({
        id: characters.id,
        name: characters.name,
        tagline: characters.tagline,
        avatar_image_url: characters.avatar_image_url,
        interactionCount: characters.interactionCount,
        createdAt: characters.createdAt,
        userName: users.name,
        userId: characters.userId,
      })
      .from(characters)
      .leftJoin(users, eq(characters.userId, users.id))
      .where(eq(characters.visibility, "public"))
      .orderBy(desc(characters.interactionCount))
      .limit(500);
  }

  return (
    <div className="text-white w-full overflow-y-auto overflow-x-hidden md:pl-16">
      <AICharacterGrid initialCharacters={popularCharacters} />
      <div className="text-gray-500 flex gap-4 mb-24 text-xs flex-wrap">
        <Link href={"/about"}>
          About 
        </Link>
        <Link href={"/blog"}>
          Blog
        </Link>
        <Link href={"https://github.com/bobcoi03/opencharacter"} target="_blank">
          Github
        </Link>
        <Link href={"https://buymeacoffee.com/luongquangn"} target="_blank">
          Donate
        </Link>
        <Link href={"/privacy-policy"}>
          Privacy Policy         
        </Link>
        <Link href={"/terms-of-service"}>
          Terms of Service       
        </Link>
      </div>
    </div>
  );
}
