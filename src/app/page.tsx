import { Button } from "@/components/ui/button";
import { sql } from "drizzle-orm";
import { auth, signIn, signOut } from "@/server/auth";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { AICharacterGrid } from "@/components/ai-character-grid";
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';
import CreateCharacterCardMarketing from "@/components/create-character-card-marketing";

export const runtime = "edge";

export default async function Page() {
  const session = await auth();

  const userCount = await db
    .select({
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(users);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-white w-full">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-3 flex-col">
          <h1 className="text-lg font-light text-black dark:text-white">Welcome back, </h1>
		  <div className="flex items-center gap-2 p-4">
			<div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs">
				{session?.user?.name?.[0] || 'G'}
			</div>
			<p className="text-sm font-light">
				{session?.user?.name || 'Guest'}
			</p>
		  </div>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search for Characters"
            className="w-full py-4 px-24 pl-10 bg-gray-100 dark:bg-neutral-800 text-black dark:text-white rounded-full text-sm"
          />
          <Search className="absolute left-4 top-4 w-4 h-4 text-gray-400" />
        </div>
      </div>

      <AICharacterGrid />

	  <CreateCharacterCardMarketing />

    </div>
  );
}