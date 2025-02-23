import { db } from "@/server/db";
import { desc, eq, asc, sql, and, or, SQL } from "drizzle-orm";
import { characters, users } from "@/server/db/schema";
import AICharacterGrid from "@/components/ai-character-grid";
import Link from "next/link";
import { Suspense } from "react";
import { Check } from "lucide-react";
import { getConversations } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { CTACard, Footer } from "@/components/footer";

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
interface CharacterCardProps {
  id: string;
  character_id: string;
  character_name: string | null;
  character_avatar: string | null;
  last_message_timestamp: string;
  updated_at: string;
  interaction_count: number;
}

const CharacterCard: React.FC<CharacterCardProps> = ({
  id,
  character_id,
  character_name,
  character_avatar,
  last_message_timestamp,
  updated_at,
  interaction_count,
}) => {
  return (
    <Link
      href={`/chat/${character_id}`}
      passHref
      className="block w-full h-full max-w-48"
    >
      <Card className="bg-neutral-800 overflow-hidden rounded-lg h-full flex flex-col">
        <CardContent className="flex flex-col px-0 flex-grow">
          <div className="rounded-lg px-6 py-2">
            <div className="w-24 h-24 mx-auto mt-4 relative">
              <img
                src={character_avatar ?? "/default-avatar.jpg"}
                alt={character_name ?? ''}
                className="rounded-xl object-cover w-full h-full"
                style={{aspectRatio: "1/1"}}
              />
            </div>
          </div>
          <div className="px-1 mb-1 mt-1">
            <h3 className="mt-2 text-xs font-semibold text-gray-200 truncate text-wrap break-words text-center">
              {character_name}
            </h3>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

const RecentConversation: React.FC<{ characters: CharacterCardProps[] }> = ({ characters }) => {
  return (
    <div className="mb-4">
      <p className="text-sm text-slate-200 mb-2 mt-2 font-semibold">Continue Chatting</p>
      <div className="flex gap-2 overflow-x-auto pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-600">
        {characters.slice(0, 10).map((character) => (
          <div key={character.id} className="flex-none snap-center">
            <CharacterCard {...character} />
          </div>
        ))}
      </div>
    </div>
  );
};

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

  const conversations = await getConversations()

  return (
    <div className="text-white w-full overflow-y-auto overflow-x-hidden md:pl-16 p-2">
      
      <Suspense key={searchParams.id}>
        {!conversations.error && conversations.conversations && conversations.conversations?.length > 0 && <RecentConversation characters={conversations.conversations} />}
        <AICharacterGrid 
          initialCharacters={paginatedCharacters} 
          paginationInfo={paginationInfo}
          totalPublicCharacters={totalPublicCharacters}
        />
      </Suspense>

      <Footer />
    </div>
  );
}