import { sql } from "drizzle-orm";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { AICharacterGrid } from "@/components/ai-character-grid";
import { Search } from 'lucide-react';
import CreateCharacterCardMarketing from "@/components/create-character-card-marketing";

export const runtime = "edge";

export default async function Page() {
  const session = await auth();

  return (
    <div className="max-w-7xl mx-auto py-8 text-white w-full">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 px-6">
        <div className="flex items-center space-x-3">
          {session?.user && 
            <div className="flex md:flex-col items-center gap-2">
              <h1 className="text-lg font-light text-black dark:text-white">Welcome!</h1>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs">
                  {session?.user?.name?.[0] || 'G'}
                </div>
                <p className="text-sm font-light text-black dark:text-white">
                  {session?.user?.name || 'Guest'}
                </p>
              </div> 
            </div>
          }
        </div>
        <div className="relative w-full md:w-auto">
          <input
            type="text"
            placeholder="Search for Characters"
            className="w-full md:w-64 py-2 px-10 bg-gray-100 dark:bg-neutral-800 text-black dark:text-white rounded-full text-sm"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      <AICharacterGrid />

      <CreateCharacterCardMarketing />

    </div>
  );
}