import { searchCharacters } from "./actions/index";
import { db } from "@/server/db";
import { desc, eq, asc, sql, and, or, SQL } from "drizzle-orm";
import { characters, users } from "@/server/db/schema";
import AICharacterGrid from "@/components/ai-character-grid";
import Link from "next/link";
import { Suspense } from "react";
import { Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const runtime = "edge";
const ITEMS_PER_PAGE = 36;

async function getTotalPublicCharacters() {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(characters)
    .where(eq(characters.visibility, "public"))
    .execute();
  
  return Number(result[0]?.count || 0);
}

async function getPaginatedCharacters(
  page: number,
  sortOption: string,
  tags: string[]
) {
  const offset = (page - 1) * ITEMS_PER_PAGE;

  // Initialize base condition
  let conditions: SQL<unknown>[] = [eq(characters.visibility, "public")];

  // Add tags filter if present
  if (tags.length > 0) {
    // Create tag conditions using OR logic
    const tagConditions: SQL<unknown>[] = tags.map(tag => 
      sql`${characters.tags} LIKE ${`%${tag}%`}` as SQL<unknown>
    );
    
    // Combine conditions with OR
    if (tagConditions.length > 0) {
      conditions.push(sql`(${or(...tagConditions)})` as SQL<unknown>);
    }
  }

  // Get total count
  const countResult = await db
    .select({ value: sql<number>`count(*)` })
    .from(characters)
    .where(and(...conditions))
    .execute();

  const totalItems = Number(countResult[0]?.value || 0);

  // Build and execute the main query
  let query = db
    .select({
      id: characters.id,
      name: characters.name,
      tagline: characters.tagline,
      avatar_image_url: characters.avatar_image_url,
      interactionCount: characters.interactionCount,
      createdAt: characters.createdAt,
      userName: users.name,
      userId: characters.userId,
      tags: characters.tags
    })
    .from(characters)
    .leftJoin(users, eq(characters.userId, users.id))
    .where(and(...conditions));

  // Add sorting
  const sortedQuery = (() => {
    switch (sortOption) {
      case "new":
        return query.orderBy(desc(characters.createdAt));
      case "old":
        return query.orderBy(asc(characters.createdAt));
      case "popular":
      default:
        return query.orderBy(desc(characters.interactionCount));
    }
  })();

  // Add pagination
  const paginatedResults = await sortedQuery
    .limit(ITEMS_PER_PAGE)
    .offset(offset)
    .execute();

  return {
    characters: paginatedResults,
    totalItems
  };
}

export default async function Page({ 
  searchParams 
}: { 
  searchParams: { 
    tags?: string;
    page?: string;
    sort?: string;
    id?: string;
  }
}) {
  const currentPage = Number(searchParams.page) || 1;
  const sortOption = searchParams.sort || "popular";
  const tags = searchParams.tags ? searchParams.tags.split(',') : [];
  
  const [
    { characters: paginatedCharacters, totalItems },
    totalPublicCharacters
  ] = await Promise.all([
    getPaginatedCharacters(currentPage, sortOption, tags),
    getTotalPublicCharacters()
  ]);

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const paginationInfo = {
    currentPage,
    totalPages,
    totalItems
  };

  return (
    <div className="text-white w-full overflow-y-auto overflow-x-hidden md:pl-16">
      <Banner />
      <Suspense key={searchParams.id}>
        <AICharacterGrid 
          initialCharacters={paginatedCharacters} 
          paginationInfo={paginationInfo}
          totalPublicCharacters={totalPublicCharacters}
        />
      </Suspense>
      <div className="text-gray-500 flex gap-4 mb-24 text-md flex-wrap">
        <Link href={"/about"}>
          About 
        </Link>
        <Link href={"/blog"}>
          Blog
        </Link>
        <Link href={"https://www.tiktok.com/@opencharacter"} target="_blank">
          TikTok
        </Link>
        <Link href={"https://www.reddit.com/r/OpenCharacterAI/"} target="_blank">
          Reddit
        </Link>
        <Link href={"/plans"}>
          Premium
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

const Banner = () => {
  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-600 p-12 mb-4 bg-[url('/bg-banner.webp')] bg-cover">
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2">
        <div className="h-24 w-24 rounded-full bg-purple-500/20 blur-2xl"></div>
      </div>
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400 animate-pulse" />
            <span className="text-sm font-medium text-white">Limited Time Offer</span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Want Free Access To The Premium Plan?
          </h2>
          
          <p className="text-white">
            Post about OpenCharacter on social media and get free access to the Premium Plan!
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/opencharacter-free-access-to-premium-plan-limited-time-offer" className="inline-block">
            <Button 
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              Learn More
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};