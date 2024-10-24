import SignInButton from "@/components/signin-button"
import Link from "next/link"
import { auth } from "@/server/auth"
import { redirect } from "next/navigation"

export const runtime = "edge"

export default async function SignInPage() {
    const session = await auth();
    if (session?.user) {
        redirect("/");
    }

    return (
        <div className="flex flex-col bg-neutral-900 text-gray-100 p-8 mx-auto max-w-xl mt-24">      
            <main className="flex-grow flex lg:items-center mx-auto">
                <div className="">
                    <h1 className="text-3xl font-bold mb-4">Hello, <span className="text-blue-600">welcome to OpenCharacter!</span></h1>
                    <p className="text-gray-400 mb-8">Create any chatbots for any purpose.</p>
                    
                    <div className="mb-10">
                        <SignInButton />
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-4">
                        By continuing, you agree to the{' '}
                        <Link href="/terms-of-service" className="text-blue-400 hover:underline">
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy-policy" className="text-blue-400 hover:underline">
                            Privacy Policy
                        </Link>
                    </p>

                    <p className="text-[9px] text-gray-500">
                        By signing in, you also agree to receive emails from us about product updates, news, and promotional offers. You can unsubscribe at any time.
                    </p>
                </div>
            </main>
        </div>
    )
}