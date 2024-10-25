import SignInButton from "@/components/signin-button"
import Link from "next/link"
import { auth } from "@/server/auth"
import { redirect } from "next/navigation"
import SignInPageClient from "@/components/signin-page"

export const runtime = "edge"

export default async function SignInPage() {
    const session = await auth();
    if (session?.user) {
        redirect("/");
    }

    return (
        <SignInPageClient />
    )
}