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
    <div className="max-w-7xl mx-auto px-4 py-8 text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold p-6 text-black dark:text-white">Welcome back, {session?.user?.name || 'Guest'}</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search for Characters"
            className="w-full py-4 px-24 pl-10 bg-gray-100 dark:bg-neutral-800 text-black dark:text-white rounded-full text-sm"
          />
          <Search className="absolute left-4 top-4 w-4 h-4 text-gray-400" />
        </div>
      </div>

      <div className="mb-8 p-6">
        <h2 className="text-xl font-semibold mb-4">Who do you want to talk to?</h2>
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6">
          <h3 className="text-2xl font-bold mb-2">A trusted circle of support</h3>
          <p className="text-lg">Connect with AI friends for guidance, motivation, and companionship</p>
        </div>
      </div>

      <AICharacterGrid />

	  <CreateCharacterCardMarketing />

    </div>
  );
}