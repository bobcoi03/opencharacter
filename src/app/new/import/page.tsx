import CreateCharacterImport from "@/components/create-character-import"
import { auth } from "@/server/auth"

export const runtime = "edge"

export default async function NewCharacterImportPage() {
    const session = await auth()

    if (!session?.user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="p-8 text-center">
                    <div className="mb-8">
                        <svg className="w-24 h-24 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Sign In Required</h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        You must be signed in to create a character.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="md:ml:16">
            <CreateCharacterImport />
        </div>
    )
}