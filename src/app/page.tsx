import { auth } from "@/server/auth";
import { AICharacterGrid } from "@/components/ai-character-grid";
import CreateCharacterCardMarketing from "@/components/create-character-card-marketing";
import SignInButton from "@/components/signin-button";
import { searchCharacters } from "./actions/index";
import { CharacterSearchBar } from "@/components/character-search-bar";

export const runtime = "edge";

export default async function Page() {
  const session = await auth();

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
    <div className="py-8 text-white w-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 px-6">
        <div className="flex items-center space-x-3">
          {session?.user ?
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
            : (
              <SignInButton />
            )
          }
        </div>

        <CharacterSearchBar searchCharacters={search} />

      </div>

      <AICharacterGrid />

      <CreateCharacterCardMarketing />

    </div>
  );
}