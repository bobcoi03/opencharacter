import { db } from "@/server/db";
import { desc, eq, asc, sql, and, or, SQL } from "drizzle-orm";
import { characters, users } from "@/server/db/schema";
import AICharacterGrid from "@/components/ai-character-grid";
import Link from "next/link";
import { Suspense } from "react";
import { Star, ArrowRight } from "lucide-react";
import { Check } from "lucide-react";
import { getConversations } from "./actions";
import { Card, CardContent } from "@/components/ui/card";

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
    <div>
      <p className="text-sm text-slate-200 mb-2 mt-2 font-semibold">Continue Chatting</p>
      <div className="flex gap-2 overflow-x-auto pb-4 snap-x snap-mandatory">
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
    <div className="text-white w-full overflow-y-auto overflow-x-hidden md:pl-16">
      <Suspense key={searchParams.id}>
        {!conversations.error && conversations.conversations && conversations.conversations?.length > 0 && <RecentConversation characters={conversations.conversations} />}
        <AICharacterGrid 
          initialCharacters={paginatedCharacters} 
          paginationInfo={paginationInfo}
          totalPublicCharacters={totalPublicCharacters}
        />
      </Suspense>
      <PricingBanner />
      <div className="text-muted-foreground py-8 px-4 md:flex md:flex-row md:justify-center md:items-center md:gap-6 text-sm">
        <div className="grid grid-cols-2 md:flex md:flex-row gap-4 md:gap-6 justify-items-center">
          <Link href="/about" className="hover:text-foreground transition-colors duration-200">
            About
          </Link>
          <Link href="/blog" className="hover:text-foreground transition-colors duration-200">
            Blog
          </Link>
          <Link href="https://www.tiktok.com/@opencharacter" target="_blank" className="hover:text-foreground transition-colors duration-200">
            TikTok
          </Link>
          <Link href="https://www.reddit.com/r/OpenCharacterAI/" target="_blank" className="hover:text-foreground transition-colors duration-200">
            Reddit
          </Link>
          <Link href="/plans" className="hover:text-foreground transition-colors duration-200">
            Premium
          </Link>
          <Link href="https://github.com/bobcoi03/opencharacter" target="_blank" className="hover:text-foreground transition-colors duration-200">
            Github
          </Link>
          <Link href="https://buymeacoffee.com/luongquangn" target="_blank" className="hover:text-foreground transition-colors duration-200">
            Donate
          </Link>
          <Link href="/privacy-policy" className="hover:text-foreground transition-colors duration-200">
            Privacy Policy
          </Link>
          <Link href="/terms-of-service" className="hover:text-foreground transition-colors duration-200">
            Terms of Service
          </Link>
          <Link href="/opencharacter-free-access-to-premium-plan-limited-time-offer" className="hover:text-foreground transition-colors duration-200 font-semibold text-yellow-400 col-span-2 md:col-span-1">
            Free Access To Paid Tier
          </Link>
        </div>
      </div>
      </div>
  );
}

const Banner = () => {
  return (
    <div className="mb-4">
      <Link href="/opencharacter-free-access-to-premium-plan-limited-time-offer" className="block">
        <div className="relative overflow-hidden rounded-lg border border-slate-600 p-12 hover:border-slate-500 transition-colors duration-200 bg-[url('/bg-banner.webp')] bg-cover">
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
              <div 
                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                Learn More
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

const PricingBanner = () => {
  const features = [
    "Access to all models (free + paid)",
    "Up to 64x more memory",
    "Up to 3x faster response time",
    "Unlimited messages"
  ];

  return (
    <div className="my-12">
      <Link href="/plans" className="block">
        <div className="relative overflow-hidden rounded-lg border border-slate-600 p-8 md:p-12 hover:border-slate-500 transition-colors duration-200 bg-[url('/bg-banner-premium.webp')] bg-cover">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2">
            <div className="h-24 w-24 rounded-full bg-blue-500/20 blur-2xl"></div>
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Upgrade to Premium
                </h2>
                <p className="text-gray-300 text-lg">
                  Starting at just <span className="text-white font-semibold">$9/month</span> with yearly plan
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className="text-sm text-gray-200">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <div 
                className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                View Plans
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};